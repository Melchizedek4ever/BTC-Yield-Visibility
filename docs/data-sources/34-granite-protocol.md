# Granite Protocol

> **2026-09-18 — no BTC yield product exists here.**
>
> Granite's own documentation is unambiguous: *"Granite allows Liquidity
> Providers (LPs) to supply **stablecoins** to the protocol in order to earn
> yield from borrower interest payments."* sBTC is collateral you borrow
> against, never an asset you earn on.
>
> Our `granite-btc-supply` row claimed "supply BTC to earn lending interest
> from BTC borrowers" at 4.8% APY on $26M. It described a product that does not
> exist, and it was removed. Granite remains a real $6.9M protocol and is
> useful to a Bitcoin holder who wants to *borrow* against BTC — that is not
> yield, and so is out of scope for this dashboard.
>
> ## Contract reads, verified working
>
> Kept here so a BTC market becomes a fast integration rather than a fresh
> investigation. Granite's contracts are open source at
> `github.com/GraniteProtocol/core-v1`, with mainnet principals in
> `deployments/mainnet-plan-*.yaml`.
>
> State contract: `SP35E2BBMDT2Y1HB0NTK139YBGYV3PAPK3WA8BRNA.state-v1`
> (note: NOT the `SP26NGV9...` sender that publishes the other contracts —
> the deployment is split across two principals, which costs an hour if you
> assume otherwise).
>
> Called through Hiro's read-only proxy, all confirmed answering:
>
> ```
> POST https://api.hiro.so/v2/contracts/call-read/
>      SP35E2BBMDT2Y1HB0NTK139YBGYV3PAPK3WA8BRNA/state-v1/{function}
>      {"sender":"SP35E2BBMDT2Y1HB0NTK139YBGYV3PAPK3WA8BRNA","arguments":[]}
> ```
>
> | Function | Returns |
> |---|---|
> | `get-open-interest` | tuple: lp / protocol / staked open interest |
> | `free-liquidity` | uint — unborrowed assets |
> | `get-lp-params` | tuple: `total-assets`, `total-shares` |
> | `get-accrue-interest-params` | tuple: interest accrual state |
> | `get-protocol-reserve-percentage` | uint — the reserve cut |
> | `get-total-supply` | uint — LP share supply |
>
> **Utilization** — the lending signal the risk engine is missing — is
> `open-interest / (open-interest + free-liquidity)`, both readable above.
> The supply rate is the borrow rate minus the protocol reserve percentage,
> per Granite's interest-rate model page. Responses are Clarity hex and need
> decoding; there is no JSON form.

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
