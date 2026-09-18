# Source Coverage

What each opportunity's numbers actually come from, and what is still a guess.

Verified by direct call on **2026-09-17**. Re-verify before trusting this page
— every row here is a claim about a third party's live endpoint.

## The finding that shapes everything

DefiLlama tracks **~16,500 pools across all of DeFi and exactly six on Stacks**,
all six belonging to Zest. There is no pool-level yield there for ALEX, Bitflow,
Velar, StackingDAO, Arkadiko or Hermetica.

An aggregator-first strategy cannot work on this chain. Coverage has to come
from protocol-native APIs and chain reads, one protocol at a time. That is more
work than wiring one aggregator, and it is also the moat: anyone can call
DefiLlama, and on Stacks it returns almost nothing.

## Coverage today

| Opportunity | APY source | TVL source | Still curated |
|---|---|---|---|
| native-stacking | StackingDAO (`apy_native`) | Hiro PoX + price | — |
| stackingdao-ststx | StackingDAO (`apy_ststx`) | DefiLlama | — |
| zest-btc-supply | DefiLlama pool | DefiLlama pool | — |
| velar-sbtc | Velar pool API | Velar pool API | — |
| alex-stx-farm | ALEX (fee APR only) | curated | emissions, TVL |
| alex-sbtc-alex | ALEX (fee APR only) | curated | TVL |
| bitflow-sbtc-stx | curated | Bitflow ticker | APY |
| granite-btc-supply | curated | curated (DefiLlama-reviewed) | APY, live TVL |
| hermetica-hbtc | curated | curated (DefiLlama-reviewed) | APY, live TVL |
| arkadiko-diko | curated | curated (DefiLlama-reviewed) | APY, live TVL |
| dual-stacking | curated (anchored to native) | curated | both |
| bitcoin-staking | pre-launch target | — | not applicable |

Roughly **5 of 11 live rows** carry a live reading on a good refresh. The
remainder fall back to `data/marketBaseline.ts`, flagged `scoresEstimated`.

## What makes each source different

The adapters are not interchangeable. Each one exists because its protocol's
yield works differently, and each claims only what its source can defend.

**DefiLlama** — `adapters/defillamaAdapter.ts`
One hop from the chain: community scrapers read contracts, DefiLlama
republishes. Broad everywhere except here. Its distinguishing asset is
`apyMean30d`, a pool's own 30-day history, which is what lets us tell a real
0% from a glitched one. Ranks below protocol-native sources.

**ALEX** — `adapters/alexAdapter.ts`
The richest protocol-native source on Stacks: every pool, with balances,
volume, fees and APR. Uniquely, `apr_7d` is *realized trading-fee* yield
computed from actual volume — real yield cleanly separated from incentives,
which is exactly the split `yieldSustainability` normally has to guess at.
Quirk: every number is on-chain fixed point scaled by 1e18, undocumented,
pinned by the 0.5% swap fee appearing as `5e15`. Claims fee APR only;
emissions live in a separate farming contract, and TVL would need prices for
arbitrary SIP-10 tokens.

**Bitflow** — `adapters/bitflowAdapter.ts`
Alone among the DEX sources in reporting `liquidity_in_usd` already in
dollars, so no price feed is needed. Claims TVL only: volume arrives in token
units and no per-pool fee rate is published, so an APY would stack a price
inference on a missing contract read. An API key reportedly unlocks more of
the SDK's data — the cheapest available route to a real Bitflow APY.

**Velar** — `adapters/velarAdapter.ts`
First-party, single pool, matched by LP token contract. Returns the literal
string `"--"` when a pool has no computed yield, which is why the adapter
type-checks before believing a number.

**StackingDAO** — `adapters/stackingDaoAdapter.ts`
The disproportionately valuable one. PoX pays in BTC transferred by miners
each cycle, so stacking APY is not a figure any contract exposes — it must be
derived from realized payouts. StackingDAO operates the infrastructure,
already does that derivation, and publishes native PoX alongside their own
products. One endpoint supplies a rate for two rows that were pure guesswork.
Caveat: an operator publishing their own rate has an interest in it. Ranks
below a chain read; a chain-derived cycle yield should eventually replace it.

