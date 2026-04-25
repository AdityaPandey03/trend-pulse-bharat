import type { RawTrend } from '../types';

/**
 * Reddit r/india — cultural pulse signal.
 *
 * Why: Reddit is tech-skewed but r/india surfaces the stuff that's
 * virally shared and reshared across Indian internet — memes, cultural
 * moments, "India abroad" stories, viral videos. It's a useful
 * complement to the news-centric feeds: if something trends on Reddit
 * AND in news, it's definitely real; if it only trends on Reddit, it's
 * a candidate "viral" / meme.
 *
 * Reddit's public JSON endpoint requires no auth but is rate-limited.
 * We only pull the hot page (25 posts), so we stay well inside limits.
 */

const URL = 'https://www.reddit.com/r/india/hot.json?limit=25';

interface RedditChild {
  data?: {
    title?: string;
    selftext?: string;
    score?: number;
    num_comments?: number;
    created_utc?: number;
    permalink?: string;
    is_self?: boolean;
    url?: string;
    stickied?: boolean;
  };
}

export async function fetchRedditIndia(): Promise<RawTrend[]> {
  let json: { data?: { children?: RedditChild[] } };
  try {
    const res = await fetch(URL, {
      headers: { 'User-Agent': 'ShareChatTrendsBot/1.0 (assignment)' },
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    json = await res.json();
  } catch {
    return [];
  }

  const children = json.data?.children ?? [];
  const posts = children
    .map(c => c.data)
    .filter((d): d is NonNullable<RedditChild['data']> => !!d && !d.stickied && !!d.title);

  if (posts.length === 0) return [];

  const maxScore = Math.max(1, ...posts.map(p => p.score ?? 0));

  const now = Date.now() / 1000;
  return posts.map(p => {
    const ageHours = ((now - (p.created_utc ?? now)) / 3600);
    // Recency decay over 24h — Reddit hot already does this, but reinforce it.
    const recency = Math.max(0, 1 - ageHours / 24);
    const engagement = (p.score ?? 0) / maxScore;
    return {
      title: (p.title ?? '').trim(),
      context: (p.selftext ?? '').slice(0, 280),
      source: 'reddit_india' as const,
      sourceScore: 0.65 * engagement + 0.35 * recency,
      publishedAt: new Date((p.created_utc ?? now) * 1000).toISOString(),
      url: p.permalink ? `https://reddit.com${p.permalink}` : undefined,
      meta: { comments: p.num_comments ?? 0, score: p.score ?? 0 },
    };
  }).filter(r => r.title.length > 5);
}
