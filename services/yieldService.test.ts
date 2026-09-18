import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { createYieldService, getDashboard, getOpportunities } from '@/services/yieldService';
import { makeOpportunity, makeProtocol } from '@/test/factories';
import type { EnrichmentAdapter, NormalizedOpportunity, ProtocolAdapter } from '@/adapters/types';
import type { YieldOpportunity } from '@/domain/yieldOpportunity';
import type { GlobalStats, YieldProtocol } from '@/lib/types';

/**
 * CHARACTERIZATION suite — pins the service's behaviour as it is today, before
 * the DI refactor. These assertions are a safety net, not a specification:
 * they exist so a refactor that changes observable output fails loudly.
 *
 * Seam: getOpportunities() / getDashboard(). Every external call is mocked at
 * the network boundary (MSW); the real seed adapter, enrichment adapters, risk
 * engine, and scoring engine all run for real.
 *
 * Scenario: every upstream source unavailable, so the pipeline falls back to
 * the curated market baseline throughout. That makes the run fully
 * deterministic and exercises the failure paths the dashboard depends on most.
 *
 * The suite observes a single assembled result from the default service
 * instance, which is why it reads as one snapshot. Tests needing more than one
 * scenario build their own instance through createYieldService() below.
 */

const POOLS_URL = 'https://yields.llama.fi/poolsEnriched';
const CHAIN_TVL_URL = 'https://api.llama.fi/v2/historicalChainTvl/Stacks';

const server = setupServer(
  http.get(POOLS_URL, () => HttpResponse.json({ status: 'success', data: [] })),
  http.get(CHAIN_TVL_URL, () => HttpResponse.json([])),
  http.get('https://api.velar.co/pools/:lpToken', () => new HttpResponse(null, { status: 404 })),
  http.get('https://api.hiro.so/v2/pox', () => new HttpResponse(null, { status: 503 })),
  http.get('https://api.coingecko.com/api/v3/simple/price', () => new HttpResponse(null, { status: 503 })),
);

let opportunities: YieldOpportunity[];
let protocols: YieldProtocol[];
let stats: GlobalStats;

beforeAll(async () => {
  server.listen({ onUnhandledRequest: 'error' });
  const dashboard = await getDashboard();
  protocols = dashboard.protocols;
  stats = dashboard.stats;
  opportunities = await getOpportunities();
});

afterAll(() => server.close());

describe('pipeline assembly', () => {
  test('emits one opportunity per seeded protocol, in seed order', () => {
    expect(opportunities.map(o => o.id)).toEqual([
      'bitcoin-staking',
      'dual-stacking',
      'native-stacking',
      'hermetica-hbtc',
      'stackingdao-ststx',
      'zest-btc-supply',
      'granite-btc-supply',
      'bitflow-sbtc-stx',
      'alex-sbtc-alex',
      'velar-sbtc',
      'alex-stx-farm',
      'arkadiko-diko',
    ]);
  });

  test('gives every opportunity a risk assessment and a score', () => {
    // Guards the non-null assertions in toOpportunity(): a dropped id there is
    // a production crash, not a type error.
    for (const o of opportunities) {
      expect(o.risk).toBeDefined();
      expect(o.score).toBeDefined();
      // 0 is the unrated sentinel, reserved for rows that have not launched.
      if (o.status === 'coming-soon') {
        expect(o.risk.overallScore).toBe(0);
      } else {
        expect(o.risk.overallScore).toBeGreaterThan(0);
      }
    }
  });

  test('an unreachable enrichment source leaves rows on seed values, flagged estimated', () => {
    const zest = opportunities.find(o => o.id === 'zest-btc-supply')!;
    // Stated against the row's own carried baseline rather than today's
    // literals: the claim is that nothing overwrote the seed, and that stays
    // true when a figure is re-reviewed.
    expect(zest.apy).toBe(zest.baseline.apy);
    expect(zest.tvlUsd).toBe(zest.baseline.tvlUsd);
    expect(zest.scoresEstimated).toBe(true);
    expect(zest.isStale).toBe(false);
  });

  test('leaves coming-soon rows unrated and unenriched', () => {
    const soon = opportunities.find(o => o.id === 'bitcoin-staking')!;
    expect(soon.status).toBe('coming-soon');
    expect(soon.scoresEstimated).toBeUndefined();
    expect(soon.risk.explanation).toBe('Unrated until live.');
  });

  test('stamps a parseable refresh timestamp on every row', () => {
    for (const o of opportunities) {
      expect(Number.isNaN(Date.parse(o.updatedAt))).toBe(false);
    }
  });
});