**Hiro PoX** — `adapters/hiroPoxAdapter.ts`
The only Tier 1 source wired: chain state, no intermediary. Claims TVL only,
deliberately — see its header on why a derived stacking APY can be understated
twofold. `stacked_ustx` is one authoritative field needing no inference.

**Seed** — `adapters/seedAdapter.ts`
Origin adapter over the curated registry and market baseline. The registry is
durable judgement no API supplies; the baseline is perishable estimates that
any live reading should override.

## Adapter strategy by yield mechanic

"APY" is four different things here, and an adapter that ignores the
difference will publish a confident wrong number.

**Consensus yield** (stacking) — paid from miner commitments, cycle-quantized,
backward-looking. There is no "current" rate, only what the last cycle paid.
Always `apyBase`; `apyReward` is always 0. An adapter must restate the split
rather than leaving a stale emissions figure beside a fresh rate.

**Utilization yield** (lending) — supply rate is a mechanical function of
borrow rate × utilization × (1 − reserve factor). The field that matters most
is not APY but **utilization**: a $50M pool that is 95% borrowed is harder to
exit than a $5M pool that is 30% borrowed. `liquidityRisk` currently uses raw
TVL and misses this entirely. Closing that gap needs a reserve-contract read.

**Trading-fee yield** (DEX/LP) — two unrelated things summed: fees earned from
real volume, and incentive emissions that end when the program does. They must
be fetched separately and never pre-summed upstream, because
`yieldSustainability` reads `apyReward / apy`.

**Managed strategy** (Hermetica, Arkadiko) — returns depend on an operator
executing correctly. There may be no honest live source at all. This is where
curated-with-`reviewedAt` is the *correct* long-term answer rather than a
placeholder, and the UI should say so rather than imply a reading exists.

## Where the remaining gaps have to come from

| Protocol | Public API? | Route to real data |
|---|---|---|
| Granite | No (`api.granite.world` 404s) | Reserve contract via Hiro `call-read`. Audits are public on GitHub. |
| Hermetica | No | Likely none on-chain — funding-rate strategy has no readable rate. Ask the team. |
| Arkadiko | Swap pools only (`arkadiko-api.herokuapp.com`) | DIKO staking is not covered by that API; needs a contract read. |
| Bitflow APY | Ticker has no fee rate | Request an SDK API key, or read the fee parameter from the pool contract. |
| Dual stacking | No | No published figure for the STX-plus-sBTC subset. |

The common answer is Hiro's read-only contract-call proxy:

```
POST https://api.hiro.so/v2/contracts/call-read/{address}/{contract}/{function}
```

Confirmed working — it answers with proper Clarity semantics and structured
errors. The cost is per protocol: read the Clarity source, find the right
read-only function, decode its return type. Slow to build, permanent once
built, and it does not break when a team redesigns their API.

## Operational notes

**Timeouts must be measured, not guessed.** Several adapters shipped with
budgets below their endpoint's actual response time, so they had never once
succeeded in production. Measured: Hiro ~11s, ALEX ~9.6s, CoinGecko ~9s,
Bitflow ~6s, Velar ~4.9s, StackingDAO ~4s, DefiLlama per-pool ~2.5s.

**Refresh latency is the next structural problem.** Enrichment adapters run
sequentially in `services/yieldService.ts`, so a full refresh now approaches
45 seconds against a 60-second cache TTL. In practice each adapter claims a
disjoint set of rows, so they could run in parallel — but the current contract
says each overlays the previous one's output, and that would have to change
first.

**`scoresEstimated` is one boolean doing four jobs.** It cannot express "APY
read from chain, TVL still curated", which is the true state of several rows —
so a row with a live APY still reads as estimated when its TVL source fails.
Per-field provenance is the fix, and it is also the strongest investor-facing
differentiator available: almost nobody shows where each individual number
came from.
