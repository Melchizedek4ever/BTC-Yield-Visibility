# Blockstream Esplora API

**Tier:** 0 — Bitcoin L1, no intermediary
**Category:** Bitcoin L1
**Adapter kind:** reference / fallback
**Status:** not needed now — redundant with mempool.space

## What it is

Blockstream's own hosted instance of Esplora (the same engine mempool.space
runs), covering Bitcoin mainnet, testnet, and the Liquid Network.

## Why trust it

Blockstream is a long-standing Bitcoin infrastructure company; the API has
been public since 2021 and is used as backing data for many wallets. Same
trust class as mempool.space — both are Esplora instances reading raw chain
state, so they should agree by construction.

## Access

- Base URL: `https://blockstream.info/api`
- Auth: none
- Docs: https://github.com/Blockstream/esplora/blob/master/API.md

## What it feeds

Same role as mempool.space (Tier 0 Bitcoin L1 mechanics for native BTC
staking) — this profile exists mainly to document the fallback option, not
because we need two Bitcoin explorers wired at once.

## Recommendation

Skip. Two Esplora instances returning identical data is redundancy without
value at our scale. Keep this documented as the failover if mempool.space
has an outage — same request shape, same response schema, near-zero swap
cost if it's ever needed.
