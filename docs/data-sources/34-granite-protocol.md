# Granite Protocol

**Tier:** 2 — Protocol-native
**Category:** Protocol-native (Lending)
**Adapter kind:** origin
**Status:** needs manual verification — API exists but couldn't be inspected via automated fetch

## What it is

The lending protocol behind `granite-btc-supply` — BTC-collateralized
stablecoin loans, positioned as avoiding counterparty/rehypothecation risk.
Uses Pyth for price oracles (see 21-pyth-network.md).

## Why trust it

Runs a public bug bounty via Immunefi (see 51-immunefi.md) and has a
published Pyth oracle integration — both are concrete, checkable trust
signals beyond marketing claims.

## Access

- A dedicated API host exists at `https://api.granitegrc.com/` — the page
  renders as a JS-driven docs shell (likely Swagger/ReDoc) that didn't yield
  endpoint details via automated fetch during this research.
- **Action needed:** open `api.granitegrc.com` in a browser (or fetch its
  OpenAPI JSON directly, commonly at `/openapi.json` or `/swagger.json`) to
  confirm actual endpoints before building against it.

## What it feeds

`apy`, `tvlUsd` for `granite-btc-supply`. Currently covered via
`defiLlamaProject: "granite-protocol"` enrichment.

## Caveats

Don't assume the API is stable or public just because a host exists —
verify it's actually intended for external consumption (vs. internal
frontend use) before depending on it, since no rate-limit or terms-of-use
documentation surfaced in this research pass.

## Recommendation

Manually verify `api.granitegrc.com` before deciding build vs. Hiro
contract-call fallback. This is the one profile in this index with an
open question rather than a settled verdict — worth 15 minutes in a browser
before writing any code against it.
