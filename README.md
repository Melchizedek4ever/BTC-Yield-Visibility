# Bitcoin Yield Intelligence

Risk-adjusted Bitcoin yield intelligence for the Stacks ecosystem — explainable risk scoring, not just an APY table.

## Getting started

```bash
npm install
git config core.hooksPath .githooks   # one-time, see "Quality gate" below
npm run dev
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Full Vitest suite |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | Suite with a V8 coverage report |

## Quality gate

`lint`, `typecheck`, and `test` must pass before any change reaches `main`.
Two mechanisms enforce this:

- **`.github/workflows/ci.yml`** — runs on every pull request.
- **`.githooks/pre-push`** — runs the same three checks locally before a push,
  and refuses direct pushes to `main`.

Git cannot install hooks automatically, so each clone needs the one-time
`git config core.hooksPath .githooks` above. Without it the local gate is
silently inactive.

The two must be kept in step: if you change one, change the other.

## Architecture

```
Frontend → API routes → Services → Domain → Engines → Adapters → Stacks ecosystem
```

Adding a protocol should touch only the adapter layer. See
[`adapters/alexAdapter.ts`](adapters/alexAdapter.ts) for the template and
[`docs/data-sources/`](docs/data-sources/) for evaluated sources.

## Testing

Vitest, with `fast-check` for property-based engine invariants and MSW for
adapter HTTP mocking. Tests target agreed public seams (`assessRisk`,
`buildScores`, `getOpportunities`, API routes, adapter `fetchOpportunities` /
`enrich`) — never internals.
