import { NextResponse } from 'next/server';
import { PROTOCOL_SEED } from '@/lib/protocols';
import { normalizeOpportunityScores } from '@/lib/scoring';
import type { YieldProtocol, GlobalStats } from '@/lib/types';

const LLAMA_POOLS_URL = 'https://yields.llama.fi/pools';
const LLAMA_CHAIN_TVL_URL = 'https://api.llama.fi/v2/historicalChainTvl/Stacks';

let cachedData: { protocols: YieldProtocol[]; stats: GlobalStats; ts: number } | null = null;
const CACHE_TTL = 60_000;

interface LiveSnapshot { apy: number; tvlUsd: number }
const lastKnownGood: Record<string, LiveSnapshot> = {};

/**
 * A live APY reading is treated as a data error (not a real market move) when it falls
 * more than 80% below the midpoint of the protocol's known baseline range. Matches the
 * anomaly-detection behavior documented on /methodology.
 */
function isAnomalousApy(apyRange: { min: number; max: number }, liveApy: number): boolean {
  const baseline = (apyRange.min + apyRange.max) / 2;
  return liveApy < baseline * 0.2;
}

async function fetchLlamaPools(): Promise<Record<string, { apy: number; tvlUsd: number }>> {
  try {
    const res = await fetch(LLAMA_POOLS_URL, { next: { revalidate: 60 } });
    if (!res.ok) return {};
    const json = await res.json();
    const stacksPools: Array<{ project: string; apy: number; tvlUsd: number }> =
      (json.data ?? []).filter((p: { chain: string }) => p.chain === 'Stacks');

    const byProject: Record<string, { apy: number; tvlUsd: number }> = {};
    for (const pool of stacksPools) {
      const proj = pool.project;
      if (!byProject[proj] || pool.tvlUsd > byProject[proj].tvlUsd) {
        byProject[proj] = { apy: pool.apy ?? 0, tvlUsd: pool.tvlUsd ?? 0 };
      }
    }
    return byProject;
  } catch {
    return {};
  }
}

async function fetchChainTvl(): Promise<number> {
  try {
    const res = await fetch(LLAMA_CHAIN_TVL_URL, { next: { revalidate: 60 } });
    if (!res.ok) return 0;
    const json: Array<{ date: number; tvl: number }> = await res.json();
    return json[json.length - 1]?.tvl ?? 0;
  } catch {
    return 0;
  }
}

export async function GET() {
  const now = Date.now();
  if (cachedData && now - cachedData.ts < CACHE_TTL) {
    return NextResponse.json(cachedData);
  }

  const [llamaPools, chainTvl] = await Promise.all([fetchLlamaPools(), fetchChainTvl()]);

  const enriched = PROTOCOL_SEED.map(p => {
    const live = p.defiLlamaProject ? llamaPools[p.defiLlamaProject] : null;
    const good = p.defiLlamaProject ? lastKnownGood[p.defiLlamaProject] : undefined;

    if (live && live.apy > 0 && !isAnomalousApy(p.apyRange, live.apy)) {
      if (p.defiLlamaProject) {
        lastKnownGood[p.defiLlamaProject] = { apy: live.apy, tvlUsd: live.tvlUsd };
      }
      return {
        ...p,
        apy: parseFloat(live.apy.toFixed(2)),
        tvlUsd: live.tvlUsd,
        lastUpdated: new Date().toISOString(),
        isStale: false,
        scoresEstimated: false,
      };
    }

    // Live fetch missing, zero, or rejected as anomalous — fall back to the last
    // accepted live reading if we have one, otherwise the curated seed baseline.
    if (good) {
      return { ...p, apy: good.apy, tvlUsd: good.tvlUsd, isStale: true, scoresEstimated: false };
    }
    return { ...p, isStale: false, scoresEstimated: true };
  });

  const scored = normalizeOpportunityScores(enriched as YieldProtocol[]);

  const stats: GlobalStats = {
    totalTvl: chainTvl || scored.reduce((s, p) => s + p.tvlUsd, 0),
    bestApy: Math.max(...scored.map(p => p.apy)),
    safestApy: Math.max(...scored.filter(p => p.riskScore <= 3).map(p => p.apy), 0),
    activeSourceCount: scored.length,
  };

  cachedData = { protocols: scored, stats, ts: now };
  return NextResponse.json(cachedData);
}
