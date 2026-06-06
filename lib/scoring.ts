import type { YieldProtocol } from './types';

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function normalize(val: number, allVals: number[]): number {
  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  if (max === min) return 5;
  return 1 + ((val - min) / (max - min)) * 9;
}

export function computeOpportunityScore(apy: number, healthScore: number, riskScore: number): number {
  if (riskScore <= 0) return 1;
  const raw = (apy * healthScore) / (riskScore * 1.2);
  return raw;
}

export function normalizeOpportunityScores(protocols: YieldProtocol[]): YieldProtocol[] {
  const rawScores = protocols.map(p => computeOpportunityScore(p.apy, p.healthScore, p.riskScore));
  const min = Math.min(...rawScores);
  const max = Math.max(...rawScores);

  return protocols.map((p, i) => {
    let normalized = 5;
    if (max !== min) {
      normalized = 1 + ((rawScores[i] - min) / (max - min)) * 9;
    }
    return {
      ...p,
      opportunityScore: parseFloat(clamp(normalized, 1, 10).toFixed(1)),
    };
  });
}

export function enrichWithLiveData(
  seed: YieldProtocol[],
  llamaData: Record<string, { apy: number; tvlUsd: number }>
): YieldProtocol[] {
  const enriched = seed.map(p => {
    const live = p.defiLlamaProject ? llamaData[p.defiLlamaProject] : null;
    if (!live) return p;
    return {
      ...p,
      apy: live.apy ?? p.apy,
      tvlUsd: live.tvlUsd ?? p.tvlUsd,
      lastUpdated: new Date().toISOString(),
    };
  });

  return normalizeOpportunityScores(enriched);
}
