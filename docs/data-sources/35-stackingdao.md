# StackingDAO

**Tier:** 2 — Protocol-native
**Category:** Protocol-native (Liquid Staking)
**Adapter kind:** enrichment — `adapters/stackingDaoAdapter.ts`
**Status:** **built** — public stats endpoint found and wired 2026-09-17

> **Corrects an earlier finding on this page.** A public, unauthenticated
> stats endpoint does exist at `https://app.stackingdao.com/api/stats`
> (measured ~4s, no auth). It returns realized APYs for every StackingDAO
> product *and* for native PoX stacking:
>
> ```json
> { "pox_cycle": 143, "apy_native": 5.93, "apy_ststx": 3.39,
>   "apy_ststxbtc": 3.81, "apy_stbtc": 2.89, "stackingdao_tvl": 45672574,
>   "stx_price": 0.249139, "btc_price": 76610.86, "ratio": 1.1859 }
> ```
>
> This is the highest-value endpoint found in the whole research pass. PoX
> pays in BTC transferred by miners each cycle, so stacking APY has to be
> *derived* from realized payouts — `hiroPoxAdapter` deliberately declines
> that derivation. StackingDAO already does it and publishes the result,
> which supplies a real rate for two rows that were previously pure guesswork.
>
> Two caveats. The adapter takes APY only: `stackingdao_tvl` is a single
> protocol-wide total covering stSTX, stSTXbtc and stBTC together, so pinning
> it to one row would overstate that row by the size of the others. And an
> operator publishing their own rate has an interest in it — this ranks below
> a chain read, and a chain-derived cycle yield should replace it eventually.
>
> `stx_price` and `btc_price` also arrive here, which is a candidate
> replacement for the CoinGecko dependency in `hiroPoxAdapter`.

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
