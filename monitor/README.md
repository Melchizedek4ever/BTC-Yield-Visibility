# Source Monitor

`npm run monitor` — checks our data sources against reality, not against mocks.

Not part of `npm test`. It hits live third-party APIs, so a network blip must
never be able to fail a commit.

## Why this exists

Every serious defect this product has had was a **truth** bug, not a logic bug:

| What was wrong | How long it lasted | What the test suite said |
|---|---|---|
| Zest published at 3.5% while paying ~0% | months | ✅ pass |
| Bitflow TVL carried at $5M against a real $68K | months | ✅ pass |
| A Granite row describing a product that never existed | months | ✅ pass |
| Adapter timeouts below the endpoint's real latency — some had never once succeeded | since written | ✅ pass |
| Three DefiLlama identifiers resolving to nothing | unknown | ✅ pass |

All five were found by a human calling the APIs. None by a test.

That is structural, not sloppiness: the unit suite mocks the network boundary,
so it verifies *the code does what we said*. Nothing in it verifies *what we
said is true about the world*. This file covers that second question.

It matters more here than in most products because **everything in the pipeline
fails soft**. A broken source never raises an error — it quietly reverts rows to
curated estimates and keeps serving. Uptime stays perfect while the numbers rot.
That is exactly how six months passed unnoticed.

## What it checks

**Identifiers still resolve.** Every DefiLlama pool, ALEX pool, Bitflow pool,
StackingDAO rate key and Velar pool we map, plus PoX chain state. A retired or
re-keyed pool is invisible in production — the row just goes back to estimates.

**The ALEX fixed-point scale still holds.** Their values are undocumented 1e18
fixed point, inferred from the 0.5% swap fee arriving as `5e15`. If they ever
rescale, every APR we publish moves by a factor of 10^10. The check pins the
assumption, not just the value.

**Live coverage stays above 50%**, naming every row that fell back. This is the
signal that catches a source failing for any reason at all, including ones we
have not thought of.

**No live TVL has drifted 10x from its baseline.** The threshold is loose on
purpose — it must not fire on ordinary market moves, only on the class of error
where a figure is wrong by an order of magnitude. This is the check that would
have caught Bitflow within a day instead of six months.

**No published APY exceeds 500%.** Not a correctness check, a decoding check: a
unit or fixed-point error upstream surfaces as a number no Bitcoin yield product
pays.

The checks are driven by `PROTOCOL_REGISTRY` and `MARKET_BASELINE` themselves,
so onboarding an opportunity extends the monitor automatically. There is no
second list to forget.

## Running it nightly

Add `.github/workflows/monitor.yml`. It is not committed with the rest because
pushing workflow files needs a token with the `workflow` scope — create it
through the GitHub web UI, or push it from your own machine.

```yaml
# Checks our data sources against reality. A failure here means the world
# changed — a pool retired, an endpoint reshaped, a baseline gone stale — not
# that someone broke the code.
name: Source Monitor

on:
  schedule:
    # 06:00 UTC daily. Any quiet hour works; the point is that it runs without
    # anyone remembering to run it.
    - cron: '0 6 * * *'
  workflow_dispatch: # so it can be run by hand after changing a data source

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run monitor
```

To be told when it fails rather than having to look, add a step that opens an
issue — GitHub emails you on issue creation, so no extra service is needed:

```yaml
      - name: Report a failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `Source monitor failed — ${new Date().toISOString().slice(0, 10)}`,
              body: `A data source changed under us. Run \`npm run monitor\` locally for the detail.\n\n${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`,
              labels: ['data-source'],
            })
```

> **Note:** GitHub Actions will not run at all until the account billing lock is
> cleared — jobs fail in seconds with *"your account is locked due to a billing
> issue"*. This repository is public, where Actions minutes are free and
> unlimited, so the plan is not the cause. See
> `docs/data-sources/02-open-questions.md`.

## When it fails

It is reporting the world, so start by assuming the world changed.

1. Read the failure message — each names the row and the identifier.
2. Check the source by hand before editing anything.
3. If a pool moved, update `externalIds` in `data/protocolRegistry.ts`.
4. If a baseline has drifted, re-review that row in `data/marketBaseline.ts`
   and set a fresh `reviewedAt`.
5. If a source is simply gone, the row may no longer be representable — see the
   curation stance in `docs/data-sources/01-source-coverage.md`.

Do not relax a threshold to make it pass. The thresholds are already loose
enough that anything tripping them is worth a human minute.
