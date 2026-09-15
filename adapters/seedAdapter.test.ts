import { describe, expect, test } from 'vitest';
import { seedAdapter } from '@/adapters/seedAdapter';
import { describeAdapterContract } from '@/test/adapterContract';

// The seed adapter is the reference implementation of the contract; it must
// also faithfully carry the curated dataset into the normalized shape.
describeAdapterContract(seedAdapter);

describe('seed adapter normalization', () => {
  test('supplies the full curated dataset', async () => {
    const opps = await seedAdapter.fetchOpportunities();
    expect(opps.length).toBeGreaterThanOrEqual(10);
  });

  test('splits multi-token earn assets into individual reward assets', async () => {
    const opps = await seedAdapter.fetchOpportunities();
    const multi = opps.find(o => o.earnAsset.includes('+'));
    // Guard: the curated set is expected to contain at least one multi-reward row.
    expect(multi).toBeDefined();
    expect(multi!.rewardAssets.length).toBeGreaterThan(1);
    for (const asset of multi!.rewardAssets) expect(asset).not.toContain('+');
  });

  test('stamps updatedAt at fetch time, not from the seed literal', async () => {
    const before = Date.now();
    const opps = await seedAdapter.fetchOpportunities();
    for (const o of opps) {
      expect(Date.parse(o.updatedAt)).toBeGreaterThanOrEqual(before - 1000);
    }
  });
});
