import { describe, expect, test } from 'vitest';
import { alexAdapter } from '@/adapters/alexAdapter';
import { describeAdapterContract } from '@/test/adapterContract';

// Template adapter: registered but not yet wired, so it must stay inert.
describeAdapterContract(alexAdapter);

describe('alex adapter (template)', () => {
  test('emits nothing until wired to the live API', async () => {
    expect(await alexAdapter.fetchOpportunities()).toEqual([]);
  });
});
