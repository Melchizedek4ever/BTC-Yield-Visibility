# Open Questions

Things we have not verified, and things waiting on someone else. Kept in the
repo rather than in anyone's head, because an unverified claim that nobody is
tracking eventually becomes one nobody remembers making.

Each item says what is unverified, why it matters, and what would close it.

---

## 1. Audit scope is unverified across the whole registry

**Status:** disclosed, not resolved.

`audited` and `audits` in `data/protocolRegistry.ts` record that a *protocol*
has published audit coverage. They do not establish that the specific contract
behind a given opportunity was inside that audit's scope — that has never been
checked against the audit reports.

This applies to every row carrying a firm name, not only the rows added on
2026-09-18. It is a pre-existing convention that was never written down.

**Why it matters:** smart-contract risk is the heaviest factor in the risk
engine (25% weight, plus its share of the worst-factor blend), and `audited`
moves it by two full points. A protocol can be audited while a newer product on
it is not — which is exactly the case we most want to catch. Right now the
engine cannot see the difference, and the compensation is manual: newer
contracts on mature protocols are rated a band riskier by hand.

**Highest-exposure rows** (new products asserting the protocol's audit history):
`stackingdao-stbtc`, `stackingdao-ststxbtc`, `zest-ststxbtc-supply`,
`bitflow-sbtc-pbtc`, `zest-zvstbtc`.

**To close:** read each protocol's published audit reports and record, per
opportunity, whether that contract was in scope. Granite's are at
`github.com/GraniteProtocol/core-v1/audits`; Zest's are linked from
`docs.zestprotocol.com/start/stacks-market-smart-contracts/audits`. Then either
split the field into protocol-level and contract-level coverage, or narrow
`audits` to mean contract scope and let the risk engine read it directly.

**Meanwhile:** disclosed in the registry header and on `/methodology`, so the
claim a reader sees matches the claim we can support.

---

## 2. Two emails worth sending

Both unblock work we cannot do from outside.

### StackingDAO — resolve the stSTXbtc rate discrepancy

Their `app.stackingdao.com/api/stats` endpoint is wired and is the source for
three rows. One ambiguity remains: their marketing page headlines stSTXbtc at a
figure equal to `apy_native`, not `apy_ststxbtc`. We take the API field as
authoritative because it is explicitly named and because `apy_stbtc` matched
their displayed stBTC figure exactly — but that is inference, not confirmation.

**Ask:** which field corresponds to the stSTXbtc product as displayed? And is
there any per-product TVL? DefiLlama splits the protocol into $22.0M STX and
$11.9M sBTC, but nothing splits the STX bucket between stSTX and stSTXbtc, so
both rows currently carry a conservative share.

### Zest — the zvstBTC vault contract principal

zvstBTC is the highest-value integration target we have and the only thing
blocking it is an address. The docs describe the vault in detail but publish no
contract principal.

**Ask:** the vault contract principal, and whether they expose (or would
expose) vault TVL and a realised APY. Worth noting we are building their
distribution layer — an endpoint costs them little.

---

## 3. zvstBTC is withheld pending a source

**Status:** record kept, row hidden.

`zest-zvstbtc` carries `hiddenReason` in the registry, so `seedAdapter` does not
emit it. With neither a rate nor a size, the row rendered as two blanks, which
reads as a broken dashboard rather than a deliberate disclosure.

**Why keep the record:** it is a real, live, BTC-denominated product targeting
6–8%, and no aggregator covers it. The curated research — risk rating, strategy
description, why the rate cannot be published — is done. Relisting is deleting
one line.

**To close:** either outcome relists it.

1. Read the vault's share price on chain twice, a known interval apart. The
   ratio's change over that interval is a *realised* rate, which beats the
   published target. Needs the principal from item 2.
2. Zest publishes vault TVL and APY directly.

**Also worth watching:** whether the vault gains enough TVL to appear in
DefiLlama's Zest V2 breakdown, which would give us a size without any
integration at all. Worth re-checking whenever the baseline is reviewed.

---

## 4. Lending utilization is still missing from risk

**Status:** known gap, worked example documented.

`liquidityRisk` judges exit difficulty by raw TVL. For a lending market that is
the wrong signal: a $50M pool that is 95% borrowed is harder to exit than a $5M
pool that is 30% borrowed, because the money is in borrowers' hands either way.

Zest holds roughly 80% of the capital on this dashboard, so getting lending risk
right matters more than adding breadth.

**To close:** find Zest's equivalent of the contract reads already verified
against Granite (`docs/data-sources/34-granite-protocol.md` has the working
calls and the utilization formula), then add utilization as an input to
`liquidityRisk` for `Lending`-category rows.

---

## 5. Refresh latency against cache TTL

Enrichment adapters run sequentially in `services/yieldService.ts`. A full
refresh measured 20–46 seconds against a 60-second cache TTL, so a cold request
can wait most of a minute.

Each adapter claims a disjoint set of rows in practice, so `Promise.all` over
the enrichers would cut this to the slowest one. The blocker is the documented
contract that each enricher overlays the previous one's output — that ordering
guarantee would have to be restated before parallelising it.
