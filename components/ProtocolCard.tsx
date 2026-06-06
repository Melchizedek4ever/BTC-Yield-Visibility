'use client';

import { formatTvl, formatApy, riskColor, healthColor, opportunityColor, ilRiskColor, isTopPick } from '@/lib/utils';
import type { YieldProtocol } from '@/lib/types';
import { useDashboardStore } from '@/lib/store';

interface ProtocolCardProps {
  protocol: YieldProtocol;
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full w-full" style={{ background: 'var(--surface2)' }}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${(value / 10) * 100}%`, background: color }}
      />
    </div>
  );
}

export default function ProtocolCard({ protocol: p }: ProtocolCardProps) {
  const { visibleMetrics } = useDashboardStore();
  const topPick = isTopPick(p.opportunityScore, p.riskScore);
  const show = (key: string) => visibleMetrics.has(key);
  const oppColor = opportunityColor(p.opportunityScore);

  return (
    <div
      className="relative rounded-xl p-4 flex flex-col gap-3 transition-all cursor-pointer group"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${topPick ? '#FF550033' : 'var(--border)'}`,
      }}
      onClick={() => window.open(p.appUrl, '_blank')}
    >
      {topPick && (
        <div
          className="absolute top-0 right-0 text-xs font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-xl"
          style={{ background: 'var(--orange)', color: '#fff' }}
        >
          TOP PICK
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="text-3xl select-none">{p.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
            {p.name}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
            {p.description}
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-dim)' }}>APY</div>
          <div className="text-3xl font-extrabold" style={{ color: '#22C55E' }}>
            {formatApy(p.apy)}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
            {p.apyRange.min}–{p.apyRange.max}% range · earn {p.earnAsset}
          </div>
        </div>

        {show('opportunityScore') && (
          <div className="text-right">
            <div className="text-xs uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-dim)' }}>Opportunity</div>
            <div className="text-2xl font-bold" style={{ color: oppColor }}>
              {p.opportunityScore.toFixed(1)}
            </div>
          </div>
        )}
      </div>

      {show('opportunityScore') && (
        <ScoreBar value={p.opportunityScore} color={oppColor} />
      )}

      <div className="grid grid-cols-2 gap-2 text-xs">
        {show('tvlUsd') && (
          <div>
            <div className="uppercase tracking-widest" style={{ color: 'var(--text-dim)', fontSize: 10 }}>TVL</div>
            <div className="font-semibold">{formatTvl(p.tvlUsd)}</div>
          </div>
        )}

        {show('riskScore') && (
          <div>
            <div className="uppercase tracking-widest" style={{ color: 'var(--text-dim)', fontSize: 10 }}>Risk</div>
            <div className="font-bold" style={{ color: riskColor(p.riskScore) }}>
              {p.riskScore.toFixed(1)} / 10
            </div>
          </div>
        )}

        {show('healthScore') && (
          <div>
            <div className="uppercase tracking-widest" style={{ color: 'var(--text-dim)', fontSize: 10 }}>Health</div>
            <div className="font-bold" style={{ color: healthColor(p.healthScore) }}>
              {p.healthScore.toFixed(1)} / 10
            </div>
          </div>
        )}

        {show('ilRisk') && p.category === 'DEX/LP' && (
          <div>
            <div className="uppercase tracking-widest" style={{ color: 'var(--text-dim)', fontSize: 10 }}>IL Risk</div>
            <div className="font-semibold" style={{ color: ilRiskColor(p.ilRisk) }}>
              {p.ilRisk}
            </div>
          </div>
        )}

        {show('lockupPeriod') && (
          <div>
            <div className="uppercase tracking-widest" style={{ color: 'var(--text-dim)', fontSize: 10 }}>Lock-up</div>
            <div className="font-semibold truncate">{p.lockupPeriod}</div>
          </div>
        )}

        {show('audited') && (
          <div>
            <div className="uppercase tracking-widest" style={{ color: 'var(--text-dim)', fontSize: 10 }}>Audited</div>
            <div className="font-semibold" style={{ color: p.audited ? '#22C55E' : '#EF4444' }}>
              {p.audited ? '✓ Yes' : '✗ No'}
            </div>
          </div>
        )}
      </div>

      {show('strategy') && (
        <div className="text-xs rounded-lg px-3 py-2" style={{ background: 'var(--surface2)', color: 'var(--text-dim)' }}>
          {p.strategy}
        </div>
      )}

      <div className="flex gap-1.5 flex-wrap mt-auto">
        <span
          className="px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}
        >
          {p.category}
        </span>
        {p.supportedAssets.map(a => (
          <span
            key={a}
            className="px-2 py-0.5 rounded-full text-xs"
            style={{ background: '#1a1a2e', color: 'var(--blue)', border: '1px solid #3B82F622' }}
          >
            {a}
          </span>
        ))}
        {p.scoresEstimated && (
          <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: '#2a1a00', color: '#F59E0B', border: '1px solid #F59E0B22' }}>
            est.
          </span>
        )}
      </div>
    </div>
  );
}
