import { NextResponse } from 'next/server';
import { runPipeline } from '@/lib/pipeline';
import { FALLBACK_TRENDS } from '@/lib/fallback';

/**
 * GET /api/trends
 *
 * Runs the live pipeline. Returns the full TrendsResponse.
 * The cache (10 min by default) lives inside runPipeline().
 *
 * Query params:
 *   ?debug=1  — include scoreBreakdown for each trend (useful for the write-up screenshot)
 *   ?fresh=1  — bypass cache (for live demos)
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Vercel hobby has a 10s default; we bump to 60s for the first (cold) fetch.
export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const debug = searchParams.get('debug') === '1';

  try {
    const data = await runPipeline();

    // Strip scoreBreakdown unless debug, to keep the API response small.
    const cleaned = debug
      ? data
      : {
          ...data,
          trends: data.trends.map(({ scoreBreakdown, ...rest }) => rest),
        };

    return NextResponse.json(cleaned, {
      headers: {
        // Allow client-side revalidation every 60s while serving from cache.
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    console.error('[api/trends] pipeline failed:', message);

    // If the pipeline errored because the API key isn't set, serve fallback
    // so reviewers can still see the UI.
    if (/ANTHROPIC_API_KEY/.test(message)) {
      return NextResponse.json(
        { ...FALLBACK_TRENDS, _fallback: true, _reason: 'ANTHROPIC_API_KEY not set; showing illustrative fallback.' },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { error: 'pipeline_failed', message },
      { status: 500 },
    );
  }
}
