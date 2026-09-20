# Workflows — dormant

Both workflows here end in `.disabled`, so GitHub ignores them. That is
deliberate, and it is not because they are wrong.

## Why

The account is under a billing lock. Every run failed in three to five seconds
with *"the job was not started because your account is locked due to a billing
issue"* — the job never started, so it never reached any code. This repository
is public, where Actions minutes are free and unlimited, so the plan is not the
cause. Re-entering card details and verifying every email address did not clear
it.

The result was a red cross on every commit and every pull request of a public
repository, on a project whose entire argument is rigour. Anyone opening the
repo — an investor, a protocol team deciding whether to hand over an API key, a
prospective contributor — saw a wall of failed builds and no way to know it was
a billing flag. That cost more than the dormant workflows were worth.

## Nothing is unguarded

The work moved to infrastructure that runs:

| Was | Now |
|---|---|
| CI on every PR | Vercel runs `npm run verify && next build` before every deployment (`vercel.json`) and reports the result on the PR |
| Nightly source monitor | Vercel Cron hits `/api/monitor` daily at 06:00 UTC |
| Local gate | `.githooks/pre-push` runs the same `npm run verify` |

All three call the one `verify` script, so they cannot drift apart.

## Re-enabling

If the billing lock is ever cleared, drop the suffix:

```bash
git mv .github/workflows/ci.yml.disabled .github/workflows/ci.yml
git mv .github/workflows/monitor.yml.disabled .github/workflows/monitor.yml
```

Both are current and correct — they were never broken, only unable to start.
They would then be a redundant second net rather than the only one, which is a
better place to be than where this started.

Tracked in `docs/data-sources/02-open-questions.md`.
