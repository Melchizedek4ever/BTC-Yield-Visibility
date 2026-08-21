# Velar

**Tier:** 2 — Protocol-native
**Category:** Protocol-native (DEX/LP)
**Adapter kind:** origin
**Status:** **build — real public API, no auth, cleanest of the protocol-native sources**

## What it is

The DEX behind `velar-sbtc` in our seed data. Publishes a documented, fairly
comprehensive public API covering tokens, prices, and pools.

## Why trust it

First-party maintained API, explicitly documented "for developers... to
access various data points across the protocol" — this is Velar publishing
its own numbers for external consumption, not a reverse-engineered
endpoint.

## Access

- Base URL: `https://api.velar.co`
- Auth: none
- Docs: https://docs.velar.com/velar/developers/velar-api
- Relevant endpoints:
  - `GET /pools` — all liquidity pools
  - `GET /pools/:lpTokenContractAddress` — pool by LP token
  - `GET /pools/:poolToken0/:poolToken1` — pool by token pair
  - `GET /prices` / `GET /prices/:contractAddress` — current price
  - `GET /prices/historical/:contractAddress` — historical price series
  - `GET /tickers`, `GET /tokens`, `GET /circulating-supply`

## What it feeds

`tvlUsd`, `apy`/`apyBase` for `velar-sbtc` directly from `/pools`. The
historical price endpoint is a bonus: it enables computing our own
`tvl7dChange`/`tvl30dChange` independently rather than trusting a
third-party's delta calculation.

## Caveats

No documented rate limits — poll conservatively (align with the existing
DefiLlama enrichment's ~6s timeout budget in `defillamaAdapter.ts`) until
real-world limits are observed.

## Recommendation

Build first among the protocol-native adapters — best-documented, broadest
endpoint coverage, zero auth friction. Good candidate to be the reference
implementation for "how to write a real origin adapter" that
`adapters/alexAdapter.ts`'s template comment currently points to
abstractly.
