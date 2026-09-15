# Data Source Profiles

Research index for every external source that could feed the adapter layer
(`adapters/*.ts`). Each profile is scoped to a single source and answers the
same five questions: what it is, why we'd trust it, how to call it, what it
feeds downstream, and whether it earns an adapter at all.

## Why tiered, not alphabetical

The product mission is trust and explainability for BTC yield decisions. A
source's tier is a trust ranking, not a topic grouping — it tells you which
data to believe when two sources disagree.

| Tier | Category | Rationale |
|---|---|---|
| 0 | Bitcoin L1 | Ground truth for BTC itself — no intermediary between us and the chain |
| 1 | Stacks infrastructure | Ground truth for every Stacks-based protocol — the chain state itself |
| 2 | Protocol-native APIs | Maintained by the team that owns the contracts; authoritative for *their* pool, opinionated about nothing else |
| 3 | Cross-protocol aggregators | Convenient, broad coverage, but one hop removed from source — useful for enrichment, wrong for origin |
| 4 | Risk & trust intelligence | Feeds the risk engine's explainable sub-factors (audits, exploits, process quality) — never yield/TVL numbers |
| 5 | Fundamentals/research (optional) | Institutional-grade context (revenue, funding) — valuable later, not worth the integration cost now |

**Trust hierarchy when sources conflict:** on-chain read (Tier 1, via Hiro's
read-only contract-call proxy) > protocol-native REST API (Tier 2) >
DefiLlama/community adapter (Tier 3) > anything else.

## An architectural finding worth flagging

Most of the Stacks protocols we represent do **not** have a bespoke,
well-documented REST API for pool-level yield data. What they have is a
deployed Clarity contract, and a protocol-native API (if it exists) is
usually a thin read cache over that contract, run by the team, with no
uptime SLA. That changes the calculus from "which API is best" to "how far
are we from the contract":

```
Deployed Clarity contract (ground truth)
        ↑ read via Hiro's read-only contract-call proxy (Tier 1)
Protocol-native REST API, if one exists (Tier 2)
        ↑ scraped by
DefiLlama yield-server community adapter (Tier 3)
```

This matters for the charter's trust mission: `seedRiskScore` and
`scoresEstimated` today are curated-baseline flags, not measured ones.
Sourcing directly from contract state where possible is how that gap
actually closes, not by adding more third-party APIs on top of the existing
DefiLlama enrichment.

## Recommendation — what to actually build

Building an adapter for "every trusted source in web3" is scope creep
against the charter (`avoid overengineering`, `no complexity without
measurable value`). Only sources that map to a `ProtocolAdapter` or
`EnrichmentAdapter` for one of our 11 represented opportunities, or a named
risk sub-factor, earn a `Recommendation: build` verdict below. Everything
else is reference material — useful when curating `lib/protocols.ts` by
hand, not worth an HTTP client and a retry/timeout policy.

| Priority | Source | Kind | Verdict |
|---|---|---|---|
| 1 | [Hiro Stacks Blockchain API](20-hiro-stacks-api.md) | origin (via contract-call) | **Build first** — unlocks ground-truth reads for every Stacks protocol at once |
| 2 | [mempool.space](10-mempool-space.md) | origin (Bitcoin Staking) | Build when native BTC staking ships (Q3 2026 per seed data) |
| 3 | [Velar API](32-velar.md) | origin | Build — real REST API, no auth, clean pool endpoints |
| 4 | [Bitflow public API](31-bitflow.md) | origin | Build — real REST API, no auth |
| 5 | [Arkadiko AMM API](36-arkadiko.md) | origin | Build — real REST API, no auth |
| 6 | [Granite API](34-granite-protocol.md) | origin | Verify manually first — docs page is a JS-rendered shell, endpoints unconfirmed |
| 7 | [Zest Protocol](33-zest-protocol.md), [ALEX](30-alex.md), [StackingDAO](35-stackingdao.md), [Hermetica](37-hermetica.md) | origin | No public REST API found for pool data — fall back to Hiro contract-call reads or stay on DefiLlama enrichment (current state) |
| — | [DefiLlama](40-defillama.md) | enrichment | Already wired (`adapters/defillamaAdapter.ts`) — no change needed |
| — | [Pyth Network](21-pyth-network.md) | reference | Not an adapter target — informs which protocols have live price oracles (a smart-contract-risk signal) |
| — | [Clarity Alliance](50-clarity-alliance.md), [Immunefi](51-immunefi.md) | reference | Feed the risk engine's audit/exploit fields by hand, not via API |
| — | [CoinGecko](41-coingecko.md), [Blockstream Esplora](11-blockstream-esplora.md) | reference | Redundant with what we already have wired or plan to wire; keep as fallback options |
| Skip for now | [Messari](60-messari.md), [Token Terminal](61-token-terminal.md), [RootData](62-rootdata.md) | reference | Paid/enterprise tier, valuable for "sustainability" scoring eventually, not justified at 11-protocol scale |

## TDD note

Building any of these means the shared contract suite runs first:
`describeAdapterContract(newAdapter)` red, then `fetchOpportunities()`
implemented until it's green — one adapter at a time, per the charter's
vertical-slice discipline. These profiles are the research input to that
work, not a substitute for it.
