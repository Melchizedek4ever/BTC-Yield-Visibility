# mempool.space

**Tier:** 0 — Bitcoin L1, no intermediary
**Category:** Bitcoin L1
**Adapter kind:** origin (for native Bitcoin Staking) / reference (BTC network stats)
**Status:** future — build when native Bitcoin Staking leaves "coming-soon"

## What it is

An open-source Bitcoin block explorer and REST API (based on the Esplora
engine) covering mempool state, fees, blocks, addresses, transactions, and
mining/Lightning data.

## Why trust it

Open source, no account required, widely run as self-hosted infrastructure
by exchanges and wallets specifically because it's auditable — you can run
your own instance and get identical answers. It reflects raw chain/mempool
state, not a curated or opinionated view.

## Access

- Base URL: `https://mempool.space/api`
- Auth: none
- Rate limits: unpublished soft limit, ~10 req/s; self-host for volume
- Docs: https://mempool.space/docs/api/rest

## What it feeds

`bitcoin-staking` (the pre-launch native BTC opportunity in
`lib/protocols.ts`) will need real BTC-denominated numbers once it launches:
fee rates for cost-of-entry framing, and confirmation/finality data if the
product ever surfaces bond status. Not useful for APY/TVL — those come from
the Stacks-side bonding contract once it's deployed (a Tier 1 concern, via
Hiro).

## Caveats

No historical yield or protocol data here — this is Bitcoin L1 mempool/chain
state only, useful for the *mechanics* around native BTC staking, not the
yield numbers themselves.

## Recommendation

Build a thin origin adapter when native Bitcoin Staking ships (targeted Q3
2026 per `capacityNote` in the seed data). Not worth building against a
`coming-soon` opportunity with no live contract yet.
