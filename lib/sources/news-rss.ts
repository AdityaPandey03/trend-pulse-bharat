import { XMLParser } from 'fast-xml-parser';
import type { RawTrend } from '../types';

/**
 * Indian news RSS aggregator.
 *
 * Why these feeds: we deliberately mix mainstream English (TOI, NDTV, HT)
 * with broad-interest categories (entertainment, cricket, business). We skip
 * niche verticals because ShareChat is mass-market.
 *
 * If you extend this for production, add Hindi outlets — Dainik Jagran,
 * Bhaskar, Aaj Tak — whose RSS feeds exist but require handling Devanagari
 * script at ingest time.
 */

interface FeedDef {
  url: string;
  label: string;   // short label shown in source chips
  // weight within the news source category (some outlets more broad-appeal).
  weight: number;
}

const FEEDS: FeedDef[] = [
  { url: 'https://www.thehindu.com/news/national/feeder/default.rss',                      label: 'The Hindu',   weight: 1.0 },
  { url: 'https://feeds.feedburner.com/ndtvnews-top-stories',                               label: 'NDTV',        weight: 1.0 },
  { url: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml',                 label: 'HT',          weight: 1.0 },
  { url: 'https://indianexpress.com/section/india/feed/',                                   label: 'IE',          weight: 0.9 },
  { url: 'https://www.indiatoday.in/rss/1206514',                                           label: 'India Today', weight: 1.0 },
  // Entertainment + cricket — genuinely hot ShareChat categories
  { url: 'https://www.bollywoodhungama.com/rss/news.xml',                                   label: 'Bollywood H', weight: 1.1 },
  { url: 'https://www.news18.com/commonfeeds/v1/eng/rss/cricket.xml',                       label: 'News18 Cric', weight: 1.1 },
];

interface RssItem {
  title?: string | { '#text'?: string };
  description?: string;
  pubDate?: string;
  link?: string | { '#text'?: string };
}

function textOf(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'object' && v !== null && '#text' in v) {
    return String((v as Record<string, unknown>)['#text'] ?? '').trim();
  }
  return String(v).trim();
}

function hoursSince(iso?: string): number {
  if (!iso) return 48; // assume 2 days old if unknown -> weak recency
  const t = Date.parse(iso);
  if (isNaN(t)) return 48;
  return (Date.now() - t) / 3_600_000;
}

async function fetchOne(feed: FeedDef): Promise<RawTrend[]> {
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'TrendPulseBot/1.0', 'Accept': 'application/rss+xml,application/xml' },
      cache: 'no-store',
      // 6s per feed; we'd rather lose one slow feed than stall the whole pipeline.
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed: { rss?: { channel?: { item?: RssItem | RssItem[] } } } = parser.parse(xml);
    const rawItems = parsed.rss?.channel?.item;
    if (!rawItems) return [];
    const items = Array.isArray(rawItems) ? rawItems : [rawItems];
    // Keep only top N from each feed — news feeds dump 50+ items and most are stale.
    const TOP = 8;
    const recent = items
      .map(it => ({ it, age: hoursSince(it.pubDate) }))
      .filter(x => x.age < 24) // only stories from last 24h
      .sort((a, b) => a.age - b.age)
      .slice(0, TOP);

    return recent.map(({ it, age }) => {
      const title = textOf(it.title);
      // Recency boost: 0h → 1.0, 24h → 0.0
      const recency = Math.max(0, 1 - age / 24);
      return {
        title,
        context: textOf(it.description).slice(0, 280),
        source: 'news_rss' as const,
        sourceScore: recency * feed.weight,
        publishedAt: it.pubDate,
        url: textOf(it.link),
        meta: { feed: feed.label },
      };
    }).filter(r => r.title.length > 5);
  } catch (e) {
    // Any single feed failing must not break the pipeline.
    return [];
  }
}

export async function fetchNews(): Promise<RawTrend[]> {
  const results = await Promise.allSettled(FEEDS.map(fetchOne));
  const flat: RawTrend[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') flat.push(...r.value);
  }
  // Normalize sourceScore to [0,1] within news_rss.
  const max = Math.max(0.01, ...flat.map(f => f.sourceScore));
  for (const f of flat) f.sourceScore = f.sourceScore / max;
  return flat;
}
