# Sticky Yield Display Strategy — BTC Yield Visibility

## Why this exists

A single "current APR" number is easy to misread. A rate can spike or dip for
reasons that have nothing to do with the protocol's real, sustainable yield —
a temporary incentive, a liquidity crunch, a data glitch. Showing current APR
next to its recent trailing averages lets a user tell the difference between
"this rate is normal" and "this rate just moved and you should be cautious."

Pairing that with **BTC-denominated balance changes** (not just USD value)
also strips out BTC price noise, so growth/outflow numbers reflect real
deposit activity, not the price of Bitcoin going up or down.

Scope: Stacks-native protocols only for now (Zest, Hermetica, Bitflow,
StackingDAO, ALEX, Velar, Granite, etc.), per current DeGrants Cohort 4
positioning. Schema below should stay general enough to extend to
non-Stacks BTC yield products later without a rework.

## Data model

For each protocol, store a running history of snapshots (daily minimum),
not just the latest pull:

```
snapshot {
  protocol_id
  timestamp
  apr                  // current point-in-time APR
  tvl_btc               // total value locked, in BTC (not USD)
}
```

From the history, derive per protocol:

- `apr_7d_avg` — mean APR over trailing 7 days
- `apr_30d_avg` — mean APR over trailing 30 days
- `tvl_7d_delta_btc` — change in BTC TVL over trailing 7 days
- `stickiness` — classification (see below)

## Stickiness classification

Compare current APR to the 7-day and 30-day averages. Suggested starting
thresholds (tune once you have real data):

- **Sticky (🟢)** — current APR within ~10% relative deviation of both
  the 7-day and 30-day average
- **Drifting (🟡)** — current APR within ~10–25% deviation of the averages
- **Volatile (🔴)** — current APR deviates more than ~25% from either
  average, or the 7-day and 30-day averages themselves diverge sharply
  from each other

This is a starting heuristic, not a fixed rule — revisit once real
snapshot data is flowing.

## Display format

Table view, one row per protocol:

| Protocol | Current APR | 7d avg | 30d avg | Stickiness | TVL (BTC) | 7d Δ (BTC) |
|---|---|---|---|---|---|---|
| Zest | 8.2% | 7.9% | 7.6% | 🟢 Sticky | 412 BTC | +18 BTC |
| StackingDAO | 6.1% | 9.4% | 8.8% | 🔴 Volatile | 1,205 BTC | −40 BTC |

Optional: small sparkline of APR over the trailing 30 days per row, for a
quick visual read alongside the numbers.

## Implementation notes

- Requires a scheduled job (cron / API poll) to pull and store snapshots
  on a regular cadence — this is a new dependency versus just fetching
  live data on page load.
- Historical storage can start simple (flat table, daily granularity)
  and doesn't need to be sophisticated for an MVP/grant deliverable.
- Keep the schema protocol-agnostic (no Stacks-specific fields baked in)
  so non-Stacks BTC products can be added later as new rows, not a
  redesign.

## Open questions to resolve before building

- [ ] Minimum snapshot frequency (hourly vs. daily) — tradeoff between
      data resolution and infra cost
- [ ] Final stickiness thresholds — validate against real protocol data
      once several weeks of history exist
- [ ] Whether "Δ (BTC)" should default to 7-day or be user-toggleable
      (7d / 30d)

## Integration notes (added on review)

Cross-checked against the current codebase (`services/yieldService.ts`,
`adapters/types.ts`) before this gets built. Two gaps worth resolving
before Stage B in the build plan, not during it:

1. **No persistence layer exists today.** `assemble()` in
   `yieldService.ts` is fully stateless — an in-memory 60s cache, nothing
   written to disk or a database. Snapshot history is a genuinely new
   architectural component (storage + a scheduled writer), not an
   extension of anything already running. See the build plan for the
   decision this forces.

2. **`NormalizedOpportunity`/`YieldOpportunity` carry `tvlUsd`, not
   `tvl_btc`.** No adapter emits a BTC-denominated TVL today — DefiLlama's
   `yields.llama.fi` response is USD-only. Getting `tvl_btc` means either
   (a) an adapter supplying raw BTC amounts directly (rare — most quote in
   USD), or (b) dividing `tvlUsd` by a BTC/USD price at snapshot time. (b)
   needs exactly one more source: a BTC price tick, which is the one
   narrow case where pulling in CoinGecko's free, no-auth `/simple/price`
   endpoint is justified — see `docs/data-sources/41-coingecko.md`, which
   otherwise recommended skipping CoinGecko for now.

## Architecture decisions (resolved 2026-08-21)

- **Persistence: Supabase (hosted Postgres).** One database, not two — it
  provides Postgres *and* a built-in Table Editor/SQL editor for visual
  inspection, so it satisfies both "a real database" and "somewhere to look
  at the data" without running two synced stores. (Vercel Postgres was the
  initial recommendation; Supabase supersedes it because it covers the
  dashboard requirement in the same system rather than a second one.)
- **Scheduling: GitHub Actions cron.** A new scheduled workflow alongside
  the existing `.github/workflows/ci.yml`, calling a protected API route
  that writes that day's snapshot. Chosen over Vercel Cron because the
  Hobby plan's once-daily/coarse scheduling would constrain future
  frequency changes (see the open "hourly vs. daily" question above).
- **Sequencing: start now, on top of the existing DefiLlama enrichment.**
  9 of 11 protocols already get live `apy`/`tvlUsd` via
  `adapters/defillamaAdapter.ts` — snapshot collection does not need to
  wait for Track A's protocol-native/Hiro adapters. As those land per
  protocol, the snapshot writer's underlying source improves without
  resetting the accumulated history (the schema doesn't care which adapter
  produced a given day's number).
