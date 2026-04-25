import { XMLParser } from 'fast-xml-parser';
import type { RawTrend } from '../types';

/**
 * Google Trends Daily RSS for India.
 *
 * Why this source: it directly measures what Indians are searching for RIGHT NOW.
 * Unlike Twitter (urban English-skew) or Reddit (tech-skew), search behavior is
 * the broadest signal available for India — it reflects the same audience
 * ShareChat serves. Each item also includes an approximate traffic number and
 * related news articles, which we reuse downstream.
 *
 * Endpoint: https://trends.google.com/trending/rss?geo=IN
 * No auth required. Rate limits are generous for this feed.
 */

const GTRENDS_URL = 'https://trends.google.com/trending/rss?geo=IN';

interface GTrendsItem {
  title?: string;
  'ht:approx_traffic'?: string; // e.g. "200000+"
  'ht:news_item'?: unknown;      // can be single or array
  pubDate?: string;
  link?: string;
}

function parseTraffic(raw?: string): number {
  if (!raw) return 0;
  // Examples: "200000+", "50K+", "2M+"
  const clean = raw.replace(/[,+\s]/g, '').toUpperCase();
  const m = clean.match(/^([\d.]+)([KM]?)$/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  if (m[2] === 'M') return n * 1_000_000;
  if (m[2] === 'K') return n * 1_000;
  return n;
}

export async function fetchGoogleTrends(): Promise<RawTrend[]> {
  let xml: string;
  try {
    const res = await fetch(GTRENDS_URL, {
      headers: {
        'User-Agent': 'TrendPulseBot/1.0',
        'Accept': 'application/rss+xml,application/xml,text/xml',
      },
      // Ensure Next.js doesn't cache at build time — we need live data.
      cache: 'no-store',
    });
    if (!res.ok) {
      console.warn(`[google-trends] non-OK status ${res.status}`);
      return [];
    }
    xml = await res.text();
  } catch (e) {
    console.warn('[google-trends] fetch failed', e);
    return [];
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    // Keep namespace prefixes so we can read ht:approx_traffic, ht:news_item.
    removeNSPrefix: false,
  });

  let parsed: { rss?: { channel?: { item?: GTrendsItem | GTrendsItem[] } } };
  try {
    parsed = parser.parse(xml);
  } catch (e) {
    console.warn('[google-trends] parse failed', e);
    return [];
  }

  const rawItems = parsed.rss?.channel?.item;
  if (!rawItems) return [];
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  // Normalize traffic so we can do a relative sourceScore within this source.
  const traffics = items.map(i => parseTraffic(i['ht:approx_traffic']));
  const maxTraffic = Math.max(1, ...traffics);

  const out: RawTrend[] = items.map((it, i) => {
    const traffic = traffics[i];
    const newsItemsRaw = it['ht:news_item'];
    const newsItems = Array.isArray(newsItemsRaw) ? newsItemsRaw : newsItemsRaw ? [newsItemsRaw] : [];
    // The first news item headline gives us strong disambiguation context.
    const firstNews = newsItems[0] as { 'ht:news_item_title'?: string; 'ht:news_item_url'?: string } | undefined;
    return {
      title: (it.title ?? '').toString().trim(),
      context: firstNews?.['ht:news_item_title']?.toString().trim(),
      source: 'google_trends' as const,
      sourceScore: traffic / maxTraffic,
      traffic,
      publishedAt: it.pubDate,
      url: firstNews?.['ht:news_item_url']?.toString(),
      meta: { newsItemCount: newsItems.length },
    };
  }).filter(r => r.title.length > 0);

  return out;
}
