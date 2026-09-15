# ALEX Lab

**Tier:** 2 — Protocol-native
**Category:** Protocol-native (DEX/LP, farming)
**Adapter kind:** origin, currently stubbed at `adapters/alexAdapter.ts`
**Status:** blocked on Hiro contract-call (no public REST API found)

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

No public REST API for pool/yield data was found during this research —
`docs.alexlab.co/developers` is largely whitepaper/architecture content, not
an API reference. Data is on-chain in ALEX's deployed Clarity contracts.

## What it feeds

`apy`, `apyBase`, `apyReward`, `tvlUsd` for both ALEX opportunities.
Currently covered indirectly via `defiLlamaProject: "alex"` in the DefiLlama
enrichment adapter (Tier 3) — that's the live path today.

## Caveats

DefiLlama's ALEX numbers come from a community-maintained scraper in
DefiLlama's `yield-server` repo, not from ALEX directly — one hop removed
from source, and only as fresh/correct as that scraper.

## Recommendation

Don't build a bespoke `alex.com` REST client — none exists to build against.
When ready to close the DefiLlama-dependency gap, read ALEX's farm/pool
contracts directly via the Hiro contract-call proxy (see
20-hiro-stacks-api.md) instead of chasing an undocumented private API.
Until then, the current DefiLlama-enrichment path is the pragmatic choice —
correctly reflected in the stub comment in `adapters/alexAdapter.ts`.
