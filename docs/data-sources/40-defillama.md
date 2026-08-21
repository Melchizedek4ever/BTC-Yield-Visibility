# DefiLlama

**Tier:** 3 — Cross-protocol aggregator
**Category:** Aggregator
**Adapter kind:** enrichment — **already wired**
**Status:** wired (`adapters/defillamaAdapter.ts`)

## What it is

The broadest cross-chain DeFi TVL/yields aggregator, covering 50,000+ pools.
Yield data for most listed protocols comes from community-maintained
adapters in the public `DefiLlama/yield-server` GitHub repo, not from
DefiLlama's own team scraping each protocol.

## Why trust it (and why not more than we do)

Free, no auth, broad coverage — the pragmatic default for getting *some*
live number quickly across many protocols. But it's a Tier 3 source by
design in this index: it's one hop removed from source (a community adapter
maintains the mapping, which can lag or break silently when a protocol
changes its contracts), which is exactly why `defillamaAdapter.ts` already
treats it as fallible — matched strictly by pool ID (never by project),
with anomaly rejection (`isAnomalousApy`) and a stale-value fallback
(`lastKnownGood`) rather than trusting every reading at face value.

## Access

- Pools: `https://yields.llama.fi/pools`
- Stacks chain TVL: `https://api.llama.fi/v2/historicalChainTvl/Stacks`
- Auth: none for the free tier used today
- Docs: https://docs.llama.fi/

## What it feeds

Live `apy`/`tvlUsd` overlay on top of every opportunity with a
`defiLlamaPool` ID set in `lib/protocols.ts` — currently the primary live
data path for 9 of 11 opportunities.

## Recommendation

No change needed — already correctly implemented as an enrichment adapter,
not an origin. As Tier 2 protocol-native/Hiro-based origin adapters come
online (Velar, Bitflow, Arkadiko, then the Hiro contract-call reads),
DefiLlama's role should shrink toward a cross-check/fallback rather than the
primary source it is today — but it should stay wired, since its
anomaly-detection and stale-fallback behavior is valuable even as a
secondary signal.
