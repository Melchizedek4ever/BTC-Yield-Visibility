# ALEX Lab

**Tier:** 2 — Protocol-native
**Category:** Protocol-native (DEX/LP, farming)
**Adapter kind:** enrichment — `adapters/alexAdapter.ts`
**Status:** **built** — public REST API found and wired 2026-09-17

## What it is

The AMM/farming protocol behind `alex-sbtc-alex` and `alex-stx-farm` in our
seed data. Docs at `docs.alexlab.co` cover product usage (adding liquidity,
farming, self-service pool creation) in depth.

## Why trust it

The protocol's own product docs describe farm APR calculation methodology
directly ("based on the most recent cycle yields, assuming total staked
tokens remain similar"), which is useful for understanding *why* their
numbers move, even without an API.

## Access

**Corrects an earlier finding on this page.** A public, unauthenticated pool
API does exist; it is simply not linked from the developer docs.

- `GET https://api.alexlab.co/v2/public/pools` — every pool, 168 as of writing
- Auth: none. Measured response ~9.6s (whole-list only, no per-pool form)
- Fields: `pool_id`, `token_x`, `token_y`, `apr_24h`, `apr_7d`, `balance_x`,
  `balance_y`, `volume_24h`, `volume_7d`, `fee_24h`, `fee_rate_x`,
  `total_supply`, `sync_at`
- `https://api.alexgo.io/v1/allswaps` also answers, with a different shape

**ENCODING — the thing that will bite you.** Every numeric field is an
on-chain fixed-point integer scaled by **1e18**, and nothing documents this.
`apr_7d: 43582955428507760` is 4.358%. The scale is pinned by `fee_rate_x`
arriving as `5e15` for a pool whose swap fee is 0.5%. Decoding at 1e8 — the
usual Clarity convention — overstates by a factor of 10^10.

## What it feeds

`apyBase` for `alex-stx-farm` (pool 13) and `alex-sbtc-alex` (pool 125), from
`apr_7d` — realized trading-fee yield computed from actual volume. The 7-day
window is preferred over `apr_24h`, which one large trade can skew.

Not claimed: `apyReward` (emissions are paid by a separate farming contract
this endpoint does not cover) and `tvlUsd` (balances are in token units, so
valuing a pool means pricing arbitrary SIP-10 tokens).

## Caveats

**Pool 125 (ALEX/sBTC) holds no liquidity at all** — zero balances on both
sides, zero APR. The seed data previously described it as a 22.4% / $12M
opportunity. Whether the row should stay listed is a product decision; the
numbers at least now match reality.

DefiLlama has no ALEX pools at all, so there is no aggregator cross-check
available for these figures.

## Recommendation

Built. The remaining gap is the emissions half: ALEX's farm contracts publish
reward rates that this endpoint does not, so `apyReward` stays curated and
rows carrying one stay flagged estimated. Closing it means a contract read via
the Hiro proxy (see 20-hiro-stacks-api.md) — worth doing only once a pool with
real liquidity actually runs a farm.
