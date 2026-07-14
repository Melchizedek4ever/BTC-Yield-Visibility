import type { ProtocolAdapter, NormalizedOpportunity, AdapterMetadata } from './types';

/**
 * TEMPLATE — a live protocol adapter. Copy this file to onboard a real
 * integration (ALEX, Bitflow, Velar, …). The success criterion for the whole
 * architecture: adding a protocol should require only three steps, all here.
 *
 *   1. Fetch the protocol's native API in `fetchOpportunities()`.
 *   2. Map each raw pool → NormalizedOpportunity (see seedAdapter for the shape).
 *   3. Register this adapter in services/yieldService.ts ORIGIN_ADAPTERS.
 *
 * No domain models, engines, API routes, or frontend code change.
 *
 * Returns [] until wired, so it's safe to register early.
 */
export const alexAdapter: ProtocolAdapter = {
  source: 'alex',
  getMetadata(): AdapterMetadata {
    return { source: 'alex', description: 'ALEX AMM pools (not yet wired to live API)', kind: 'origin' };
  },
  async fetchOpportunities(): Promise<NormalizedOpportunity[]> {
    // const raw = await fetch('https://api.alexlab.co/v1/pools').then(r => r.json());
    // return raw.pools.map(mapAlexPoolToNormalizedOpportunity);
    return [];
  },
};
