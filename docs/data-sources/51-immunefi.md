# Immunefi

**Tier:** 4 — Risk & trust intelligence
**Category:** Risk intelligence (bug bounties, exploit history)
**Adapter kind:** reference — no adapter, feeds curated metadata
**Status:** reference only

## What it is

The leading bug bounty / vulnerability disclosure platform for DeFi.
Confirmed to run a bounty program for Stacks core infrastructure (PoX, BNS,
blockchain code) and for Granite Protocol specifically.

## Why trust it

An active, funded bug bounty program is a stronger trust signal than an
audit alone — it means the protocol is paying real money on an ongoing
basis for adversarial review, not a one-time checkbox before launch.
Immunefi requires working proof-of-concept exploits for reward, filtering
out noise.

## Access

- Per-protocol bounty pages, e.g. https://immunefi.com/bug-bounty/stacks/
- No general-purpose API discovered for bulk querying; check per-protocol.

## What it feeds

A candidate new field on `Protocol` — "has an active bug bounty" (boolean +
program size) — as another explainable Smart Contract Risk input alongside
`audited`/`auditFirms`. Would also surface any *disclosed* exploit history,
directly relevant to Counterparty Risk.

## Recommendation

No adapter. Check each protocol's Immunefi page by hand during onboarding,
same as Clarity Alliance — this is due-diligence research, not a live feed.
