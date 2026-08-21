# CoinGecko / GeckoTerminal

**Tier:** 3 — Cross-protocol aggregator
**Category:** Aggregator (asset pricing, on-chain DEX data)
**Adapter kind:** reference / optional enrichment
**Status:** not needed now

## What it is

A broad market-data API (asset prices, market caps) plus GeckoTerminal's
on-chain DEX data covering 250+ chains and 43M+ tokens.

## Why trust it

Widely used industry-standard reference for asset USD pricing — useful as a
denominator when converting token-denominated rewards (ALEX, VELAR, DIKO
emissions) into USD-comparable APY figures.

## Access

- Free tier: ~100 calls/min (Demo plan)
- Paid tiers from $35/mo (WebSocket/webhooks from $29/mo Basic)
- Docs: https://www.coingecko.com/en/api

## What it feeds

Not a yield source — a pricing utility. Relevant if/when reward-token APYs
(e.g. `alex-stx-farm`'s `apyReward: 40.0`) need to be computed from raw
token emission rates rather than trusted as a pre-computed percentage from
DefiLlama.

## Recommendation

Skip for now. DefiLlama's enrichment already returns pre-computed `apy`
values; we don't yet have a use case that requires converting raw token
emissions to USD ourselves. Revisit if/when building direct
emissions-based APY computation for the farm-style opportunities.
