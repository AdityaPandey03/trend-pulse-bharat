import type { RawTrend, RankedTrend, TrendsResponse, SourceName } from './types';
import { fetchGoogleTrends } from './sources/google-trends';
import { fetchNews } from './sources/news-rss';
import { fetchRedditIndia } from './sources/reddit-india';
import { enrichWithClaude } from './llm';
import { scoreCluster, diversify, slugify, estimateApproxPosts } from './score';
import { cacheGet, cacheSet, cacheTtlRemaining } from './cache';

const CACHE_KEY = 'trends:v1';
const DEFAULT_TTL = 600; // 10 min

/**
 * Run the full pipeline:
 *   1. Fetch all sources in parallel
 *   2. Hard cap candidate count (send at most ~45 to LLM to stay cheap)
 *   3. Call Claude once to cluster + enrich all candidates
 *   4. Score each cluster transparently
 *   5. Diversify so no one category dominates
 *   6. Return top N
 */
export async function runPipeline(): Promise<TrendsResponse> {
  const ttl = Number(process.env.TRENDS_CACHE_TTL ?? DEFAULT_TTL);
  const outputCount = Number(process.env.TRENDS_OUTPUT_COUNT ?? 15);

  // Cache check
  const cached = cacheGet<TrendsResponse>(CACHE_KEY);
  if (cached) {
    return { ...cached, cacheHit: true };
  }

  // 1. Fetch in parallel — any one source failing must not kill the pipeline
  const [gtSettled, newsSettled, redditSettled] = await Promise.allSettled([
    fetchGoogleTrends(),
    fetchNews(),
    fetchRedditIndia(),
  ]);

  const gt = gtSettled.status === 'fulfilled' ? gtSettled.value : [];
  const news = newsSettled.status === 'fulfilled' ? newsSettled.value : [];
  const reddit = redditSettled.status === 'fulfilled' ? redditSettled.value : [];

  // 2. Combine + rank candidates within their sources, then take top-K per source
  //    Why cap per source: we don't want news_rss (which has 7 feeds × 8 items)
  //    to drown out Google Trends. Balanced representation → better clustering.
  const CAPS: Record<SourceName, number> = {
    google_trends: 20,
    news_rss:      18,
    reddit_india:  10,
  };

  const allByCap: RawTrend[] = [];
  for (const src of [gt, news, reddit]) {
    if (src.length === 0) continue;
    const cap = CAPS[src[0].source];
    const topOfSource = [...src].sort((a, b) => b.sourceScore - a.sourceScore).slice(0, cap);
    allByCap.push(...topOfSource);
  }

  if (allByCap.length === 0) {
    throw new Error('All trend sources returned empty. Likely a network/DNS issue or blocked outbound.');
  }

  // 3. LLM enrichment — clusters + categorizes + translates in one call
  const clusters = await enrichWithClaude(allByCap);

  // 4. Score
  const scored = clusters.map(cluster => {
    const members = cluster.memberIndices.map(i => allByCap[i]).filter(Boolean);
    const score = scoreCluster(cluster, members);
    return { cluster, members, score };
  });

  // 5. Diversify (greedy with per-category penalty)
  //    We pass a flattened `score` (number) for diversify to sort on,
  //    but we carry the full ScoreComponents alongside under `scoreComponents`.
  const diversified = diversify(
    scored.map(s => ({
      cluster: s.cluster,
      members: s.members,
      scoreComponents: s.score,
      score: s.score.total,      // used for diversification ranking
      category: s.cluster.category,
    })),
    outputCount,
  );

  // 6. Format final response
  const ranked: RankedTrend[] = diversified.map((s, i) => {
    const { cluster, members, scoreComponents: score } = s;
    const primaryUrl = members.find(m => m.url)?.url;
    const heat = Math.round(score.total * 100);
    return {
      id: `tr_${i + 1}_${slugify(cluster.canonicalTitle).slice(0, 20)}`,
      rank: i + 1,
      hashtagHi: cluster.hashtagHi,
      hashtagEn: cluster.hashtagEn,
      descriptionHi: cluster.descriptionHi,
      descriptionEn: cluster.descriptionEn,
      category: cluster.category,
      heat,
      sources: Array.from(new Set(members.map(m => m.source))) as SourceName[],
      approxPosts: estimateApproxPosts(members),
      primaryUrl,
      slug: slugify(cluster.canonicalTitle),
      scoreBreakdown: {
        signal:      Number(score.signal.toFixed(3)),
        crossSource: Number(score.crossSource.toFixed(3)),
        recency:     Number(score.recency.toFixed(3)),
        category:    Number(score.category.toFixed(3)),
        indiaRel:    Number(score.indiaRel.toFixed(3)),
      },
    };
  });

  const now = new Date();
  const response: TrendsResponse = {
    generatedAt: now.toISOString(),
    count: ranked.length,
    cacheHit: false,
    nextRefreshAt: new Date(now.getTime() + ttl * 1000).toISOString(),
    trends: ranked,
  };

  cacheSet(CACHE_KEY, response, ttl);
  return response;
}

export function getCacheAge(): number {
  return DEFAULT_TTL - cacheTtlRemaining(CACHE_KEY);
}
