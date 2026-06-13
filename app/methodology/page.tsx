import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Scoring Methodology — BTCFi Yield Intel',
  description: 'How BTCFi Yield Intel calculates Risk, Health, and Opportunity scores for Stacks DeFi protocols.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold mb-4 pb-2" style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function ScoreRow({ label, weight, desc }: { label: string; weight: string; desc: string }) {
  return (
    <div className="flex gap-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="w-8 text-xs font-bold pt-0.5" style={{ color: 'var(--orange)' }}>{weight}</div>
      <div>
        <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{label}</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{desc}</div>
      </div>
    </div>
  );
}

function DimDetail({ title, weight, rows }: { title: string; weight: string; rows: { val: string; score: string }[] }) {
  return (
    <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{title}</div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--surface2)', color: 'var(--orange)' }}>
          weight {weight}
        </span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ color: 'var(--text-dim)' }}>
            <th className="text-left pb-1 font-medium uppercase tracking-widest" style={{ fontSize: 10 }}>Condition</th>
            <th className="text-right pb-1 font-medium uppercase tracking-widest" style={{ fontSize: 10 }}>Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
              <td className="py-1.5 pr-4" style={{ color: 'var(--text-dim)' }}>{r.val}</td>
              <td className="py-1.5 text-right font-bold" style={{ color: 'var(--text)' }}>{r.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CalibRow({ protocol, score, color }: { protocol: string; score: string; color: string }) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="text-sm" style={{ color: 'var(--text-dim)' }}>{protocol}</span>
      <span className="font-bold text-sm" style={{ color }}>{score}</span>
    </div>
  );
}

