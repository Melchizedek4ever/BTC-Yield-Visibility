import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Methodology — BTC Yield Visibility',
  description: 'How BTC Yield Visibility scores and ranks Stacks yield opportunities: opportunity score, risk tiers, health score, and data sourcing.',
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
              BTC Yield <span style={{ color: 'var(--text-faint)' }}>Visibility</span>
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
            The headline ranking. For each source we compute a raw score of{' '}
            <code style={{ color: 'var(--text)' }}>(APY × Health Score) ÷ (Risk Score × 1.2)</code>, rewarding high,
            healthy yield and penalising risk.
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
            A composite of smart-contract risk, audit status, protocol age, TVL depth, and impermanent-loss exposure.
            Lower is safer. Every row and card is colour-coded by tier so you can read risk at a glance:
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
          <p>Only applies to DEX/LP positions, where the value of a paired position can diverge from simply holding the assets. Single-asset staking and lending show no IL risk.</p>
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
          </p>
        </Section>

        <div className="mt-10 pt-6 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-dim)' }}>
          BTCFi Yield Intel — Stacks Ecosystem Dashboard · APY figures are variable and not guaranteed. This is not financial advice.
        </div>
      </main>
    </div>
  );
}
