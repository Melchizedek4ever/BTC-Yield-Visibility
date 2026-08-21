# Arkadiko

**Tier:** 2 — Protocol-native
**Category:** Protocol-native (Governance staking / AMM)
**Adapter kind:** origin
**Status:** **build — real public API, no auth**

## What it is

The protocol behind `arkadiko-diko` — the first DeFi protocol on Stacks
(launched Oct 2021), issuing the USDA stablecoin and DIKO governance token.
Publishes a documented AMM ticker/pool API.

## Why trust it

First-party maintained API with clear, stable field names
(`liquidity_in_usd`, `base_volume`, etc. — nearly identical shape to
Bitflow's, suggesting a shared convention across Stacks DEX APIs). Longest
operating history of any protocol in our seed data (protocolAge: 28 months).

## Access

- Base URL: `https://arkadiko-api.herokuapp.com`
- Auth: none
- Docs: https://docs.arkadiko.finance/additional-resources/amm-api-docs
- Endpoints:
  - `GET /api/v1/tickers` — all trading pairs (`ticker_id`, `base_currency`,
    `target_currency`, `last_price`, `liquidity_in_usd`, `bid`, `ask`,
    `high`, `low`)
  - `GET /api/v1/pools/:id` — pool detail (token addresses, balances,
    `enabled` flag)
  - `GET /api/v1/pools/:id/prices` — historical prices for the pair

## What it feeds

`tvlUsd` (from `liquidity_in_usd`) for `arkadiko-diko`. Note: this API
covers the AMM/ticker side; the DIKO *staking* yield itself (protocol fee
share) may not be exposed here and could need a separate contract read for
`apy`/`apyBase`.

## Caveats

Hosted on Heroku (`arkadiko-api.herokuapp.com`) — worth confirming current
uptime before depending on it in production; Heroku free/hobby tiers have a
history of sleep/cold-start behavior that could show up as timeouts.

## Recommendation

Build, but verify the staking-yield gap (ticker/pool data alone may not be
enough to compute `arkadiko-diko`'s actual APY — confirm whether that comes
from this API, a separate endpoint, or requires a contract read).
