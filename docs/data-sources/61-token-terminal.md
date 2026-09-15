# Token Terminal

**Tier:** 5 — Fundamentals/research (optional)
**Category:** Fundamentals (protocol revenue)
**Adapter kind:** n/a
**Status:** not recommended now

## What it is

"Bloomberg of crypto" — normalizes on-chain data into standardized
financial metrics (revenue, fees, earnings, P/E-style ratios) across 100+
chains and thousands of dApps.

## Why it's interesting, why not now

Directly maps to "Yield Sustainability" (real fee revenue vs. token-emission
-subsidized yield is precisely the real-yield-vs-incentive-yield distinction
the charter's Scoring Engine section calls out). But coverage of small
Stacks-ecosystem protocols (Bitflow, Arkadiko, Granite, etc.) is unlikely to
exist on a platform built around major multi-chain protocols, and it's a
paid product.

## Recommendation

Skip. The real-yield-vs-incentive-yield distinction this would inform is
already partially captured today via `apyBase` vs `apyReward` in
`NormalizedOpportunity` — good enough for v1 without an external
subscription. Revisit if/when a protocol we track gets meaningful Token
Terminal coverage.
