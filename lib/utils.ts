export function formatTvl(val: number): string {
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

export function formatApy(val: number): string {
  return `${val.toFixed(1)}%`;
}

export function formatChange(val: number): string {
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}%`;
}

export interface RiskTier {
  key: 'conservative' | 'balanced' | 'elevated' | 'aggressive';
  label: string;
  /** Solid accent color (green → red heat ramp). */
  color: string;
  /** Low-alpha version of `color` for tinted backgrounds. */
  tint: string;
}

/**
 * Single source of truth for risk-tier color coding.
 * Green (safe) → yellow → orange → red (risky), based on the 1–10 risk score.
 */
export function riskTier(score: number): RiskTier {
  if (score <= 2.5) return { key: 'conservative', label: 'Conservative', color: '#22C55E', tint: '#22C55E1A' };
  if (score <= 4.5) return { key: 'balanced', label: 'Balanced', color: '#EAB308', tint: '#EAB3081A' };
  if (score <= 6.5) return { key: 'elevated', label: 'Elevated', color: '#F97316', tint: '#F973161A' };
  return { key: 'aggressive', label: 'Aggressive', color: '#EF4444', tint: '#EF44441A' };
}

export const COMING_SOON_COLOR = '#64748B';

export function riskColor(score: number): string {
  return riskTier(score).color;
}

/**
 * "Yield heat" ramp for APY — cool green (modest) → gold (hot), kept in a
 * green→gold family so it stays visually distinct from the risk red scale.
 */
export function apyColor(apy: number): string {
  if (apy < 5) return '#34D399';   // emerald — modest
  if (apy < 12) return '#22C55E';  // green
  if (apy < 25) return '#A3E635';  // lime
  if (apy < 40) return '#FACC15';  // gold
  return '#FBBF24';                // amber — hot
}

export function healthColor(score: number): string {
  if (score >= 8) return '#22C55E';
  if (score >= 6.5) return '#F59E0B';
  return '#EF4444';
}

export function opportunityColor(score: number): string {
  if (score >= 8) return '#22C55E';
  if (score >= 6.5) return '#F59E0B';
  return '#FF5500';
}

export function ilRiskColor(il: string): string {
  switch (il) {
    case 'None': return '#22C55E';
    case 'Low': return '#F59E0B';
    case 'Medium': return '#FF5500';
    case 'High': return '#EF4444';
    default: return '#888888';
  }
}

export function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function isTopPick(opportunityScore: number, riskScore: number): boolean {
  return opportunityScore >= 8.0 && riskScore <= 4.0;
}
