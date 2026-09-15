# Clarity Alliance

**Tier:** 4 — Risk & trust intelligence
**Category:** Risk intelligence (audits)
**Adapter kind:** reference — no adapter, feeds curated metadata
**Status:** reference only, already reflected in seed data

## What it is

The leading Clarity-specialist smart contract auditor in the Stacks
ecosystem — has audited core Stacks infrastructure (Nakamoto VM, sBTC) and
is the auditor of record for nearly every protocol in our seed data
(`auditFirms: ["Clarity Alliance"]`).

## Why trust it

Domain-specialist (Clarity-only, not a generalist auditor applying
EVM-pattern checklists to a different language), trusted by the Stacks
Foundation directly, with a public reports page.

## Access

- Public audit reports: https://www.clarityalliance.org/reports
- No API — this is a research/verification source, checked by hand per
  protocol.

## What it feeds

`Protocol.audited` and `Protocol.audits` (currently `auditFirms` in the
seed type) — direct inputs to the risk engine's Smart Contract Risk
sub-factor. Worth periodically re-checking the reports page: an audit's
existence doesn't mean the *currently deployed* contract version matches
what was audited.

## Recommendation

No adapter — this is exactly the kind of fact that belongs in curated
`lib/protocols.ts` metadata, verified by hand against the reports page when
onboarding or re-reviewing a protocol, not something to poll programmatically.
