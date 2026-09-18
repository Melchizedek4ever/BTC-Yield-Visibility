# Zest Protocol

> **2026-09-18 — product suite has changed. BTCz no longer exists.**
>
> BTCz (Babylon-backed BTC liquid staking, announced 2024) is absent from
> Zest's current documentation. What Zest ships today:
>
> - **Stacks Market V2** — supply assets, earn borrower interest. Covers
>   `zest-btc-supply` and `zest-ststxbtc-supply`. Live on DefiLlama, which is
>   the only Stacks protocol it carries pool-level yield for.
> - **Bitcoin Collateral Vaults** — borrow against BTC held in a vault on
>   Bitcoin L1. Borrowing, not yield; out of scope.
> - **zvstBTC Vault** — Zest's first Stacks Vault, and the significant one.
>
> ## zvstBTC — the top integration target
>
> An automated levered Bitcoin staking strategy. The vault posts StackingDAO's
> stBTC as collateral, borrows sBTC against it, stakes that into more stBTC,
> and loops within its risk limits. Deposits accepted in BTC, sBTC or stBTC;
> depositors hold zvstBTC shares that appreciate against the underlying.
>
> Zest publishes a **6–8% target**. That is an aspiration, not a reading:
> realised return is staking yield on the levered position minus borrowing
> cost, and it moves against the depositor when borrowing costs or utilisation
> rise. The row therefore carries `unpublishedRate` rather than a number.
>
> **Why it matters:** it is the highest-yield genuinely BTC-denominated
> opportunity on Stacks, and no aggregator covers it.
>
> **Why the risk rating is high despite Zest's maturity:** a deposit rides
> three contract surfaces at once — the vault, Zest's lending market, and
> StackingDAO's staking — plus liquidation risk on the levered position. The
> risk engine should say so loudly, and the curated record does.
>
> ## What an adapter needs
>
> No public API or contract principal is published for the vault. Two routes,
> in order of preference:
>
> 1. **Share price on chain.** zvstBTC is a share token whose price rises with
>    the strategy. Two readings of the share/asset ratio a known interval apart
>    give a realised, checkable APY — far better than any published target.
>    Needs the vault contract principal, which is not in the docs; find it via
>    Hiro's address-transaction listing for Zest's deployer, or ask Zest.
> 2. **Ask Zest directly.** They are building distribution; an endpoint for
>    vault TVL and realised APY costs them little.
>
> TVL is likewise unsourced today — DefiLlama carries Zest V2 as one protocol
> with no vault breakdown. The baseline records 0 deliberately, which drives
> liquidity risk to its maximum rather than flattering the row.

**Tier:** 2 — Protocol-native
**Category:** Protocol-native (Lending)
**Adapter kind:** origin
**Status:** blocked on Hiro contract-call (no public REST API found)

## What it is

The lending protocol behind `zest-btc-supply` — modeled on Aave v3, written
in Clarity, split into a Bitcoin Market and a Stacks Market. The largest
BTC lending protocol on Bitcoin L2s by the search results (~$100M peak TVL,
2+ years mainnet history).

## Why trust it

Long operating history relative to the Stacks DeFi ecosystem, and
architecturally modeled on a well-understood, audited design pattern
(Aave v3) rather than novel unaudited mechanics.

## Access

No public REST API for market/pool data found — `docs.zestprotocol.com` is
product/protocol documentation, not an API reference. Interest rates and
supply/borrow amounts live in the deployed Clarity market contracts.

## What it feeds

`apy` (supply interest rate) and `tvlUsd` (total supplied) for
`zest-btc-supply`. Currently covered via `defiLlamaProject: "zest-protocol"`
enrichment.

## Caveats

Aave-v3-style markets typically expose supply/borrow rates as public
read-only contract functions (reserve data), which makes this a strong
candidate for direct Hiro contract-call reads once the specific contract
principal and function signature are confirmed from Zest's deployed
contracts list.

## Recommendation

Same pattern as ALEX: no bespoke REST client to build. Read the market
contract's reserve-data function via Hiro once time is budgeted for it;
DefiLlama enrichment is the correct interim source.