describe('risk decomposition (worked example: Zest — BTC Supply)', () => {
  // Hand-computed from the seed record, independent of the engine's arithmetic:
  //   smart contract  "Low" base 3, audited      → 3
  //   liquidity       $50.6M TVL (>= $50M band)  → 3
  //   protocol age    20 months (>= 12 band)     → 4.5
  //   sustainability  0% of APY from emissions   → 1
  const zest = () => opportunities.find(o => o.id === 'zest-btc-supply')!.risk;

  test('scores each factor from the opportunity own attributes', () => {
    expect(zest().smartContractRisk.score).toBe(3);
    expect(zest().liquidityRisk.score).toBe(3);
    expect(zest().protocolAgeRisk.score).toBe(4.5);
    expect(zest().yieldSustainabilityRisk.score).toBe(1);
  });

  test('gives each factor a human-readable rationale', () => {
    expect(zest().smartContractRisk.rationale).toBe('Low contract complexity; audited (Clarity Alliance).');
    expect(zest().liquidityRisk.rationale).toBe('$51M TVL — deep liquidity.');
    expect(zest().protocolAgeRisk.rationale).toBe('20 months live.');
    expect(zest().yieldSustainabilityRisk.rationale).toBe('0% of APY from token emissions.');
  });

  test('derives the overall score from the factors, not the curated seed value', () => {
    // Continuing the worked example, with counterparty 4.5 (Lending):
    //   weighted mean = 3(.25) + 3(.17) + 4.5(.16) + 1(.13) + 1(.11)
    //                 + 1(.10) + 4.5(.08) = 2.68
    //   worst factor  = 4.5
    //   overall       = 0.7 * 2.68 + 0.3 * 4.5 = 3.226 -> 3.2
    // The curated seed value for this row is 3.5 and is deliberately unused,
    // so the headline number and the reasons beneath it now agree.
    expect(zest().overallScore).toBe(3.2);
    expect(zest().explanation).toBe(
      'Overall risk 3.2/10 — driven mostly by protocol age and counterparty risk.',
    );
  });
});

describe('dashboard stats', () => {
  test('reports chain TVL as unavailable rather than substituting a different measure', () => {
    // The stat is labelled "Stacks DeFi TVL" and means DefiLlama's chain-wide
    // figure. Summing our tracked rows answers a different question — these
    // rows include consensus-level stacking that chain DeFi TVL excludes — so
    // standing one in for the other would publish a number under a label it
    // does not belong to. 0 reads as unavailable.
    expect(stats.totalTvl).toBe(0);
  });

  test('reports best and safest APY across live rows only', () => {
    const live = opportunities.filter(o => o.status !== 'coming-soon');
    const comingSoon = opportunities.filter(o => o.status === 'coming-soon');

    // Stated as the properties that define these stats — that the headline is
    // a real row's APY, that no live row beats it, and that coming-soon rows
    // are excluded however attractive their launch target. Pinning whichever
    // row tops the dataset would break on every baseline review without any
    // behaviour changing.
    expect(live.map(o => o.apy)).toContain(stats.bestApy);
    for (const o of live) expect(o.apy).toBeLessThanOrEqual(stats.bestApy);
    for (const o of comingSoon) expect(stats.bestApy).not.toBe(o.apy);

    const safe = live.filter(o => o.risk.overallScore <= 3);
    expect(safe.map(o => o.apy)).toContain(stats.safestApy);
    for (const o of safe) expect(o.apy).toBeLessThanOrEqual(stats.safestApy);
    // The safest band is a subset, so it can never out-yield the whole set.
    expect(stats.safestApy).toBeLessThanOrEqual(stats.bestApy);
  });

  test('counts live, upcoming, and estimated rows', () => {
    expect(stats.activeSourceCount).toBe(11);
    expect(stats.upcomingCount).toBe(1);
    expect(stats.estimatedCount).toBe(11); // no live source reachable in this scenario
  });
});

describe('legacy dashboard facade', () => {
  test('flattens each opportunity to the shape the frontend reads', () => {
    const zest = protocols.find(p => p.id === 'zest-btc-supply')!;
    expect(zest.name).toBe('Zest — BTC Supply');
    expect(zest.riskScore).toBe(3.2);
    expect(zest.apy).toBe(opportunities.find(o => o.id === 'zest-btc-supply')!.apy);
    expect(zest.riskFactors?.map(f => f.key)).toEqual([
      'smartContract',
      'liquidity',
      'protocolAge',
      'yieldSustainability',
      'impermanentLoss',
      'rewardQuality',
      'counterparty',
    ]);
  });

  test('omits risk factors for coming-soon rows', () => {
    const soon = protocols.find(p => p.id === 'bitcoin-staking')!;
    expect(soon.riskFactors).toBeUndefined();
  });
});

