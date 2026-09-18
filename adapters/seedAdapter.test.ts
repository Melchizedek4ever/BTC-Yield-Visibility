import { describe, expect, test } from 'vitest';
import { seedAdapter } from '@/adapters/seedAdapter';
import { describeAdapterContract } from '@/test/adapterContract';
import { PROTOCOL_REGISTRY } from '@/data/protocolRegistry';
import { MARKET_BASELINE } from '@/data/marketBaseline';

// The seed adapter is the reference implementation of the contract; it must
// also faithfully carry the curated dataset into the normalized shape.
describeAdapterContract(seedAdapter);

describe('seed adapter normalization', () => {
  test('supplies the full curated dataset', async () => {
    const opps = await seedAdapter.fetchOpportunities();
    // Stated against the registry rather than a fixed count: the seam's claim
    // is that every record with a baseline becomes an opportunity, which holds
    // however many rows curation decides to carry.
    const withBaseline = PROTOCOL_REGISTRY.filter(
      r => !r.hiddenReason && MARKET_BASELINE.some(m => m.protocolId === r.id),
    );
    expect(opps.length).toBe(withBaseline.length);
    expect(opps.length).toBeGreaterThan(0);
  });

  test('withholds records marked as not ready to list', async () => {
    // Some opportunities are real and tracked but cannot yet be represented
    // honestly — no source publishes their rate or size. Keeping the curated
    // record while withholding the row means the research is not lost and
    // relisting is a one-line change, rather than a rebuild from scratch.
    const withheld = PROTOCOL_REGISTRY.filter(r => r.hiddenReason);
    const opps = await seedAdapter.fetchOpportunities();
    for (const r of withheld) {
      expect(opps.map(o => o.id)).not.toContain(r.id);
    }
    // Guard against the test passing because nothing is marked.
    expect(withheld.length).toBeGreaterThan(0);
  });

  test('splits multi-token earn assets into individual reward assets', async () => {
    const opps = await seedAdapter.fetchOpportunities();
    const multi = opps.find(o => o.earnAsset.includes('+'));
    // Guard: the curated set is expected to contain at least one multi-reward row.
    expect(multi).toBeDefined();
    expect(multi!.rewardAssets.length).toBeGreaterThan(1);
    for (const asset of multi!.rewardAssets) expect(asset).not.toContain('+');
  });

  test('joins every registry record to its market baseline', async () => {
    // The drift check, stated directly rather than inferred from a count:
    // every registry record needs a baseline, INCLUDING withheld ones, because
    // a record missing its baseline is the drift this guards against and
    // withholding must not hide it.
    const orphaned = PROTOCOL_REGISTRY.filter(
      r => !MARKET_BASELINE.some(m => m.protocolId === r.id),
    ).map(r => r.id);
    expect(orphaned, 'registry records with no market baseline').toEqual([]);

    // And a baseline with no registry record is the same drift, other way up.
    const stranded = MARKET_BASELINE.filter(
      m => !PROTOCOL_REGISTRY.some(r => r.id === m.protocolId),
    ).map(m => m.protocolId);
    expect(stranded, 'baselines with no registry record').toEqual([]);

    const opps = await seedAdapter.fetchOpportunities();
    expect(opps.length).toBe(PROTOCOL_REGISTRY.filter(r => !r.hiddenReason).length);
  });

  test('carries the curated estimate and its review date alongside the figures', async () => {
    const opps = await seedAdapter.fetchOpportunities();
    for (const o of opps) {
      // Nothing has enriched these yet, so the headline equals the baseline.
      expect(o.baseline.apy).toBe(o.apy);
      expect(o.baseline.tvlUsd).toBe(o.tvlUsd);
      expect(Number.isNaN(Date.parse(o.baseline.reviewedAt))).toBe(false);
    }
  });

  test('flags live rows as estimates and leaves coming-soon rows unflagged', async () => {
    const opps = await seedAdapter.fetchOpportunities();
    for (const o of opps) {
      expect(o.scoresEstimated).toBe(o.status === 'live' ? true : undefined);
    }
  });

  test('stamps updatedAt at fetch time, not from the seed literal', async () => {
    const before = Date.now();
    const opps = await seedAdapter.fetchOpportunities();
    for (const o of opps) {
      expect(Date.parse(o.updatedAt)).toBeGreaterThanOrEqual(before - 1000);
    }
  });
});
