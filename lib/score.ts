import type { EnrichedCluster } from './llm';
import type { RawTrend, RankedTrend, SourceName, Category } from './types';
import { CATEGORY_META } from './types';

/**
 * Heat score.
 *
 * Transparent weighted sum — every component is auditable. This is deliberate:
 * a PM should be able to explain, tag by tag, WHY it ranks where it does.
 *
 * heat = 100 * (
 *   0.30 * signalStrength   // how strong the raw signal was inside each source
 * + 0.25 * crossSource      // cross-source corroboration (sqrt of unique sources)
 * + 0.20 * recency          // how fresh the most recent member is
 * + 0.15 * categoryPrior    // ShareChat's content-pillar prior
 * + 0.10 * indiaRelevance   // model-assessed India relevance
 * )
 */

const WEIGHTS = {
  signal:        0.30,
  crossSource:   0.25,
  recency:       0.20,
  category:      0.15,
  indiaRel:      0.10,
};

function hoursSince(iso?: string): number {
  if (!iso) return 12;
  const t = Date.parse(iso);
  if (isNaN(t)) return 12;
  return (Date.now() - t) / 3_600_000;
}

export interface ScoreComponents {
  signal: number;
  crossSource: number;
  recency: number;
  category: number;
  indiaRel: number;
  total: number;
}

export function scoreCluster(
  cluster: EnrichedCluster,
  members: RawTrend[],
): ScoreComponents {
  // signal: average normalized sourceScore across members, but boosted by
  // the STRONGEST signal (a trend with one very strong source is still a trend).
  const scores = members.map(m => m.sourceScore);
  const avg = scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length);
  const max = Math.max(0, ...scores);
  const signal = 0.6 * max + 0.4 * avg;

  // crossSource: unique sources, sqrt-scaled so 2 sources ≈ 0.7, 3 ≈ 0.87
  const uniqueSources = new Set(members.map(m => m.source));
  const crossSource = Math.min(1, Math.sqrt(uniqueSources.size) / Math.sqrt(3));

  // recency: freshest member's age decayed over 12h
  const minHours = Math.min(...members.map(m => hoursSince(m.publishedAt)));
  const recency = Math.max(0, 1 - minHours / 12);

  // category prior: from CATEGORY_META
  const prior = CATEGORY_META[cluster.category]?.prior ?? 1.0;
  // normalize prior around 1.0 so it lives in [~0.85, ~1.20]; map to 0..1
  const category = Math.max(0, Math.min(1, (prior - 0.8) / 0.4));

  const indiaRel = cluster.indiaRelevance;

  const total =
    WEIGHTS.signal      * signal +
    WEIGHTS.crossSource * crossSource +
    WEIGHTS.recency     * recency +
    WEIGHTS.category    * category +
    WEIGHTS.indiaRel    * indiaRel;

  return { signal, crossSource, recency, category, indiaRel, total };
}

/**
 * MMR-style diversification.
 *
 * Problem we're solving: cricket will often dominate (multiple cricket stories
 * from news + google trends + reddit). Without diversification we'd end up
 * with "6 cricket tags, 2 entertainment" which is bad for the feed.
 *
 * Approach: greedy selection. At each step, pick the highest-scoring
 * candidate, then apply a penalty to remaining candidates in the same
 * category. Not true MMR (we don't have embeddings for each cluster),
 * but functionally equivalent for category-level diversity, which is what
 * actually matters here.
 */
export function diversify<T extends { category: Category; score: number }>(
  items: T[],
  targetCount: number,
  categoryPenalty = 0.08,
): T[] {
  const pool = items.map(i => ({ ...i }));
  const selected: T[] = [];
  const catCount: Record<string, number> = {};

  while (selected.length < targetCount && pool.length > 0) {
    // Apply dynamic penalty based on how many of this category already selected.
    const adjusted = pool.map(p => ({
      item: p,
      adjScore: p.score - (catCount[p.category] ?? 0) * categoryPenalty,
    }));
    adjusted.sort((a, b) => b.adjScore - a.adjScore);
    const top = adjusted[0].item;
    selected.push(top);
    catCount[top.category] = (catCount[top.category] ?? 0) + 1;
    const idx = pool.indexOf(top);
    if (idx !== -1) pool.splice(idx, 1);
  }
  return selected;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60) || `t-${Math.random().toString(36).slice(2, 8)}`;
}

export function estimateApproxPosts(members: RawTrend[]): number {
  // Rough number for UI realism. Google Trends gives us traffic; otherwise
  // we extrapolate from sourceScore. This is just cosmetic — shown as
  // "approx X posts" in the UI.
  const gt = members.find(m => m.source === 'google_trends' && m.traffic);
  if (gt?.traffic) {
    // Traffic is search volume; posts are a fraction. Rough heuristic.
    return Math.round(gt.traffic * 0.15);
  }
  const topScore = Math.max(...members.map(m => m.sourceScore));
  return Math.round(1000 + topScore * 40000);
}
