import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

/**
 * POST /api/trend-detail
 * Body: { slug, hashtagHi, hashtagEn, descriptionHi, descriptionEn, category }
 *
 * The "bonus" deliverable: when a user opens a trend, we generate a richer
 * detail card on the fly — a short Hindi summary (3 bullets) + suggested
 * creator hashtags + a CTA.
 *
 * Why we don't re-run the pipeline here:
 * Vercel's serverless instances each have their own in-memory cache, AND
 * Claude clustering is non-deterministic, so the slug from one /api/trends
 * call isn't guaranteed to exist in another instance's pipeline run. We
 * decoupled this endpoint by passing the trend metadata in the request body.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

interface DetailRequest {
  slug?: string;
  hashtagHi?: string;
  hashtagEn?: string;
  descriptionHi?: string;
  descriptionEn?: string;
  category?: string;
}

interface DetailResponse {
  slug: string;
  summaryHi: string[];
  creatorHashtags: string[];
  callToAction: string;
}

export async function POST(request: Request) {
  let body: DetailRequest;
  try {
    body = (await request.json()) as DetailRequest;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { slug, hashtagHi, hashtagEn, descriptionHi, descriptionEn, category } = body;
  if (!slug || !hashtagHi || !descriptionEn) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(makeFallback(slug, hashtagHi, descriptionHi ?? descriptionEn));
    }

    const client = new Anthropic({ apiKey });
    const systemPrompt = `You write short, punchy Hindi copy for ShareChat — India's Hindi-first social app.
Your job: given a trending topic, produce a tiny briefing that helps a Hindi-speaking creator understand
the trend and post about it.

Output ONLY valid JSON in this exact shape, no prose, no markdown fences:
{
  "summaryHi": ["point 1 in Hindi, max 90 chars", "point 2 in Hindi, max 90 chars", "point 3 in Hindi, max 90 chars"],
  "creatorHashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "callToAction": "one short Hindi line prompting the creator to post"
}

Rules:
- All Hindi text in Devanagari. No English inside Hindi text.
- Keep it factual and neutral. No communal/political inflammation.
- creatorHashtags: mix of Hindi (Devanagari) and Latin script as appropriate.
- Do NOT make up specific statistics or quotes.`;

    const userPrompt = `Trending topic:
- Hashtag: ${hashtagHi} (${hashtagEn ?? ''})
- Category: ${category ?? 'general'}
- What we know: ${descriptionEn}

Produce the briefing.`;

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = msg.content
      .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim();

    let parsed: Partial<DetailResponse> & { summaryHi?: unknown; creatorHashtags?: unknown; callToAction?: unknown };
    try {
      parsed = JSON.parse(text);
    } catch {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      parsed = JSON.parse(text.slice(start, end + 1));
    }

    const summaryHi = Array.isArray(parsed.summaryHi)
      ? (parsed.summaryHi as unknown[]).filter((x): x is string => typeof x === 'string').slice(0, 3)
      : [];
    const creatorHashtags = Array.isArray(parsed.creatorHashtags)
      ? (parsed.creatorHashtags as unknown[]).filter((x): x is string => typeof x === 'string').slice(0, 6)
      : [];
    const callToAction = typeof parsed.callToAction === 'string' ? parsed.callToAction : '';

    if (summaryHi.length === 0) {
      return NextResponse.json(makeFallback(slug, hashtagHi, descriptionHi ?? descriptionEn));
    }

    const result: DetailResponse = { slug, summaryHi, creatorHashtags, callToAction };
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    console.error('[trend-detail] failed:', message);
    return NextResponse.json(makeFallback(slug, hashtagHi, descriptionHi ?? descriptionEn));
  }
}

function makeFallback(slug: string, hashtagHi: string, descHi: string): DetailResponse {
  return {
    slug,
    summaryHi: [
      descHi,
      'यह ट्रेंड आज सोशल मीडिया पर तेज़ी से फैल रहा है।',
      'कई यूज़र्स इस पर अपनी राय शेयर कर रहे हैं।',
    ],
    creatorHashtags: [hashtagHi, '#ShareChat', '#Trending', '#भारत', '#वायरल'],
    callToAction: 'आप क्या सोचते हैं? अपनी राय ShareChat पर शेयर करें।',
  };
}
