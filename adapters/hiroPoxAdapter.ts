import type { EnrichmentAdapter, NormalizedOpportunity, AdapterMetadata } from './types';

/**
 * Enrichment adapter: values the Proof-of-Transfer stacking pool from chain
 * state. Matched by the `stacksPox` marker, which exactly one registry row may
 * carry — `stacked_ustx` is a single chain-wide total, so attributing it to
 * more than one opportunity would double-count the same STX.
 *
 * TVL ONLY, deliberately. Stacking APY would have to be derived from burnchain
 * reward payouts, and that feed returns a single `reward_index` per burn block:
 * if PoX pays a reward slot the feed omits, a derived APY is understated
 * twofold, and an APY we publish too low is a number a reader cannot check
 * against anything. `stacked_ustx` is one authoritative field needing no
 * inference, so that is all this adapter claims.
 *
 * Fails soft in both directions: no stacked amount, or no price, and the row
 * keeps its curated baseline flagged `scoresEstimated`. A stacked STX count
 * published as though it were dollars would be worse than staying curated.
 */

const POX_URL = 'https://api.hiro.so/v2/pox';
const PRICE_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd';
const TIMEOUT_MS = 6_000;

const MICRO_STX = 1e6;

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return null;
    // External JSON enters as `unknown` (ts-reset); cast at the boundary.
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchStackedUstx(): Promise<number | null> {
  const json = await fetchJson<{ current_cycle?: { stacked_ustx?: number } }>(POX_URL);
  const stacked = json?.current_cycle?.stacked_ustx;
  return typeof stacked === 'number' && stacked > 0 ? stacked : null;
}

async function fetchStxUsd(): Promise<number | null> {
  const json = await fetchJson<{ blockstack?: { usd?: number } }>(PRICE_URL);
  const usd = json?.blockstack?.usd;
  return typeof usd === 'number' && usd > 0 ? usd : null;
}

export const hiroPoxAdapter: EnrichmentAdapter = {
  source: 'hiro-pox',
  getMetadata(): AdapterMetadata {
    return {
      source: 'hiro-pox',
      description: 'Stacking TVL from Stacks Proof-of-Transfer chain state',
      kind: 'enrichment',
    };
  },
  async fetchOpportunities(): Promise<NormalizedOpportunity[]> {
    return []; // enrichment-only source
  },
  async enrich(opps: NormalizedOpportunity[]): Promise<NormalizedOpportunity[]> {
    const targets = new Set(
      opps.filter(o => o.status !== 'coming-soon' && o.protocol.metadata.stacksPox).map(o => o.id),
    );
    // Nothing mapped: ask for nothing. Keeps a refresh cheap when this source
    // is registered but no row claims it.
    if (targets.size === 0) return opps;

    const [stackedUstx, stxUsd] = await Promise.all([fetchStackedUstx(), fetchStxUsd()]);
    // Whole dollars: cents on a nine-figure pool are false precision, and the
    // STX price moves further between refreshes than the rounding discards.
    const tvlUsd =
      stackedUstx !== null && stxUsd !== null
        ? Math.round((stackedUstx / MICRO_STX) * stxUsd)
        : null;

    return opps.map(o => {
      if (!targets.has(o.id)) return o;

      if (tvlUsd === null) {
        return { ...o, isStale: false, scoresEstimated: true };
      }

      return {
        ...o,
        tvlUsd,
        // APY is left on its curated baseline — see the note above.
        updatedAt: new Date().toISOString(),
        isStale: false,
        scoresEstimated: false,
      };
    });
  },
};
