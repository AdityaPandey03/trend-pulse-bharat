import Anthropic from '@anthropic-ai/sdk';
import type { RawTrend, Category } from './types';

/**
 * LLM enrichment layer.
 *
 * Design decision: we do clustering + categorization + Hindi translation +
 * description generation in ONE batched Claude call, not four sequential ones.
 * Reasons:
 *   (1) cost — one batched call is ~10x cheaper than four sequential calls
 *   (2) latency — one round trip instead of four
 *   (3) the model reasons better when it sees all candidates together (it
 *       can spot that "Kohli 100" and "IND vs AUS" are the same event)
 *
 * We use Claude Haiku because this is a structured-extraction task, not a
 * reasoning one. Haiku handles it with >95% reliability at a fraction of the
 * cost, which is the right PM call when the endpoint is going to be hit
 * frequently.
 */

export interface EnrichedCluster {
  // Canonical (English-ish) title used for dedup / IDs
  canonicalTitle: string;
  // Hindi hashtag (primary surface)
  hashtagHi: string;
  // English/romanized hashtag (secondary)
  hashtagEn: string;
  // Short Hindi description (1 line)
  descriptionHi: string;
  descriptionEn: string;
  category: Category;
  // 0..1 — how relevant this is to an Indian audience
  indiaRelevance: number;
  // Indices into the input RawTrend array showing which candidates rolled into this cluster
  memberIndices: number[];
}

const SYSTEM_PROMPT = `You are the trending-topics engine for ShareChat, India's Hindi-first social platform.
Your audience is Hindi-speaking Bharat — not urban English Twitter. You prioritize cricket, Bollywood,
devotional content, festivals, regional news, and viral moments.

Your job: take a mixed list of raw candidate trends pulled from Google Trends India, Indian news RSS,
and Reddit r/india, and return a clean, deduplicated, categorized, Hindi-translated list.

Rules you MUST follow:
1. CLUSTER aggressively. "Kohli 100", "IND vs AUS 3rd ODI", "Virat Kohli century" are ONE trend. Merge them.
2. DROP items that are not relevant to a Hindi-speaking Indian audience. A niche foreign story (e.g. a US
   local politics story) should be dropped. A global story with real India impact (e.g. H1B policy change,
   Apple India manufacturing) is kept.
3. DROP pure spam, gore, NSFW, political hate, or communally charged stuff. If a topic is communal or
   inflammatory, drop it. ShareChat cannot surface that.
4. CATEGORIZE using EXACTLY one of:
   - cricket (Indian cricket only; other cricket goes to sports_other)
   - entertainment (Bollywood, TV, OTT, music, celebrities)
   - devotional (religious, spiritual, temple, festivals with religious core)
   - festival (Diwali, Holi, Rakhi, regional festivals, cultural days)
   - politics (Indian politics, policy, elections)
   - regional_news (city/state-level news, local incidents, weather events)
   - business (markets, RBI, companies, earnings)
   - tech (AI, apps, gadgets — only if genuinely trending in India)
   - sports_other (football, kabaddi, Olympics, non-cricket sports)
   - viral (memes, viral videos, social moments without a single news peg)
5. HINDI HASHTAG format: no spaces, Devanagari script REQUIRED. Example: "#भारतबनामऑस्ट्रेलिया".
   Latin script is permitted ONLY for movie/show/song titles and product brand names that are
   marketed in Latin script in India (e.g. "#StrangerThings5", "#Pushpa2", "#iPhone17", "#IPL2026").
   Person names (actors, politicians, athletes), place names, event names, scams, elections, and
   any common Hindi noun MUST be transliterated to Devanagari. Examples:
     Deepika Padukone   -> #दीपिकापादुकोण   (NOT #DeepikaPadukone)
     West Bengal elections -> #पश्चिमबंगालचुनाव (NOT #WestBengalElections)
     Rose Valley scam   -> #रोज़वैलीघोटाला  (NOT #RoseValleyScam)
   When in doubt, choose Devanagari. The Latin-script field already exists separately as hashtagEn.
6. DESCRIPTION: one short line, under 80 chars, telling a Hindi user why this is trending.
7. Return a JSON array. Nothing else. No markdown fences, no prose.

Output shape (strict):
[
  {
    "canonicalTitle": "string (short English label, <50 chars)",
    "hashtagHi": "#... (Hindi hashtag, no spaces)",
    "hashtagEn": "#... (English/romanized hashtag, no spaces)",
    "descriptionHi": "short Hindi description",
    "descriptionEn": "short English description",
    "category": "cricket|entertainment|devotional|festival|politics|regional_news|business|tech|sports_other|viral",
    "indiaRelevance": 0.0-1.0,
    "memberIndices": [0, 4, 9]
  }
]

Return 12 to 20 clusters. Prefer fewer, higher-quality clusters over many weak ones.`;

