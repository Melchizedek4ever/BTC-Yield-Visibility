# Hermetica

**Tier:** 2 — Protocol-native
**Category:** Protocol-native (Delta-neutral BTC vault)
**Adapter kind:** origin
**Status:** blocked on Hiro contract-call (no public REST API found)

## What it is

The vault behind `hermetica-hbtc` — a self-custodial, delta-neutral BTC
yield strategy (spot BTC + short perpetual futures) that reflects daily
yield directly in the hBTC token's Net Asset Value.

## Why trust it

Documents its own risk controls explicitly (pre-defined leverage/delta/
interest-spread limits, no discretionary manual trading, automated
off-grid keepers) and states all transactions are on-chain and
independently verifiable — a protocol that's designed to be checked, not
just trusted.

## Access

No public REST API found; `docs.hermetica.fi` documents the yield/NAV
mechanism conceptually rather than exposing an HTTP endpoint.

## What it feeds

`apy` for `hermetica-hbtc` is, per their own docs, directly observable as
the NAV growth rate of the hBTC token — similar in spirit to StackingDAO's
exchange-rate approach: track a value over time rather than trust a
pre-computed percentage.

## Caveats

Delta-neutral basis-trade yield is inherently more volatile and dependent
on off-chain futures funding rates than pure on-chain lending/staking yield
— this is reflected in the seed data's wider `apyRange: { min: 8, max: 16 }`
and higher `smartContractRisk: "Medium"`. Any live adapter should preserve
that wider uncertainty band rather than presenting a single point estimate
with false precision.

## Recommendation

Hiro contract-call candidate (read hBTC's NAV over time), same pattern as
StackingDAO. Lower priority than Velar/Bitflow/Arkadiko since it requires
tracking a time series rather than reading one current value.
