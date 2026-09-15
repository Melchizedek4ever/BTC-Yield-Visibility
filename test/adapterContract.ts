import { describe, expect, test } from 'vitest';
import type { ProtocolAdapter } from '@/adapters/types';

/**
 * Shared adapter contract — the executable onboarding spec.
 *
 * Every adapter (current or future) must pass this suite unchanged; a new
 * protocol integration is done when `describeAdapterContract(myAdapter)`
 * goes green. It asserts only what the downstream pipeline (risk engine,
 * scoring engine, service) genuinely relies on.
 */
export function describeAdapterContract(adapter: ProtocolAdapter) {
  describe(`adapter contract: ${adapter.source}`, () => {
    test('metadata is consistent with the adapter', () => {
      const meta = adapter.getMetadata();
      expect(meta.source).toBe(adapter.source);
      expect(['origin', 'enrichment']).toContain(meta.kind);
      expect(meta.description.length).toBeGreaterThan(0);
    });

    test('enrichment adapters emit no opportunities of their own', async () => {
      if (adapter.getMetadata().kind !== 'enrichment') return;
      expect(await adapter.fetchOpportunities()).toEqual([]);
    });

    test('every emitted opportunity satisfies the pipeline invariants', async () => {
      const opps = await adapter.fetchOpportunities();

      const ids = opps.map(o => o.id);
      expect(new Set(ids).size).toBe(ids.length); // ids collide silently downstream

      for (const o of opps) {
        // Yield decomposition must be internally consistent — the risk and
        // scoring engines derive emission share and real yield from it.
        expect(o.apy).toBeCloseTo(o.apyBase + o.apyReward, 6);
        expect(o.apyBase).toBeGreaterThanOrEqual(0);
        expect(o.apyReward).toBeGreaterThanOrEqual(0);
        expect(o.apyRange.min).toBeLessThanOrEqual(o.apyRange.max);

        expect(o.tvlUsd).toBeGreaterThanOrEqual(0);
        expect(o.healthScore).toBeGreaterThanOrEqual(1);
        expect(o.healthScore).toBeLessThanOrEqual(10);
        // Every origin adapter must state the estimate it fell back from,
        // and when a human last checked it.
        expect(o.baseline.apy).toBeGreaterThanOrEqual(0);
        expect(o.baseline.tvlUsd).toBeGreaterThanOrEqual(0);
        expect(Number.isNaN(Date.parse(o.baseline.reviewedAt))).toBe(false);

        expect(['live', 'coming-soon']).toContain(o.status);
        expect(Number.isNaN(Date.parse(o.updatedAt))).toBe(false);

        expect(o.protocol.id.length).toBeGreaterThan(0);
        expect(o.depositAsset.length).toBeGreaterThan(0);
        expect(o.earnAsset.length).toBeGreaterThan(0);
        expect(o.rewardAssets.length).toBeGreaterThan(0);
      }
    });
  });
}
