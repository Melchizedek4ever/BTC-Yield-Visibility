'use client';

import { formatTvl, formatApy, riskColor, healthColor, ilRiskColor, isTopPick, riskTier, initials, COMING_SOON_COLOR } from '@/lib/utils';
import { classifyRiskSignals } from '@/lib/riskSignals';
import type { YieldProtocol } from '@/lib/types';
import { useDashboardStore } from '@/lib/store';

interface ProtocolCardProps {
  protocol: YieldProtocol;
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1 w-full" style={{ background: 'var(--surface2)' }}>
      <div className="h-full" style={{ width: `${(value / 10) * 100}%`, background: color }} />
    </div>
  );
}

export default function ProtocolCard({ protocol: p }: ProtocolCardProps) {
  const { visibleMetrics } = useDashboardStore();
  const comingSoon = p.status === 'coming-soon';
  const topPick = !comingSoon && isTopPick(p.opportunityScore, p.riskScore);
  const show = (key: string) => visibleMetrics.has(key);
  const tier = riskTier(p.riskScore);
  const accent = comingSoon ? COMING_SOON_COLOR : tier.color;
  const oppColor = topPick ? 'var(--gold)' : 'var(--text-dim)';
  const apyColorVal = comingSoon ? 'var(--text-dim)' : accent;
  const signals = !comingSoon && p.riskFactors ? classifyRiskSignals(p.riskFactors) : null;

  return (
    <div
      className="risk-card relative flex flex-col gap-3 p-4"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-strong)',
        borderLeft: `3px solid ${accent}`,
        opacity: comingSoon ? 0.85 : 1,
      }}
    >
      {comingSoon ? (
        <div className="absolute top-0 right-0 font-mono-data text-[10px] font-bold px-2 py-0.5 tracking-wide" style={{ background: COMING_SOON_COLOR, color: '#0A0C10' }}>
          COMING SOON
        </div>
      ) : topPick && (
        <div className="absolute top-0 right-0 font-mono-data text-[10px] font-bold px-2 py-0.5 tracking-wide" style={{ background: 'var(--gold)', color: '#0A0C10' }}>
          TOP PICK
        </div>
      )}

      {/* The whole card except the disclosure below is the link — details/summary is
          interactive content and can't validly nest inside <a>, and nesting it would
          also make expanding it navigate away via the anchor's own click handling. */}
      <a
        href={comingSoon ? p.websiteUrl : p.appUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col gap-3 no-underline"
        style={{ color: 'inherit' }}
      >
        <div className="flex items-start gap-3">
          <div
            className="font-mono-data text-[11px] font-bold w-7 h-7 flex items-center justify-center flex-none"
            style={{ border: `1px solid ${topPick ? 'var(--gold)' : 'var(--border-strong)'}`, color: topPick ? 'var(--gold)' : 'var(--text-dim)' }}
            aria-hidden="true"
          >
            {initials(p.shortName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{p.name}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{p.description}</div>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="font-mono-data text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-faint)' }}>
              {comingSoon ? 'Target APY' : 'APY'}
            </div>
            <div className="font-mono-data text-3xl" style={{ color: apyColorVal }}>
              {comingSoon ? `~${formatApy(p.apy)}` : formatApy(p.apy)}
            </div>
            <div className="font-mono-data text-[11px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
              {p.apyRange.min}–{p.apyRange.max}% range · earn {p.earnAsset}
            </div>
          </div>

          {comingSoon ? (
            <div className="text-right">
              <div className="font-mono-data text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-faint)' }}>Launch</div>
              <div className="font-mono-data text-lg" style={{ color: 'var(--text)' }}>{p.launchTarget}</div>
            </div>
          ) : show('opportunityScore') && (
            <div className="text-right">
              <div className="font-mono-data text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-faint)' }}>Opportunity</div>
              <div className="font-mono-data text-2xl" style={{ color: oppColor }}>{p.opportunityScore.toFixed(1)}</div>
            </div>
          )}
        </div>

        {!comingSoon && show('opportunityScore') && <ScoreBar value={p.opportunityScore} color={oppColor} />}

        {comingSoon && p.capacityNote && (
          <div className="text-xs px-3 py-2" style={{ background: 'var(--surface2)', color: 'var(--text-dim)', borderLeft: `2px solid ${COMING_SOON_COLOR}` }}>
            {p.capacityNote}
          </div>
        )}

        {!comingSoon && show('riskExplanation') && p.riskExplanation && (
          <div className="text-xs leading-relaxed px-3 py-2" style={{ background: 'var(--surface2)', color: 'var(--text-dim)', borderLeft: `2px solid ${tier.color}` }}>
            <b style={{ color: tier.color, fontWeight: 600 }}>{tier.label}.</b> {p.riskExplanation}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          {show('tvlUsd') && (
            <div>
              <div className="font-mono-data uppercase tracking-widest text-[10px]" style={{ color: 'var(--text-faint)' }}>TVL</div>
              <div className="font-mono-data font-semibold">{comingSoon ? '—' : formatTvl(p.tvlUsd)}</div>
            </div>
          )}
          {show('riskScore') && (
            <div>
              <div className="font-mono-data uppercase tracking-widest text-[10px]" style={{ color: 'var(--text-faint)' }}>Risk</div>
              <div className="font-mono-data font-semibold" style={{ color: riskColor(p.riskScore) }}>{p.riskScore.toFixed(1)} / 10</div>
            </div>
          )}
          {show('healthScore') && (
            <div>
              <div className="font-mono-data uppercase tracking-widest text-[10px]" style={{ color: 'var(--text-faint)' }}>Health</div>
              <div className="font-mono-data font-semibold" style={{ color: healthColor(p.healthScore) }}>{p.healthScore.toFixed(1)} / 10</div>
            </div>
          )}
          {show('ilRisk') && p.category === 'DEX/LP' && (
            <div>
              <div className="font-mono-data uppercase tracking-widest text-[10px]" style={{ color: 'var(--text-faint)' }}>IL Risk</div>
              <div className="font-semibold" style={{ color: ilRiskColor(p.ilRisk) }}>{p.ilRisk}</div>
            </div>
          )}
          {show('lockupPeriod') && (
            <div>
              <div className="font-mono-data uppercase tracking-widest text-[10px]" style={{ color: 'var(--text-faint)' }}>Lock-up</div>
              <div className="font-semibold truncate">{p.lockupPeriod}</div>
            </div>
          )}
          {show('audited') && !comingSoon && (
            <div>
              <div className="font-mono-data uppercase tracking-widest text-[10px]" style={{ color: 'var(--text-faint)' }}>Audited</div>
              <div className="font-semibold" style={{ color: p.audited ? 'var(--safe)' : 'var(--danger)' }}>{p.audited ? 'Yes' : 'No'}</div>
            </div>
          )}
        </div>

        {show('strategy') && (
          <div className="text-xs px-3 py-2" style={{ background: 'var(--surface2)', color: 'var(--text-dim)' }}>{p.strategy}</div>
        )}

        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="font-mono-data px-2 py-0.5 text-[10px] font-semibold" style={{ color: accent, border: `1px solid ${accent}66` }}>
            {comingSoon ? 'UNRATED' : tier.label.toUpperCase()}
          </span>
          <span className="font-mono-data px-2 py-0.5 text-[10px]" style={{ color: 'var(--text-dim)', border: '1px solid var(--border-strong)' }}>
            {p.category.toUpperCase()}
          </span>
          {p.supportedAssets.map(a => (
            <span key={a} className="font-mono-data px-2 py-0.5 text-[10px]" style={{ color: 'var(--info)', border: '1px solid var(--info-tint)' }}>
              {a}
            </span>
          ))}
          {p.scoresEstimated && !comingSoon && (
            <span
              className="font-mono-data px-2 py-0.5 text-[10px]"
              style={{ color: 'var(--caution)', border: '1px solid var(--caution)' }}
              title="No live data available — showing curated baseline values."
            >
              EST.
            </span>
          )}
          {p.isStale && !comingSoon && (
            <span
              className="font-mono-data px-2 py-0.5 text-[10px]"
              style={{ color: 'var(--info)', border: '1px solid var(--info)' }}
              title="Live APY looked anomalous — showing the last known good value instead."
            >
              STALE
            </span>
          )}
        </div>
      </a>

      {signals && p.riskFactors && (signals.positive.length > 0 || signals.negative.length > 0) && (
        <details className="mt-auto">
          <summary
            className="font-mono-data text-[10px] uppercase tracking-widest select-none"
            style={{ color: 'var(--text-faint)', cursor: 'pointer' }}
          >
            Why this score
          </summary>
          <div className="flex flex-col gap-3 mt-3 text-xs">
            {signals.positive.length > 0 && (
              <div>
                <div className="font-mono-data text-[10px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--safe)' }}>
                  Positive signals
                </div>
                <ul className="flex flex-col gap-1">
                  {signals.positive.map(s => (
                    <li key={s.key} className="flex gap-1.5" style={{ color: 'var(--text-dim)' }}>
                      <span style={{ color: 'var(--safe)' }} aria-hidden="true">+</span>
                      <span>{s.rationale}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {signals.negative.length > 0 && (
              <div>
                <div className="font-mono-data text-[10px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--danger)' }}>
                  Negative signals
                </div>
                <ul className="flex flex-col gap-1">
                  {signals.negative.map(s => (
                    <li key={s.key} className="flex gap-1.5" style={{ color: 'var(--text-dim)' }}>
                      <span style={{ color: 'var(--danger)' }} aria-hidden="true">−</span>
                      <span>{s.rationale}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <div className="font-mono-data text-[10px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-faint)' }}>
                Risk factors
              </div>
              <ul className="flex flex-col gap-1">
                {p.riskFactors.map(f => (
                  <li key={f.key} className="flex items-center justify-between gap-3">
                    <span style={{ color: 'var(--text-dim)' }}>{f.label}</span>
                    <span className="font-mono-data font-semibold" style={{ color: riskColor(f.score) }}>{f.score.toFixed(1)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </details>
      )}
    </div>
  );
}