// ── Pipeline semantics, driven through the injected seam ───────────────────
// These exercise behaviour that already exists but was previously unreachable:
// with the adapters, clock, and chain-TVL source hardcoded, there was no way to
// feed the pipeline controlled inputs without mocking our own modules.

const noChainTvl = async () => 0;

function originStub(opps: NormalizedOpportunity[], source = 'stub'): ProtocolAdapter {
  return {
    source,
    getMetadata: () => ({ source, description: 'test origin', kind: 'origin' }),
    fetchOpportunities: async () => opps,
  };
}

function failingOrigin(source = 'broken'): ProtocolAdapter {
  return {
    source,
    getMetadata: () => ({ source, description: 'always throws', kind: 'origin' }),
    fetchOpportunities: async () => {
      throw new Error('upstream is down');
    },
  };
}

/** An enricher that stamps a fixed APY onto every row, so precedence is visible. */
function apyStamper(source: string, apy: number): EnrichmentAdapter {
  return {
    source,
    getMetadata: () => ({ source, description: 'test enricher', kind: 'enrichment' }),
    fetchOpportunities: async () => [],
    enrich: async opps => opps.map(o => ({ ...o, apy })),
  };
}

describe('origin adapter failure isolation', () => {
  test('a source that throws is skipped, and the rest still assemble', async () => {
    const svc = createYieldService({
      originAdapters: [failingOrigin(), originStub([makeOpportunity({ id: 'survivor' })])],
      enrichmentAdapters: [],
      chainTvlSource: noChainTvl,
    });

    const opps = await svc.getOpportunities();

    expect(opps.map(o => o.id)).toEqual(['survivor']);
  });

  test('every source failing yields an empty dashboard rather than an error', async () => {
    const svc = createYieldService({
      originAdapters: [failingOrigin('a'), failingOrigin('b')],
      enrichmentAdapters: [],
      chainTvlSource: noChainTvl,
    });

    const { protocols: rows, stats: s } = await svc.getDashboard();

    expect(rows).toEqual([]);
    expect(s.activeSourceCount).toBe(0);
    expect(s.bestApy).toBe(0); // Math.max seeded with 0, not -Infinity
  });
});

describe('enrichment precedence', () => {
  test('later enrichers overlay earlier ones, so a first-party reading wins', async () => {
    // The ordering guarantee documented on defaultDeps: DefiLlama is the broad
    // baseline, protocol-native sources run after and take precedence.
    const svc = createYieldService({
      originAdapters: [originStub([makeOpportunity({ id: 'contested', apy: 1 })])],
      enrichmentAdapters: [apyStamper('broad-baseline', 10), apyStamper('first-party', 20)],
      chainTvlSource: noChainTvl,
    });

    const [o] = await svc.getOpportunities();

    expect(o.apy).toBe(20);
  });

  test('risk and score are computed after enrichment, not before', async () => {
    // Matters because the risk engine reads TVL and the emissions share: scoring
    // a pre-enrichment snapshot would rate rows on stale seed numbers.
    const thinLiquidity: EnrichmentAdapter = {
      source: 'drain',
      getMetadata: () => ({ source: 'drain', description: 'test enricher', kind: 'enrichment' }),
      fetchOpportunities: async () => [],
      enrich: async opps => opps.map(o => ({ ...o, tvlUsd: 1_000_000 })),
    };

    const svc = createYieldService({
      originAdapters: [originStub([makeOpportunity({ id: 'drained', tvlUsd: 500e6 })])],
      enrichmentAdapters: [thinLiquidity],
      chainTvlSource: noChainTvl,
    });

    const [o] = await svc.getOpportunities();

    // $1M TVL sits in the lowest band → 9, not the 1.5 the seed's $500M implies.
    expect(o.risk.liquidityRisk.score).toBe(9);
    expect(o.risk.liquidityRisk.rationale).toBe('$1M TVL — thin liquidity.');
  });
});

