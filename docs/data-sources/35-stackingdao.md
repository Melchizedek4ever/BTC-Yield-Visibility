# StackingDAO

**Tier:** 2 — Protocol-native
**Category:** Protocol-native (Liquid Staking)
**Adapter kind:** origin
**Status:** blocked on Hiro contract-call (no public REST API found)

## What it is

The liquid-stacking protocol behind `stackingdao-ststx` — deposit STX,
receive the rebasing `stSTX` token, which accrues value as PoX stacking
rewards accumulate. Documented as the largest DeFi platform on Stacks.

## Why trust it

The core contract (`Stacking Dao Core V6`) is documented in detail,
including the exact mechanism for reading the stSTX/STX exchange ratio —
that's a directly readable, unambiguous on-chain number, which is about as
strong a trust signal as a DeFi yield source gets.

## Access

No public REST API found; `docs.stackingdao.com` documents the core
contract's read functions (e.g. looking up the stSTX/STX ratio) rather than
an HTTP API.

## What it feeds

`apy` for `stackingdao-ststx` can, unusually among our sources, be computed
directly and deterministically from the stSTX/STX ratio's rate of change
over time — no third party needs to compute this yield for us; the
underlying exchange rate *is* the yield.

## Caveats

Requires tracking the ratio over a window (e.g. 24h/7d) to annualize it
into an APY figure — more computation on our side than reading a
pre-computed `apy` field, but it's a first-party number with no
intermediary.

## Recommendation

Strong Hiro contract-call candidate — arguably the best case in this
research for direct on-chain reads, since the exchange-rate mechanism makes
manual APY computation both possible and more trustworthy than any third
party's number.
