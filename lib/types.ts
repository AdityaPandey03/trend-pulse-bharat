// Central types for the trending pipeline.
// Kept in one file so the contract between stages is obvious to anyone reading the code.

export type SourceName =
  | 'google_trends'
  | 'news_rss'
  | 'reddit_india';

/**
 * A raw candidate trend collected from a single source, before any
 * enrichment (categorization, Hindi translation, scoring, dedup).
 */
export interface RawTrend {
  // What the source calls this trend. In source's native language/form.
  title: string;
  // Free-form context: news headline, post title, article snippet.
  context?: string;
  // Source that produced this candidate.
  source: SourceName;
  // Relative strength within this source (0..1). Normalized so sources are comparable.
  sourceScore: number;
  // Optional traffic estimate (Google Trends gives us an absolute number).
  traffic?: number;
  // Pub/update time if available. Used for recency decay.
  publishedAt?: string; // ISO string
  // Optional URL back to the source (for "source" link in UI).
  url?: string;
  // Raw metadata the source wants to preserve (related news items, etc.)
  meta?: Record<string, unknown>;
}

/**
 * After clustering, a group of RawTrend items that refer to the same underlying topic.
 * E.g. "Kohli century", "IND vs AUS", "Virat Kohli" may all collapse into one cluster.
 */
export interface TrendCluster {
  id: string;
  // The representative title (longest/cleanest variant).
  canonicalTitle: string;
  // All raw candidates that rolled into this cluster.
  members: RawTrend[];
  // Unique sources this cluster appeared in (used to boost cross-source trends).
  sources: SourceName[];
}

/**
 * Output categories — these are deliberately chosen to map onto ShareChat's
 * actual content pillars, not generic news taxonomy.
 */
export type Category =
  | 'cricket'
  | 'entertainment'
  | 'devotional'
  | 'festival'
  | 'politics'
  | 'regional_news'
  | 'business'
  | 'tech'
  | 'sports_other'
  | 'viral';

export interface CategoryMeta {
  label: string;       // English label shown in UI
  labelHi: string;     // Hindi label
  emoji: string;
  // Prior weight used in scoring — some categories over-index on ShareChat.
  prior: number;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  cricket:       { label: 'Cricket',        labelHi: 'क्रिकेट',     emoji: '🏏', prior: 1.15 },
  entertainment: { label: 'Entertainment',  labelHi: 'मनोरंजन',    emoji: '🎬', prior: 1.10 },
  devotional:    { label: 'Devotional',     labelHi: 'भक्ति',       emoji: '🕉️', prior: 1.10 },
  festival:      { label: 'Festival',       labelHi: 'त्यौहार',     emoji: '🪔', prior: 1.15 },
  politics:      { label: 'Politics',       labelHi: 'राजनीति',    emoji: '🏛️', prior: 1.00 },
  regional_news: { label: 'Regional News',  labelHi: 'स्थानीय',     emoji: '📍', prior: 1.05 },
  business:      { label: 'Business',       labelHi: 'बिज़नेस',     emoji: '💼', prior: 0.90 },
  tech:          { label: 'Tech',           labelHi: 'टेक',        emoji: '⚡', prior: 0.85 },
  sports_other:  { label: 'Sports',         labelHi: 'खेल',        emoji: '🏆', prior: 0.95 },
  viral:         { label: 'Viral',          labelHi: 'वायरल',      emoji: '🔥', prior: 1.20 },
};

/**
 * A real news article that rolled into a trend cluster. Surfaced on the
 * detail page as "related coverage" — turns the trend back into the
 * underlying reporting.
 */
export interface RelatedArticle {
  title: string;
  url: string;
  publisher: string; // e.g. "NDTV", "The Hindu"
}

/**
 * The final, enriched, ranked output. Exactly what the UI consumes.
 */
export interface RankedTrend {
  id: string;
  // Hindi hashtag — primary surface in UI, e.g. "#भारतबनामऑस्ट्रेलिया"
  hashtagHi: string;
  // English/romanized hashtag — shown smaller as secondary, e.g. "#IndiaVsAustralia"
  hashtagEn: string;
  // Short human-readable description (1 line, Hindi).
  descriptionHi: string;
  // English equivalent for accessibility / debugging.
  descriptionEn: string;
  category: Category;
  // 0..100 heat score, used to drive UI intensity.
  heat: number;
  // Which sources contributed. Shown as small chips in detail view — transparency.
  sources: SourceName[];
  // Approximate post count / views — for realism in the UI (based on traffic if present).
  approxPosts?: number;
  // URL to the most relevant underlying news story, for the "read more" action.
  primaryUrl?: string;
  // Up to 3 news articles that rolled into this cluster — shown as "related coverage".
  relatedArticles?: RelatedArticle[];
  // Kept for debug / write-up — the score components breakdown.
  scoreBreakdown?: Record<string, number>;
  // URL-safe slug used in /trend/[slug] route.
  slug: string;
  // Rank position (1-indexed).
  rank: number;
}

export interface TrendsResponse {
  generatedAt: string;
  count: number;
  cacheHit: boolean;
  nextRefreshAt: string;
  trends: RankedTrend[];
}
