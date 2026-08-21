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
