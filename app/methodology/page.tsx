import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Methodology — Bitcoin Yield Intelligence',
  description: 'How Bitcoin Yield Intelligence scores and ranks Stacks yield opportunities: opportunity score, risk tiers, health score, and data sourcing.',
};

const TIERS = [
  { label: 'Conservative', color: '#4C9E7C', range: 'Risk ≤ 2.5', note: 'Core protocol / consensus-level staking, audited, minimal smart-contract surface.' },
  { label: 'Balanced', color: '#C4923F', range: '2.5 – 4.5', note: 'Established DeFi with audits and healthy TVL; modest additional risk.' },
  { label: 'Elevated', color: '#C4753F', range: '4.5 – 6.5', note: 'Newer protocols, emission-driven yield, or moderate IL / contract risk.' },
  { label: 'Aggressive', color: '#C15850', range: '> 6.5', note: 'High APY dominated by token emissions, higher IL, unaudited or young protocols.' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>{title}</h2>
      <div className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>{children}</div>
    </section>
  );
}

export default function MethodologyPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }} className="sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">₿</span>
            <div className="font-bold text-base" style={{ color: 'var(--text)' }}>
              Bitcoin Yield <span style={{ color: 'var(--text-faint)' }}>Intelligence</span>
            </div>
          </div>
          <Link href="/" className="text-sm px-3 py-1.5 rounded-lg" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Methodology</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-dim)' }}>
          How every score on the dashboard is calculated, and what it does — and doesn&apos;t — mean.
        </p>

        <Section title="Opportunity Score (1–10)">
          <p>
            The headline ranking. Emissions are discounted before anything else: we credit token
            incentives at 30% of organic yield, because inflationary rewards decay in a way fee
            income does not.
          </p>
          <pre className="mt-2 mb-2 p-3 rounded-lg overflow-x-auto text-xs"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
{`realYield  = apyBase + 0.3 × apyReward
rawScore   = realYield × (healthScore / 10) × (0.4 + 0.6 × sustainability)
             ÷ (0.3 + riskScore / 10)`}
          </pre>
          <p>
            <code style={{ color: 'var(--text)' }}>sustainability</code> is the organic share of headline APY, so
            emission-heavy positions are damped twice. The <code style={{ color: 'var(--text)' }}>0.3</code> floor in the
            divisor stops ultra-low-risk staking dividing toward infinity.
          </p>
          <p className="mt-2" style={{ color: 'var(--yellow)' }}>
            ⚠️ Important: the raw scores are then <strong>normalised relative to the current set of live sources</strong> —
            the best available option is pinned near 10 and the weakest near 1, and it&apos;s recomputed on every refresh.
            So the Opportunity Score is a <strong>relative ranking of what&apos;s available right now</strong>, not an
            absolute grade you can compare across different days. A source scoring 9 today isn&apos;t necessarily
            &ldquo;better&rdquo; than one that scored 8 last week — it just leads the current field.
          </p>
        </Section>

        <Section title="Risk Score & risk tiers (1–10)">
          <p className="mb-3">
            Computed from seven factors, each derived from a published attribute and each shown with its own
            reasoning on every card. Lower is safer.
          </p>
          <ul className="mb-3 pl-4 flex flex-col gap-1" style={{ listStyle: 'disc' }}>
            <li><strong>Smart contract</strong> (25%) &mdash; contract complexity, penalised when unaudited.</li>
            <li><strong>Liquidity</strong> (17%) &mdash; TVL depth, as a proxy for how cleanly you can exit.</li>
            <li><strong>Counterparty</strong> (16%) &mdash; how much third-party discretion sits between you and the yield.</li>
            <li><strong>Impermanent loss</strong> (13%) &mdash; principal risk from holding a paired position.</li>
            <li><strong>Reward quality</strong> (11%) &mdash; whether the yield accrues in Bitcoin or in a token that can decay.</li>
            <li><strong>Yield sustainability</strong> (10%) &mdash; how much of the APY depends on token emissions.</li>
            <li><strong>Protocol age</strong> (8%) &mdash; length of live track record.</li>
          </ul>
          <p className="mb-3">
            The overall score is <strong>70% of that weighted average plus 30% of the single highest factor</strong>.
            Risk does not average out: a position with one severe weakness is not made safe by five mild
            strengths, and a plain average would rate an unaudited contract as &ldquo;moderate&rdquo; because the
            liquidity happened to be deep. The worst-factor term only ever pulls a score upward.
          </p>
          <p className="mb-3">
            Every row and card is colour-coded by tier so you can read risk at a glance:
          </p>
          <div className="flex flex-col gap-2">
            {TIERS.map(t => (
              <div key={t.label} className="flex items-start gap-3 rounded-lg px-3 py-2"
                style={{ background: t.color + '14', borderLeft: `4px solid ${t.color}` }}>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={{ background: t.color + '26', color: t.color, border: `1px solid ${t.color}66` }}>
                  {t.label}
                </span>
                <div>
                  <div className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{t.range}</div>
                  <div className="text-xs">{t.note}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Health Score (1–10)">
          <p>
            Protocol robustness — TVL depth and stability, audit coverage, track record, and reward sustainability.
            Higher is healthier. It feeds the Opportunity Score and is shown as its own column in Advanced view.
          </p>
        </Section>

        <Section title="APY & the yield heat scale">
          <p>
            APY is the current annualised yield (variable, not guaranteed). It&apos;s tinted on a green→gold &ldquo;heat&rdquo;
            scale so higher yields stand out — but remember a hot APY often rides on a higher-risk row. Read the APY colour
            and the row&apos;s risk tier together, never in isolation.
          </p>
        </Section>

        <Section title="Impermanent-loss (IL) risk">
          <p>
            Only applies to DEX/LP positions, where the value of a paired position can diverge from simply
            holding the assets. Single-asset staking and lending carry none. IL is a scored input to the risk
            model, not just a label &mdash; a volatile pair can lose more principal than the yield pays back.
          </p>
        </Section>

        <Section title="Data sourcing">
          <p>
            Live TVL and APY are enriched from <strong>DefiLlama</strong>, matched by explicit pool ID. Where a live pool
            isn&apos;t mapped yet, the row falls back to curated seed estimates and is flagged{' '}
            <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ background: '#2a1a00', color: '#F59E0B', border: '1px solid #F59E0B22' }}>est.</span>
            {' '}Figures are informational and not financial advice.
          </p>
        </Section>

        <Section title="Coming-soon sources">
          <p>
            Sources marked <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ background: '#64748B', color: '#fff' }}>Coming Soon</span>{' '}
            (e.g. Stacks&apos; native Bitcoin Staking, targeting Q3 2026) are shown for visibility with published target
            terms, sorted to the bottom, and excluded from all rankings, the &ldquo;best/safest APY&rdquo; stats, and TVL totals until they go live.
            They are also left <strong>unrated</strong> rather than scored: an unlaunched protocol has no TVL and no
            track record, and rating it on those absent signals would manufacture a number out of nothing.
          </p>
        </Section>

        <div className="mt-10 pt-6 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-dim)' }}>
          Bitcoin Yield Intelligence — Stacks Ecosystem Dashboard · APY figures are variable and not guaranteed. This is not financial advice.
        </div>
      </main>
    </div>
  );
}
