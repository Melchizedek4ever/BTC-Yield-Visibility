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
 * curated seed values throughout. That makes the run fully deterministic and
 * exercises the failure paths the dashboard depends on most.
 *
 * Note the shape of this file: the service caches in module-global state with
 * no reset, so the whole suite can only observe ONE assembled result. That
 * limitation is the reason for the DI refactor these tests are protecting.
 */

const POOLS_URL = 'https://yields.llama.fi/pools';
const CHAIN_TVL_URL = 'https://api.llama.fi/v2/historicalChainTvl/Stacks';

const server = setupServer(
  http.get(POOLS_URL, () => HttpResponse.json({ data: [] })),
  http.get(CHAIN_TVL_URL, () => HttpResponse.json([])),
  http.get('https://api.velar.co/pools/:lpToken', () => new HttpResponse(null, { status: 404 })),
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
      expect(o.risk.overallScore).toBeGreaterThan(0);
    }
  });

  test('an unreachable enrichment source leaves rows on seed values, flagged estimated', () => {
    const zest = opportunities.find(o => o.id === 'zest-btc-supply')!;
    expect(zest.apy).toBe(3.5); // curated seed APY, untouched
    expect(zest.tvlUsd).toBe(75_900_000);
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
  //   liquidity       $75.9M TVL (>= $50M band)  → 3
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
    expect(zest().liquidityRisk.rationale).toBe('$76M TVL — deep liquidity.');
    expect(zest().protocolAgeRisk.rationale).toBe('20 months live.');
    expect(zest().yieldSustainabilityRisk.rationale).toBe('0% of APY from token emissions.');
  });

  test('CURRENT BEHAVIOUR: overall score passes through the curated seed value', () => {
    // Pinned deliberately. The overall is the curated 3.5 and is NOT derived
    // from the four factors above — the explanation names the two highest
    // computed factors while the headline number ignores them. Closing that
    // gap is the next planned change; this test documents what it replaces.
    expect(zest().overallScore).toBe(3.5);
    expect(zest().explanation).toBe(
      'Overall risk 3.5/10 — driven mostly by protocol age and smart-contract risk.',
    );
  });
});

describe('dashboard stats', () => {
  test('falls back to summed opportunity TVL when chain TVL is unavailable', () => {
    // Sum of the 11 live seed TVLs; coming-soon is excluded.
    expect(stats.totalTvl).toBe(495_986_516);
  });

  test('reports best and safest APY across live rows only', () => {
    expect(stats.bestApy).toBe(45); // alex-stx-farm
    expect(stats.safestApy).toBe(10); // dual-stacking, the highest APY at risk <= 3
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
    expect(zest.riskScore).toBe(3.5);
    expect(zest.apy).toBe(3.5);
    expect(zest.riskFactors?.map(f => f.key)).toEqual([
      'smartContract',
      'liquidity',
      'protocolAge',
      'yieldSustainability',
      'impermanentLoss',
      'rewardQuality',
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
  test('falls back to summed opportunity TVL when the source throws', async () => {
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

    expect(s.totalTvl).toBe(8_000_000);
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
