'use client';

import { useDashboardStore } from '@/lib/store';

/**
 * The argument, made before the numbers.
 *
 * Our headline yield is lower than competing dashboards because theirs include
 * incentive rates nobody can verify, pools with no liquidity, and in one case a
 * product that did not exist. A visitor comparing a 5% here against a 45% there
 * will conclude we are the worse product — unless the page explains, in the
 * first ten seconds, that the gap IS the offer.
 *
 * So this leads with the method, not the rates. Three claims, each one a thing
 * the engine actually does and a reader can check on /methodology: we show what
 * a source says, we say when nobody publishes a rate, and we rank on risk-
 * adjusted yield rather than the biggest number.
 *
 * Collapses to a single line in advanced mode: a returning reader has already
 * had the argument and wants the table. It still renders the page heading in
 * both modes so there is exactly one h1 either way.
 */
export default function ValueProposition() {
  const { mode } = useDashboardStore();

  if (mode === 'advanced') {
    return (
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-1 tracking-tight" style={{ color: 'var(--text)' }}>
          Bitcoin Yield Intelligence
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Risk-adjusted yield across the Stacks ecosystem, ranked by Opportunity Score and never by
          APY alone. Every rate is labelled with where it came from.
        </p>
      </div>
    );
  }

  return (
    <section
      className="mb-6 px-5 py-6"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      aria-labelledby="value-prop-heading"
    >
      <h1
        id="value-prop-heading"
        className="text-2xl sm:text-3xl leading-tight mb-3"
        style={{ color: 'var(--text)' }}
      >
        Bitcoin yield, with the arithmetic shown.
      </h1>

      <p className="text-sm sm:text-base leading-relaxed max-w-2xl mb-5" style={{ color: 'var(--text-dim)' }}>
        Every rate on this page is read from a protocol&apos;s own contracts or API and labelled with
        where it came from. Where no source publishes a rate, we say so instead of estimating one.
        You will see lower numbers here than on dashboards that print whatever a protocol claims
        &mdash; that difference is the point.
      </p>

      <ul className="grid gap-4 sm:grid-cols-3 mb-5">
        <Claim
          title="Sourced, not asserted"
          body="Rates come from chain state, then protocol APIs, then aggregators — in that order of trust. Rows running on a curated estimate are marked, and the badge above counts them."
        />
        <Claim
          title="Silence over guesswork"
          body="Some strategies publish no rate that anyone can verify. Those rows show their size and full risk breakdown, and say plainly that the rate is unpublished."
        />
        <Claim
          title="Risk-adjusted, not ranked by APY"
          body="A high rate paid in a protocol's own token, from a thin pool, on an unaudited contract is not a better opportunity. Seven scored factors, each with a written reason."
        />
      </ul>

      <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
        <a
          href="/methodology"
          className="underline underline-offset-2"
          style={{ color: 'var(--gold)' }}
        >
          How every number is produced
        </a>
        {' · '}
        Informational only, not financial advice.
      </p>
    </section>
  );
}

function Claim({ title, body }: { title: string; body: string }) {
  return (
    <li>
      <div
        className="font-mono-data text-[10px] uppercase tracking-widest mb-1.5"
        style={{ color: 'var(--gold)' }}
      >
        {title}
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
        {body}
      </p>
    </li>
  );
}
