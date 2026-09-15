import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { GET } from '@/app/api/v1/opportunities/route';

/**
 * CONTRACT suite for the public API. The route advertises
 * `schema: "YieldOpportunity@1"`, which is a promise to wallets, protocols, and
 * agents that these field names are stable. Nothing else enforced that promise,
 * so a rename anywhere in the domain model or the façade could silently break
 * every downstream consumer.
 *
 * These tests assert SHAPE, not values — value behaviour belongs to the service
 * and engine suites. A failure here means the public contract moved, which is a
 * decision to make deliberately (and to version), never a refactor side effect.
 */

const server = setupServer(
  http.get('https://yields.llama.fi/pools', () => HttpResponse.json({ data: [] })),
  http.get('https://api.llama.fi/v2/historicalChainTvl/Stacks', () => HttpResponse.json([])),
  http.get('https://api.velar.co/pools/:lpToken', () => new HttpResponse(null, { status: 404 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

const REQUIRED_FIELDS = [
  'id',
  'protocolId',
  'protocol',
  'strategy',
  'depositAsset',
  'rewardAssets',
  'earnAsset',
  'apy',
  'apyBase',
  'apyReward',
  'apyRange',
  'tvlUsd',
  'tvl7dChange',
  'tvl30dChange',
  'lockup',
  'ilRisk',
  'minimumDeposit',
  'risk',
  'score',
  'healthScore',
  'status',
  'updatedAt',
] as const;

/** Present only on some rows, so allowed but not required. */
const OPTIONAL_FIELDS = ['launchTarget', 'capacityNote', 'scoresEstimated', 'isStale'] as const;

const RISK_FIELDS = [
  'overallScore',
  'smartContractRisk',
  'liquidityRisk',
  'protocolAgeRisk',
  'yieldSustainabilityRisk',
  'impermanentLossRisk',
  'rewardQualityRisk',
  'counterpartyRisk',
  'explanation',
] as const;

const SCORE_FIELDS = [
  'baseYield',
  'incentiveYield',
  'realYield',
  'sustainability',
  'riskPenalty',
  'finalScore',
] as const;

interface ApiResponse {
  data: Array<Record<string, unknown>>;
  meta: { schema: string; count: number; generatedAt: string };
}

let body: ApiResponse;

beforeAll(async () => {
  const res = await GET();
  expect(res.status).toBe(200);
  body = (await res.json()) as ApiResponse;
});

describe('response envelope', () => {
  test('wraps opportunities in a data/meta envelope', () => {
    expect(Object.keys(body).sort()).toEqual(['data', 'meta']);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  test('declares the schema version consumers pin against', () => {
    expect(body.meta.schema).toBe('YieldOpportunity@1');
  });

  test('reports a count matching the payload and a parseable timestamp', () => {
    expect(body.meta.count).toBe(body.data.length);
    expect(Number.isNaN(Date.parse(body.meta.generatedAt))).toBe(false);
  });
});

describe('opportunity shape', () => {
  test('every row carries the full required field set', () => {
    for (const row of body.data) {
      const missing = REQUIRED_FIELDS.filter(f => !(f in row));
      expect(missing, `row ${String(row.id)} is missing fields`).toEqual([]);
    }
  });

  test('no row exposes a field outside the published contract', () => {
    // Catches fields leaking out of the domain model into the public API
    // without a deliberate version bump.
    const allowed = new Set<string>([...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]);
    for (const row of body.data) {
      const extra = Object.keys(row).filter(k => !allowed.has(k));
      expect(extra, `row ${String(row.id)} exposes unpublished fields`).toEqual([]);
    }
  });

  test('exposes the risk breakdown, not just a headline number', () => {
    // The product promise: never "Risk Score: 87" with no reasoning attached.
    for (const row of body.data) {
      const risk = row.risk as Record<string, unknown>;
      expect(Object.keys(risk).sort()).toEqual([...RISK_FIELDS].sort());

      for (const factor of [
        'smartContractRisk',
        'liquidityRisk',
        'protocolAgeRisk',
        'yieldSustainabilityRisk',
        'impermanentLossRisk',
        'rewardQualityRisk',
        'counterpartyRisk',
      ]) {
        const f = risk[factor] as Record<string, unknown>;
        expect(Object.keys(f).sort()).toEqual(['rationale', 'score']);
        expect(typeof f.rationale).toBe('string');
        expect(f.rationale).not.toBe('');
      }
    }
  });

  test('exposes score components, not just the final ranking', () => {
    for (const row of body.data) {
      expect(Object.keys(row.score as object).sort()).toEqual([...SCORE_FIELDS].sort());
    }
  });
});
