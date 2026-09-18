# Hiro Stacks Blockchain API

**Tier:** 1 — Stacks infrastructure, ground truth for every Stacks protocol
**Category:** Stacks infrastructure
**Adapter kind:** origin (via read-only contract calls) — a shared primitive, not a single adapter
**Status:** **build first**

## What it is

Hiro's REST API + indexer over the Stacks blockchain: accounts, blocks,
mempool, smart contracts, tokens, PoX/stacking, and a read-only
contract-call proxy that lets you query any deployed Clarity contract's
public read functions without running your own node.

## Why trust it

Hiro is the primary infrastructure provider for Stacks (built and maintains
the reference `stacks-blockchain-api`, open source on GitHub). More
importantly: the contract-call proxy returns whatever the deployed contract
itself returns — there's no room for Hiro to editorialize the number. It's
the closest thing to reading the chain ourselves without running a node.

## Access

- Base URL: `https://api.hiro.so/extended`
- Auth: not required for the hosted instance (API keys exist for higher
  rate-limit tiers — verify current limits before high-frequency polling)
- Docs: https://docs.hiro.so/en/apis/stacks-blockchain-api
- Relevant endpoint categories: Accounts, Smart Contracts (incl. read-only
  contract calls), Stacking/PoX, Transactions, Tokens

## What it feeds

This is the one source that can supply ground-truth numbers for **every**
Stacks-native opportunity in `lib/protocols.ts` — `dual-stacking`,
`native-stacking` directly via PoX endpoints, and every DEX/lending/vault
protocol indirectly via read-only calls into their deployed contracts
(pool reserves, exchange rates, TVL) once we know each contract's principal
and function signatures.

This is infrastructure, not a single `ProtocolAdapter`. The likely shape:
a shared `hiroClient.ts` helper (contract-call wrapper with timeout/retry)
that individual protocol adapters (ALEX, Zest, StackingDAO, ...) call into
when they have no usable protocol-native REST API of their own.

## Caveats

Reading raw contract state requires knowing each contract's read-only
function names and return types — more integration work per protocol than
calling a REST endpoint, but it's the only path to first-party numbers for
protocols with no public API (see 30-alex.md, 33-zest-protocol.md,
35-stackingdao.md, 37-hermetica.md).

## Recommendation

Build the shared Hiro contract-call client first — every other "no public
API" protocol profile in this index depends on it. This is the single
highest-leverage integration: one client, many protocols unlocked.

## Implementation status (2026-09-15)

`adapters/hiroPoxAdapter.ts` is live. It reads `GET /v2/pox` and sets the TVL
of the row marked `externalIds.stacksPox` from
`current_cycle.stacked_ustx`, priced in USD via CoinGecko.

Measured against the curated baseline on first run: **$200,000,000 estimated
vs $114.7M actual** — the largest single error in the dataset. The baseline
has been corrected to $115M.

### Why it sets TVL and not APY

Stacking APY has to be derived from burnchain reward payouts
(`/extended/v1/burnchain/rewards`), and a sample of 384 rows across 568 burn
blocks returned **`reward_index: 0` for every single row**. PoX allocates
multiple reward slots per cycle, so either there is genuinely one recipient per
block, or the feed omits the others. If it omits them, a derived APY is
understated twofold.

The derivation produced 7.80% against a curated 9.2%, which is plausible — and
that is exactly the problem: a number that looks reasonable while resting on an
unverified assumption. `stacked_ustx` is a single authoritative field needing no
inference, so that is all the adapter claims.

To finish the APY, first establish whether the reward feed is complete —
cross-check total payouts for one full cycle against a block explorer.

### Known constraint

The CoinGecko free tier rate-limits aggressively; it returned a failure during
development and the adapter correctly fell back to the curated baseline. With
the service's 60s cache this is roughly one call per minute, but a price source
with a firmer quota should be considered before more adapters depend on it.
