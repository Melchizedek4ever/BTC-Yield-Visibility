# Pyth Network (Stacks price feeds)

**Tier:** 1 — Stacks infrastructure
**Category:** Stacks infrastructure / oracle
**Adapter kind:** reference — not a yield/TVL source
**Status:** reference only

## What it is

A pull-based, low-latency price oracle network, deployed on Stacks as
`.pyth-oracle-v4`, offering 300+ price feeds (crypto, FX, equities,
commodities) that Clarity contracts can read on demand.

## Why trust it

Pyth aggregates prices from major exchanges and trading firms directly
(first-party publishers), not from a single centralized source — it's the
oracle several of our represented protocols (ALEX, Arkadiko, Hermetica,
Zest, and Granite via a separate integration) already rely on for their own
pricing.

## Access

- Contract: `.pyth-oracle-v4` on Stacks mainnet/testnet
- Docs: https://docs.pyth.network/price-feeds/core/use-real-time-data/pull-integration/stacks
- Stacks-specific guide: https://docs.stacks.co/more-guides/price-oracles/pyth

## What it feeds

Not a yield or TVL source — it's a **risk signal**. "Does this protocol use
a real, first-party price oracle, or a manually-set/internal price?" is a
concrete, explainable input to the risk engine's Smart Contract Risk and
Counterparty Risk sub-factors (per the charter: "Never expose Risk Score: 87
— instead expose Liquidity Risk, Smart Contract Risk, ..."). A protocol
using Pyth is measurably lower counterparty/manipulation risk than one that
isn't.

## Recommendation

No adapter. Record oracle usage per protocol as curated metadata (a boolean
or enum on `Protocol`, similar to `audited`/`auditFirms`) rather than
building an integration — this is a one-time research fact per protocol,
not a live-changing data point.