/**
 * Builds the compact user message — we strip every RawTrend down to the
 * fields the model actually needs, to save tokens.
 */
function buildUserMessage(candidates: RawTrend[]): string {
  const lines = candidates.map((c, i) => {
    const parts = [
      `[${i}] src=${c.source}`,
      `title="${c.title.slice(0, 140)}"`,
    ];
    if (c.context) parts.push(`ctx="${c.context.slice(0, 160)}"`);
    if (c.traffic) parts.push(`traffic=${Math.round(c.traffic)}`);
    return parts.join(' | ');
  });
  return `Here are ${candidates.length} raw candidate trends. Cluster + enrich per the rules.\n\n${lines.join('\n')}`;
}

/**
 * Extracts JSON from Claude's response, defensively — even though we
 * asked for pure JSON, it's cheap insurance.
 */
function extractJson(text: string): unknown {
  const trimmed = text.trim();
  // Try direct parse first.
  try { return JSON.parse(trimmed); } catch {}
  // Strip markdown fences if present.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    try { return JSON.parse(fenced[1]); } catch {}
  }
  // Find the first [ ... last ] block.
  const start = trimmed.indexOf('[');
  const end = trimmed.lastIndexOf(']');
  if (start !== -1 && end > start) {
    try { return JSON.parse(trimmed.slice(start, end + 1)); } catch {}
  }
  throw new Error('Could not extract JSON array from model output');
}

const ALLOWED_CATEGORIES: Category[] = [
  'cricket', 'entertainment', 'devotional', 'festival', 'politics',
  'regional_news', 'business', 'tech', 'sports_other', 'viral',
];

function validateCluster(obj: unknown, inputLen: number): EnrichedCluster | null {
  if (!obj || typeof obj !== 'object') return null;
  const o = obj as Record<string, unknown>;
  const canonicalTitle = typeof o.canonicalTitle === 'string' ? o.canonicalTitle.trim() : '';
  const hashtagHi     = typeof o.hashtagHi     === 'string' ? o.hashtagHi.trim()     : '';
  const hashtagEn     = typeof o.hashtagEn     === 'string' ? o.hashtagEn.trim()     : '';
  const descriptionHi = typeof o.descriptionHi === 'string' ? o.descriptionHi.trim() : '';
  const descriptionEn = typeof o.descriptionEn === 'string' ? o.descriptionEn.trim() : '';
  const category      = typeof o.category      === 'string' ? o.category             : '';
  const indiaRel      = typeof o.indiaRelevance === 'number' ? o.indiaRelevance      : 0.5;
  const memberIndices = Array.isArray(o.memberIndices) ? o.memberIndices.filter(
    (n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < inputLen
  ) : [];

  if (!canonicalTitle || !hashtagHi || !hashtagEn || !descriptionHi || !descriptionEn) return null;
  if (!ALLOWED_CATEGORIES.includes(category as Category)) return null;
  if (memberIndices.length === 0) return null;

  return {
    canonicalTitle,
    hashtagHi: hashtagHi.startsWith('#') ? hashtagHi : `#${hashtagHi}`,
    hashtagEn: hashtagEn.startsWith('#') ? hashtagEn : `#${hashtagEn}`,
    descriptionHi,
    descriptionEn,
    category: category as Category,
    indiaRelevance: Math.max(0, Math.min(1, indiaRel)),
    memberIndices,
  };
}

export async function enrichWithClaude(candidates: RawTrend[]): Promise<EnrichedCluster[]> {
  if (candidates.length === 0) return [];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set. Add it to your environment.');
  }

  const client = new Anthropic({ apiKey });

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserMessage(candidates) }],
  });

  // Join all text blocks defensively (Haiku usually returns one).
  const text = msg.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('\n');

  const parsed = extractJson(text);
  if (!Array.isArray(parsed)) throw new Error('LLM did not return an array');

  const clusters: EnrichedCluster[] = [];
  for (const item of parsed) {
    const v = validateCluster(item, candidates.length);
    if (v) clusters.push(v);
  }
  return clusters;
}
