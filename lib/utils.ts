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
  /** Solid accent color (safe → danger heat ramp). */
  color: string;
  /** Low-alpha version of `color` for tinted backgrounds. */
  tint: string;
}

/**
 * Single source of truth for risk-tier color coding. Desaturated,
 * terminal-grade tones — never neon — and always paired with a text
 * label at the call site, never color alone.
 */
export function riskTier(score: number): RiskTier {
  if (score <= 2.5) return { key: 'conservative', label: 'Conservative', color: '#4C9E7C', tint: 'rgba(76,158,124,0.12)' };
  if (score <= 4.5) return { key: 'balanced', label: 'Balanced', color: '#C4923F', tint: 'rgba(196,146,63,0.12)' };
  if (score <= 6.5) return { key: 'elevated', label: 'Elevated', color: '#C4753F', tint: 'rgba(196,117,63,0.12)' };
  return { key: 'aggressive', label: 'Aggressive', color: '#C15850', tint: 'rgba(193,88,80,0.12)' };
}

export const COMING_SOON_COLOR = '#5F6672';

export function riskColor(score: number): string {
  return riskTier(score).color;
}

export function healthColor(score: number): string {
  if (score >= 8) return '#4C9E7C';
  if (score >= 6.5) return '#C4923F';
  return '#C15850';
}

/**
 * Opportunity score color. Gold is spent once per screen — only a
 * genuine top-tier score (the Top Pick threshold) earns it. Everything
 * else stays neutral so gold keeps meaning something when it appears.
 */
export function opportunityColor(score: number): string {
  if (score >= 8) return '#C9A24A';
  if (score >= 6.5) return '#8B93A3';
  return '#545C6A';
}

export function ilRiskColor(il: string): string {
  switch (il) {
    case 'None': return '#4C9E7C';
    case 'Low': return '#C4923F';
    case 'Medium': return '#C4753F';
    case 'High': return '#C15850';
    default: return '#545C6A';
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

/**
 * A 1-2 letter mark derived from a protocol's short name, used in place
 * of emoji icons. Deterministic, licensing-free, and swappable for a
 * real logo later with no layout change.
 */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