export default function MethodologyPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }} className="sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl">₿</span>
            <div>
              <div className="font-bold text-base tracking-tight" style={{ color: 'var(--text)' }}>
                BTCFi <span style={{ color: 'var(--orange)' }}>Yield Intel</span>
              </div>
              <div className="text-xs" style={{ color: 'var(--text-dim)' }}>Stacks Ecosystem</div>
            </div>
          </Link>
          <Link
            href="/"
            className="text-sm px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>Scoring Methodology</h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            Every score on BTCFi Yield Intel is computed algorithmically from publicly verifiable data.
            This page documents every dimension, weight, and formula so you can reproduce or challenge any number you see.
            Transparency is the trust layer — if our scores are a black box, you shouldn&apos;t trust them.
          </p>
        </div>

        {/* Overview */}
        <Section title="Three Scores, One Goal">
          <p className="text-sm mb-4" style={{ color: 'var(--text-dim)' }}>
            Every protocol gets three scores. Together they answer the question: <em style={{ color: 'var(--text)' }}>&ldquo;Where should my sBTC go right now?&rdquo;</em>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Risk Score', range: '1–10, lower = safer', desc: 'How dangerous is it to put capital here? Covers custody, smart contract quality, yield sustainability, exit liquidity, and transparency.', color: '#22C55E' },
              { label: 'Health Score', range: '1–10, higher = healthier', desc: 'Is the protocol gaining or losing momentum right now? Covers TVL trend, liquidity depth, utilization rate, and on-chain activity.', color: '#3B82F6' },
              { label: 'Opportunity Score', range: '1–10, higher = better', desc: 'The primary ranking signal. Combines yield with health and divides by risk. This is the product\'s core opinion.', color: '#FF5500' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="font-bold mb-1" style={{ color: s.color }}>{s.label}</div>
                <div className="text-xs font-mono mb-2" style={{ color: 'var(--text-dim)' }}>{s.range}</div>
                <div className="text-xs" style={{ color: 'var(--text-dim)' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Risk Score */}
        <Section title="Risk Score">
          <p className="text-sm mb-4" style={{ color: 'var(--text-dim)' }}>
            Five dimensions, each scored 1–10, combined with fixed institutional weights. Lower is safer.
          </p>
          <div className="rounded-xl px-4 py-3 mb-6 font-mono text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            <div className="mb-1" style={{ color: 'var(--text-dim)' }}>// Formula</div>
            riskScore =<br />
            &nbsp;&nbsp;custodyAndAssetControl&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&times; 0.20 +<br />
            &nbsp;&nbsp;smartContractAndExecution&nbsp;&nbsp;&nbsp;&nbsp;&times; 0.25 +<br />
            &nbsp;&nbsp;yieldSourceSustainability&nbsp;&nbsp;&nbsp;&nbsp;&times; 0.20 +<br />
            &nbsp;&nbsp;liquidityAndExitDynamics&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&times; 0.20 +<br />
            &nbsp;&nbsp;transparencyAndVerifiability&nbsp;&times; 0.15
          </div>

          <DimDetail
            title="Dimension 1 — Custody & Asset Control"
            weight="0.20"
            rows={[
              { val: 'Non-custodial, fully on-chain (no admin keys)', score: '1.0' },
              { val: 'Smart contract custody, no admin keys', score: '2.5' },
              { val: 'Multisig with known, public signers', score: '4.0' },
              { val: 'Third-party custodian', score: '6.0' },
              { val: 'Opaque or unknown custody arrangement', score: '8.0' },
            ]}
          />

          <DimDetail
            title="Dimension 2 — Smart Contract & Execution Risk"
            weight="0.25"
            rows={[
              { val: 'Audited by 2+ reputable firms, 18+ months incident-free', score: '1.5' },
              { val: 'Audited by 1 firm, 12+ months incident-free', score: '3.0' },
              { val: 'Audited, under 12 months live', score: '5.0' },
              { val: 'Unaudited but fully open-source', score: '6.5' },
              { val: 'Unaudited with complex logic', score: '8.5' },
              { val: '+Modifier: novel or multi-hop strategy', score: '+1.0–1.5' },
            ]}
          />

          <DimDetail
            title="Dimension 3 — Yield Source & Economic Sustainability"
            weight="0.20"
            rows={[
              { val: '100% real yield — lending interest, trading fees, Proof of Transfer', score: '1.5' },
              { val: 'Primarily real yield with minor token supplement', score: '3.0' },
              { val: 'Mixed (roughly 50/50 real vs. token emissions)', score: '5.0' },
              { val: 'Primarily token emissions', score: '7.0' },
              { val: 'Almost entirely token emissions', score: '9.0' },
            ]}
          />

          <DimDetail
            title="Dimension 4 — Liquidity & Exit Dynamics"
            weight="0.20"
            rows={[
              { val: 'Instant withdrawal, deep liquidity pool', score: '1.5' },
              { val: 'Cycle-based lock (~2 weeks), can queue unstake anytime', score: '3.0' },
              { val: 'Thin TVL, meaningful slippage risk on exit', score: '5.5' },
              { val: 'Time-lock of 30+ days', score: '6.5' },
              { val: 'Illiquid or exit mechanism unclear', score: '8.5' },
            ]}
          />

          <DimDetail
            title="Dimension 5 — Transparency & Verifiability"
            weight="0.15"
            rows={[
              { val: 'Fully on-chain, open-source, well-documented', score: '1.0' },
              { val: 'On-chain with reasonable documentation', score: '2.5' },
              { val: 'Partial transparency — some components opaque', score: '5.0' },
              { val: 'Limited public information', score: '7.0' },
              { val: 'Strategy is opaque or obscured', score: '9.0' },
            ]}
          />

          <div className="rounded-xl p-4 mt-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="font-semibold text-sm mb-3" style={{ color: 'var(--text)' }}>Calibration Reference Values</div>
            <CalibRow protocol="Native STX Stacking" score="1.8" color="#22C55E" />
            <CalibRow protocol="Dual Stacking" score="2.2" color="#22C55E" />
            <CalibRow protocol="StackingDAO stSTX" score="3.1" color="#22C55E" />
            <CalibRow protocol="Zest Protocol — BTC Supply" score="3.5" color="#F59E0B" />
            <CalibRow protocol="Granite — BTC Supply" score="4.0" color="#F59E0B" />
            <CalibRow protocol="Bitflow sBTC-STX LP" score="5.5" color="#F59E0B" />
            <CalibRow protocol="Hermetica hBTC Vault" score="5.8" color="#EF4444" />
            <CalibRow protocol="ALEX sBTC-ALEX Pool" score="6.2" color="#EF4444" />
            <CalibRow protocol="ALEX STX-ALEX Farm" score="7.1" color="#EF4444" />
          </div>
        </Section>

        {/* Health Score */}
        <Section title="Health Score">
          <p className="text-sm mb-4" style={{ color: 'var(--text-dim)' }}>
            Measures current protocol momentum and stability. A protocol can be safe but unhealthy (declining TVL), or risky but thriving. Health captures the current moment, not just the structural risk profile.
          </p>
          <div className="rounded-xl px-4 py-3 mb-6 font-mono text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            <div className="mb-1" style={{ color: 'var(--text-dim)' }}>// Formula</div>
            healthScore =<br />
            &nbsp;&nbsp;tvlTrend30d&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&times; 0.35 +<br />
            &nbsp;&nbsp;liquidityRatio&nbsp;&nbsp;&times; 0.25 +<br />
            &nbsp;&nbsp;utilizationRate&nbsp;&times; 0.20 +<br />
            &nbsp;&nbsp;protocolActivity&nbsp;&times; 0.20
          </div>

          <div className="space-y-3">
            <ScoreRow label="TVL Trend (30d)" weight="35%" desc="TVL growing strongly (+15%+) = 9–10. Flat (±2%) = 5–6. Declining = 2–4. This is the heaviest weight because momentum is the strongest short-term signal." />
            <ScoreRow label="Liquidity Ratio" weight="25%" desc="TVL relative to average daily trading volume. A higher ratio means more stable, less volatile liquidity. Thin liquidity relative to TVL signals fragility." />
            <ScoreRow label="Utilization Rate" weight="20%" desc="For lending protocols only: 75–85% utilization is optimal (score 10). Below 50% means low demand; above 95% means withdrawal risk. Non-lending protocols use a neutral estimate." />
            <ScoreRow label="Protocol Activity" weight="20%" desc="Transaction count and active wallet count over the past 7 days, benchmarked against the protocol's own history. Growing engagement = higher score." />
          </div>
        </Section>

        {/* Opportunity Score */}
        <Section title="Opportunity Score">
          <p className="text-sm mb-4" style={{ color: 'var(--text-dim)' }}>
            The primary ranking signal. This is the product&apos;s core opinion. Simple Mode always sorts by this score. It rewards high yield, rewards good health, and penalizes risk.
          </p>
          <div className="rounded-xl px-4 py-3 mb-4 font-mono text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            <div className="mb-1" style={{ color: 'var(--text-dim)' }}>// Raw formula</div>
            raw = (APY × healthScore) / (riskScore × 1.2)<br /><br />
            <div className="mb-1" style={{ color: 'var(--text-dim)' }}>// Normalized to 1–10 across all tracked protocols</div>
            opportunityScore = 1 + ((raw − min) / (max − min)) × 9
          </div>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            The 1.2 multiplier on risk score makes the penalty for risk slightly steeper than a 1× ratio — this is intentional. A 2× risk difference should reduce the opportunity score by more than a 2× APY advantage can compensate for, biasing the ranking toward safety at equal returns.
            Scores are normalized on every refresh so the full 1–10 range is always used.
          </p>
        </Section>

        {/* IL Risk */}
        <Section title="Impermanent Loss (IL) Risk">
          <p className="text-sm mb-4" style={{ color: 'var(--text-dim)' }}>
            IL Risk only applies to DEX/LP protocols. All staking, lending, and yield vault protocols automatically show &ldquo;None&rdquo; — they have no LP exposure.
          </p>
          <div className="space-y-3">
            <ScoreRow label="None" weight="—" desc="Single-asset staking, lending supply, yield vaults. No paired LP position means no impermanent loss risk." />
            <ScoreRow label="Low" weight="—" desc="Highly correlated pairs like sBTC/STX. Both assets broadly track Bitcoin price, so divergence between them is structurally limited." />
            <ScoreRow label="Medium" weight="—" desc="Semi-correlated pairs like sBTC/ALEX. ALEX has different volatility characteristics from BTC, creating meaningful divergence risk during volatile periods." />
            <ScoreRow label="High" weight="—" desc="Uncorrelated pairs, high-emission token pairs, or volatile/stable pairs (e.g. STX/ALEX Farm). Price divergence between the two assets can be extreme and is the dominant risk." />
          </div>
        </Section>

        {/* Top Pick */}
        <Section title="Top Pick Badge">
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            A protocol earns the <span className="font-bold px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--orange)', color: '#fff' }}>TOP PICK</span> badge when:
          </p>
          <div className="rounded-xl px-4 py-3 mt-3 font-mono text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            opportunityScore ≥ 8.0 AND riskScore ≤ 4.0
          </div>
          <p className="text-sm mt-3" style={{ color: 'var(--text-dim)' }}>
            A maximum of 2 protocols can hold Top Pick status at any time. This prevents the badge from being diluted. The badge is not a guarantee — it is the algorithm&apos;s current best estimate of the highest risk-adjusted opportunity on Stacks.
          </p>
        </Section>

        {/* Data Sources */}
        <Section title="Data Sources & Refresh">
          <div className="space-y-3">
            <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>DefiLlama (primary)</div>
              <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Public API, no authentication required. Used for live APY data (yields.llama.fi/pools filtered to chain=&quot;Stacks&quot;) and total chain TVL (api.llama.fi/v2/historicalChainTvl/Stacks). Refreshed every 60 seconds.
              </div>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>Protocol seed data (baseline)</div>
              <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Risk scores, health scores, APY ranges, and protocol metadata are maintained manually in our protocol registry. These are based on public audit reports, on-chain analysis, and protocol documentation. Seed values are used when live data is unavailable.
              </div>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>Anomaly detection</div>
              <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                If a live APY fetch returns a value more than 80% below the known baseline range for a protocol (e.g. Hermetica showing 1.79% when the baseline is 8–16%), the value is rejected as a data error. The last known good value is shown with a stale indicator. This exists because our primary competitor (BitcoinYield.com) displays these erroneous values as real data — we do not.
              </div>
            </div>
          </div>
        </Section>

        {/* Score colors */}
        <Section title="How to Read the Color Codes">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="font-semibold mb-2" style={{ color: 'var(--text)' }}>Risk Score</div>
              <div style={{ color: '#22C55E' }}>● 1.0–3.0 — Low risk (green)</div>
              <div style={{ color: '#F59E0B' }}>● 3.1–5.5 — Medium risk (yellow)</div>
              <div style={{ color: '#EF4444' }}>● 5.6–10 — High risk (red)</div>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="font-semibold mb-2" style={{ color: 'var(--text)' }}>Health Score</div>
              <div style={{ color: '#22C55E' }}>● 8.0–10 — Thriving (green)</div>
              <div style={{ color: '#F59E0B' }}>● 6.5–7.9 — Stable (yellow)</div>
              <div style={{ color: '#EF4444' }}>● Below 6.5 — Declining (red)</div>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="font-semibold mb-2" style={{ color: 'var(--text)' }}>Opportunity Score</div>
              <div style={{ color: '#22C55E' }}>● 8.0–10 — Strong (green)</div>
              <div style={{ color: '#F59E0B' }}>● 6.5–7.9 — Good (yellow)</div>
              <div style={{ color: '#FF5500' }}>● Below 6.5 — Moderate (orange)</div>
            </div>
          </div>
        </Section>

        {/* Disclaimer */}
        <div className="rounded-xl px-4 py-4 text-xs" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
          <strong style={{ color: 'var(--text)' }}>Not financial advice.</strong> All scores are algorithmic estimates based on publicly available data. They reflect our best analysis at the time of computation but do not guarantee future performance, safety, or returns. DeFi protocols carry smart contract risk, market risk, and liquidity risk. Always do your own research before deploying capital.
        </div>

        <div className="mt-8 text-center text-xs" style={{ color: 'var(--text-dim)' }}>
          BTCFi Yield Intel — Stacks Ecosystem Dashboard · Methodology v1.0
          <Link href="/" className="ml-4 hover:opacity-80" style={{ color: 'var(--orange)' }}>← Back to Dashboard</Link>
        </div>
      </main>
    </div>
  );
}
