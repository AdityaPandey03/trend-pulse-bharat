import { NextResponse } from 'next/server';
import { runPipeline } from '@/lib/pipeline';

/**
 * GET /api/cron/warm
 *
 * Intended for Vercel Cron. Hits the pipeline to keep the 10-min cache fresh
 * so no real user ever pays the cold-start cost.
 *
 * Protected by CRON_SECRET env var: Vercel Cron automatically sends
 * `Authorization: Bearer <CRON_SECRET>` if CRON_SECRET is set in project env.
 * If CRON_SECRET isn't set (e.g. for local testing), the endpoint is open —
 * safe because runPipeline is idempotent and cached.
 *
 * To enable on Vercel:
 *   1. Add CRON_SECRET to project env (any long random string)
 *   2. Vercel Dashboard → Settings → Cron → add a schedule pointing at /api/cron/warm
 *   3. Suggested schedule: every 8 minutes → "0,8,16,24,32,40,48,56 * * * *"
 *
 * Or add to vercel.json:
 *   {
 *     "crons": [{ "path": "/api/cron/warm", "schedule": "0,8,16,24,32,40,48,56 * * * *" }]
 *   }
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: Request) {
  // Auth check — skip when CRON_SECRET isn't configured (local dev)
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const started = Date.now();
  try {
    const data = await runPipeline();
    return NextResponse.json({
      ok: true,
      cacheHit: data.cacheHit,
      trendCount: data.trends.length,
      elapsedMs: Date.now() - started,
      nextRefreshAt: data.nextRefreshAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    console.error('[cron/warm] failed:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