describe('enrichment adapter failure isolation', () => {
  function failingEnricher(source = 'broken-enricher'): EnrichmentAdapter {
    return {
      source,
      getMetadata: () => ({ source, description: 'always throws', kind: 'enrichment' }),
      fetchOpportunities: async () => [],
      enrich: async () => {
        throw new Error('enrichment source is down');
      },
    };
  }

  test('an enricher that throws is skipped, and later enrichers still run', async () => {
    const svc = createYieldService({
      originAdapters: [originStub([makeOpportunity({ id: 'resilient', apy: 1 })])],
      enrichmentAdapters: [apyStamper('baseline', 10), failingEnricher(), apyStamper('first-party', 20)],
      chainTvlSource: noChainTvl,
    });

    const [o] = await svc.getOpportunities();

    expect(o.apy).toBe(20);
  });

  test('a mid-pipeline failure keeps the work earlier enrichers already did', async () => {
    const svc = createYieldService({
      originAdapters: [originStub([makeOpportunity({ id: 'partial', apy: 1 })])],
      enrichmentAdapters: [apyStamper('baseline', 10), failingEnricher()],
      chainTvlSource: noChainTvl,
    });

    const [o] = await svc.getOpportunities();

    expect(o.apy).toBe(10); // the baseline overlay survives
  });

  test('every enricher failing still serves origin rows rather than erroring', async () => {
    const svc = createYieldService({
      originAdapters: [originStub([makeOpportunity({ id: 'bare', apy: 7 })])],
      enrichmentAdapters: [failingEnricher('a'), failingEnricher('b')],
      chainTvlSource: noChainTvl,
    });

    const { protocols: rows } = await svc.getDashboard();

    expect(rows).toHaveLength(1);
    expect(rows[0].apy).toBe(7);
  });
});

describe('chain TVL source failure', () => {
  test('reports 0 rather than a substitute measure when the source throws', async () => {
    const svc = createYieldService({
      originAdapters: [
        originStub([
          makeOpportunity({ id: 'a', tvlUsd: 5_000_000 }),
          makeOpportunity({ id: 'b', tvlUsd: 3_000_000 }),
        ]),
      ],
      enrichmentAdapters: [],
      chainTvlSource: async () => {
        throw new Error('chain TVL endpoint is down');
      },
    });

    const { stats: s } = await svc.getDashboard();

    expect(s.totalTvl).toBe(0);
  });
});

describe('curated baseline survives enrichment', () => {
  test('a live reading overwrites the headline figures but not the baseline', async () => {
    // This is what lets the UI show "live 0.8% / estimate 3.5%" rather than
    // silently replacing one with the other. If enrichment overwrote the
    // baseline, the two could never be compared and a wrong estimate would
    // disappear the moment real data arrived.
    const svc = createYieldService({
      originAdapters: [
        originStub([
          makeOpportunity({
            id: 'enriched',
            apy: 3.5,
            tvlUsd: 75_900_000,
            baseline: { apy: 3.5, tvlUsd: 75_900_000, reviewedAt: '2026-08-21' },
          }),
        ]),
      ],
      enrichmentAdapters: [apyStamper('live-source', 0.8)],
      chainTvlSource: noChainTvl,
    });

    const [o] = await svc.getOpportunities();

    expect(o.apy).toBe(0.8); // the live reading wins the headline
    expect(o.baseline).toEqual({ apy: 3.5, tvlUsd: 75_900_000, reviewedAt: '2026-08-21' });
  });
});

describe('cache semantics', () => {
  /** Counts how many times the pipeline actually ran. */
  function countingOrigin() {
    let calls = 0;
    const adapter: ProtocolAdapter = {
      source: 'counter',
      getMetadata: () => ({ source: 'counter', description: 'counts calls', kind: 'origin' }),
      fetchOpportunities: async () => {
        calls += 1;
        return [makeOpportunity({ id: 'counted', protocol: makeProtocol() })];
      },
    };
    return { adapter, calls: () => calls };
  }

  test('serves a cached result for repeat calls inside the TTL', async () => {
    const origin = countingOrigin();
    const svc = createYieldService({
      originAdapters: [origin.adapter],
      enrichmentAdapters: [],
      chainTvlSource: noChainTvl,
      now: () => 1_000,
      cacheTtlMs: 60_000,
    });

    await svc.getOpportunities();
    await svc.getOpportunities();
    await svc.getDashboard(); // both entry points share one cache

    expect(origin.calls()).toBe(1);
  });

  test('reassembles once the TTL has elapsed', async () => {
    const origin = countingOrigin();
    let clock = 1_000;
    const svc = createYieldService({
      originAdapters: [origin.adapter],
      enrichmentAdapters: [],
      chainTvlSource: noChainTvl,
      now: () => clock,
      cacheTtlMs: 60_000,
    });

    await svc.getOpportunities();
    clock += 59_999; // still inside the window
    await svc.getOpportunities();
    expect(origin.calls()).toBe(1);

    clock += 1; // exactly at the boundary — the window is half-open
    await svc.getOpportunities();
    expect(origin.calls()).toBe(2);
  });

  test('each service instance starts with a cold cache', async () => {
    const first = countingOrigin();
    const second = countingOrigin();
    const deps = { enrichmentAdapters: [], chainTvlSource: noChainTvl };

    await createYieldService({ ...deps, originAdapters: [first.adapter] }).getOpportunities();
    await createYieldService({ ...deps, originAdapters: [second.adapter] }).getOpportunities();

    expect(first.calls()).toBe(1);
    expect(second.calls()).toBe(1);
  });
});
