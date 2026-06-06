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

export function riskColor(score: number): string {
  if (score <= 3) return '#22C55E';
  if (score <= 5.5) return '#F59E0B';
  return '#EF4444';
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
