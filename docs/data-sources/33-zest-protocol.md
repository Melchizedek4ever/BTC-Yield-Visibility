# Zest Protocol

**Tier:** 2 — Protocol-native
**Category:** Protocol-native (Lending)
**Adapter kind:** origin
**Status:** blocked on Hiro contract-call (no public REST API found)

## What it is

The lending protocol behind `zest-btc-supply` — modeled on Aave v3, written
in Clarity, split into a Bitcoin Market and a Stacks Market. The largest
BTC lending protocol on Bitcoin L2s by the search results (~$100M peak TVL,
2+ years mainnet history).

## Why trust it

Long operating history relative to the Stacks DeFi ecosystem, and
architecturally modeled on a well-understood, audited design pattern
(Aave v3) rather than novel unaudited mechanics.

## Access

No public REST API for market/pool data found — `docs.zestprotocol.com` is
product/protocol documentation, not an API reference. Interest rates and
supply/borrow amounts live in the deployed Clarity market contracts.

## What it feeds

`apy` (supply interest rate) and `tvlUsd` (total supplied) for
`zest-btc-supply`. Currently covered via `defiLlamaProject: "zest-protocol"`
enrichment.

## Caveats

Aave-v3-style markets typically expose supply/borrow rates as public
read-only contract functions (reserve data), which makes this a strong
candidate for direct Hiro contract-call reads once the specific contract
principal and function signature are confirmed from Zest's deployed
contracts list.

## Recommendation

Same pattern as ALEX: no bespoke REST client to build. Read the market
contract's reserve-data function via Hiro once time is budgeted for it;
DefiLlama enrichment is the correct interim source.
