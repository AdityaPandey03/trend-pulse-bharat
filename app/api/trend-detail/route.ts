import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { runPipeline } from '@/lib/pipeline';

/**
 * GET /api/trend-detail?slug=...
 *
 * The "bonus" deliverable: when a user opens a trend, we generate
 * a richer detail card on the fly — a short Hindi summary of what
 * this trend is about (3 bullet points) + a suggested hashtag set
 * for creators.
 *
 * Why on-the-fly: the feed response stays lightweight. Detail view
 * only pays the token cost when a user actually taps in. Good PM
 * instinct — don't bloat the hot path for content 90% of users
 * never see.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

interface DetailResponse {
  slug: string;
  summaryHi: string[];   // 3 bullet points
  creatorHashtags: string[];
  callToAction: string;  // short Hindi CTA for creators
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  if (!slug) {
    return NextResponse.json({ error: 'slug required' }, { status: 400 });
  }

  try {
    const data = await runPipeline();
    const trend = data.trends.find(t => t.slug === slug);
    if (!trend) {
      return NextResponse.json({ error: 'trend not found' }, { status: 404 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Graceful fallback: hand-crafted content so UI still shows something
      return NextResponse.json(makeFallback(trend.hashtagHi, trend.descriptionHi));
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
- Hashtag: ${trend.hashtagHi} (${trend.hashtagEn})
- Category: ${trend.category}
- What we know: ${trend.descriptionEn}

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

    // Extract JSON defensively
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
      return NextResponse.json(makeFallback(trend.hashtagHi, trend.descriptionHi));
    }

    const result: DetailResponse = { slug, summaryHi, creatorHashtags, callToAction };
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    console.error('[trend-detail] failed:', message);
    return NextResponse.json({ error: 'detail_failed', message }, { status: 500 });
  }
}

function makeFallback(hashtagHi: string, descHi: string): DetailResponse {
  return {
    slug: '',
    summaryHi: [
      descHi,
      'यह ट्रेंड आज सोशल मीडिया पर तेज़ी से फैल रहा है।',
      'कई यूज़र्स इस पर अपनी राय शेयर कर रहे हैं।',
    ],
    creatorHashtags: [hashtagHi, '#ShareChat', '#Trending', '#भारत', '#वायरल'],
    callToAction: 'आप क्या सोचते हैं? अपनी राय ShareChat पर शेयर करें।',
  };
}
