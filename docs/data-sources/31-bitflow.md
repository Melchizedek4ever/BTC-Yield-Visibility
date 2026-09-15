# Bitflow

**Tier:** 2 — Protocol-native
**Category:** Protocol-native (DEX/LP — StableSwap)
**Adapter kind:** origin
**Status:** **build — real public API, no auth**

## What it is

The StableSwap DEX behind `bitflow-sbtc-stx` in our seed data. Open-source
protocol (contracts + SDK on GitHub), with a documented public ticker API.

## Why trust it

First-party: this is Bitflow's own maintained endpoint, not a third-party
scrape. Contracts are open source and independently listed with deployed
addresses for both mainnet and testnet, so pool-level numbers can be
cross-checked against on-chain state if ever in doubt.

## Access

- Base URL: `https://bitflow-sdk-api-gateway-7owjsmt8.uc.gateway.dev`
- Endpoint: `GET /ticker` — returns all DEX pairs
- Auth: none for the public ticker endpoint; SDK/private API access requires
  contacting the team directly
- Docs: https://docs.bitflow.finance/bitflow-documentation/developers/public-api-documentation
- Response fields: `ticker_id`, `base_currency`, `target_currency`,
  `base_volume`, `target_volume`, `liquidity_in_usd`, `last_price`, `high`,
  `low`, `bid`, `ask`

## What it feeds

`tvlUsd` (from `liquidity_in_usd`), and `apy`/`apyBase` can be derived from
trading volume/fee share for the sBTC-STX pair — needs a documented fee rate
to convert volume into a yield estimate (check the SDK or deployed contract
for the current fee parameter rather than assuming a fixed rate, since
StableSwap fees can be tuned).

## Caveats

No `apyReward` or emissions field in the ticker response — Bitflow's yield
here is closer to pure trading-fee yield (matches `apyReward: 0`-heavy
character of the seed entry, which currently splits `apyBase: 6.0` /
`apyReward: 8.2` — that reward component would need a separate source,
likely the emissions/farming contract, not this ticker endpoint).

## Recommendation

Build. This is one of the strongest candidates for a real origin adapter:
documented, no-auth, single endpoint, machine-parseable. `GET /ticker`,
filter by `ticker_id` for the sBTC-STX pair, map `liquidity_in_usd` →
`tvlUsd`. Confirm the reward-emission number's source before wiring `apy`
end to end.
