'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CategoryPill } from '@/components/CategoryPill';
import { HeatBar } from '@/components/HeatBar';
import { SourceChips } from '@/components/SourceChips';
import { CATEGORY_META, type RankedTrend, type TrendsResponse } from '@/lib/types';

interface DetailPayload {
  slug: string;
  summaryHi: string[];
  creatorHashtags: string[];
  callToAction: string;
}

function formatApprox(n?: number): string {
  if (!n) return '';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return `${n}`;
}

export default function TrendDetailPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const [trend, setTrend] = useState<RankedTrend | null>(null);
  const [detail, setDetail] = useState<DetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load the trend itself from the list endpoint
  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await fetch('/api/trends', { cache: 'no-store' });
        const json = (await res.json()) as TrendsResponse;
        const found = json.trends.find(t => t.slug === slug);
        if (!found) {
          setError('Trend not found. It may have fallen off the list.');
        } else {
          setTrend(found);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'unknown error');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // Once we have the trend, load the AI detail
  useEffect(() => {
    if (!trend) return;
    (async () => {
      try {
        const res = await fetch(`/api/trend-detail?slug=${encodeURIComponent(trend.slug)}`, { cache: 'no-store' });
        if (res.ok) {
          const json = (await res.json()) as DetailPayload;
          setDetail(json);
        }
      } finally {
        setDetailLoading(false);
      }
    })();
  }, [trend]);

  if (loading) {
    return (
      <div className="pt-safe pb-safe min-h-screen px-4 pt-4 space-y-3">
        <div className="h-8 w-24 rounded shimmer" />
        <div className="h-52 rounded-3xl shimmer" />
        <div className="h-40 rounded-2xl shimmer" />
      </div>
    );
  }

  if (error || !trend) {
    return (
      <div className="pt-safe pb-safe min-h-screen px-4 pt-4">
        <button onClick={() => router.push('/')} className="tap-press text-sm text-sc-muted mb-4 inline-flex items-center gap-1">
          ← वापस
        </button>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="text-red-300 font-semibold text-sm mb-1">Trend unavailable</div>
          <div className="text-red-200/70 text-xs">{error ?? 'Unknown error'}</div>
        </div>
      </div>
    );
  }

  const catMeta = CATEGORY_META[trend.category];

  return (
    <div className="pt-safe pb-safe min-h-screen">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-sc-ink/80 border-b border-sc-line/50">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="tap-press w-9 h-9 rounded-full bg-sc-surface/80 border border-sc-line flex items-center justify-center text-white"
            aria-label="Back"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3l-5 5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-sc-muted leading-none">Trend #{trend.rank}</div>
            <div className="text-sm text-white font-semibold truncate">{trend.hashtagEn}</div>
          </div>
          <button
            onClick={() => {
              if (typeof navigator !== 'undefined' && 'share' in navigator) {
                navigator.share({
                  title: trend.hashtagEn,
                  text: trend.descriptionEn,
                  url: typeof window !== 'undefined' ? window.location.href : '',
                }).catch(() => {});
              }
            }}
            className="tap-press w-9 h-9 rounded-full bg-sc-surface/80 border border-sc-line flex items-center justify-center text-white"
            aria-label="Share"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M12 5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2M7 8l4-4m0 0h-3m3 0v3M7 13h6a1 1 0 0 0 1-1V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      <div className="px-4 pt-4 pb-24 space-y-4">
        {/* Hero block — full width, category-colored gradient */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sc-primary via-[#B5123D] to-sc-surfaceHi p-5 border border-sc-primary/30"
        >
          <div className="hero-orb absolute -top-10 -right-10 w-60 h-60 pointer-events-none" aria-hidden="true" />

          <div className="flex items-center gap-2 mb-3">
            <CategoryPill category={trend.category} size="sm" />
            <span className="text-[10px] text-white/70 font-semibold tracking-wider uppercase">
              #{trend.rank} · अभी ट्रेंडिंग
            </span>
          </div>

          <h1 className="font-hindi font-extrabold text-4xl leading-tight text-white mb-1 break-words">
            {trend.hashtagHi}
          </h1>
          <div className="text-sm text-white/70 mb-4">{trend.hashtagEn}</div>

          <p className="font-hindi text-white/90 text-base leading-snug">
            {trend.descriptionHi}
          </p>

          {/* Stats row */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] text-white/60 uppercase tracking-wider">Heat</div>
              <div className="text-lg font-bold text-white tabular-nums">{trend.heat}</div>
            </div>
            <div>
              <div className="text-[10px] text-white/60 uppercase tracking-wider">Posts</div>
              <div className="text-lg font-bold text-white tabular-nums">{formatApprox(trend.approxPosts)}</div>
            </div>
            <div>
              <div className="text-[10px] text-white/60 uppercase tracking-wider">Sources</div>
              <div className="text-lg font-bold text-white tabular-nums">{trend.sources.length}</div>
            </div>
          </div>

          <div className="mt-3">
            <HeatBar heat={trend.heat} />
          </div>
        </motion.div>

        {/* AI Briefing — the bonus */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl bg-sc-surface border border-sc-line p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-sc-accent to-sc-primary flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 1l1.5 4L14 6l-4.5 1L8 11l-1.5-4L2 6l4.5-1L8 1z" fill="white" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-sc-muted uppercase tracking-wider font-semibold">AI Briefing</div>
              <div className="font-hindi text-sm font-semibold text-white">इस ट्रेंड के बारे में</div>
            </div>
          </div>

          {detailLoading ? (
            <div className="space-y-2">
              <div className="h-4 rounded shimmer" />
              <div className="h-4 w-11/12 rounded shimmer" />
              <div className="h-4 w-4/5 rounded shimmer" />
            </div>
          ) : detail ? (
            <>
              <ul className="space-y-2">
                {detail.summaryHi.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 font-hindi text-[14px] text-white/90 leading-snug">
                    <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-sc-accent" />
                    {point}
                  </li>
                ))}
              </ul>

              {detail.creatorHashtags.length > 0 && (
                <div className="mt-4 pt-4 border-t border-sc-line">
                  <div className="text-[10px] text-sc-muted uppercase tracking-wider font-semibold mb-2">
                    Creator hashtags
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.creatorHashtags.map((h, i) => (
                      <span key={i} className="font-hindi text-[11px] px-2 py-1 rounded-md bg-sc-surfaceHi text-sc-accent border border-sc-line">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {detail.callToAction && (
                <div className="mt-4 rounded-xl bg-gradient-to-r from-sc-primary/20 to-sc-accent/10 border border-sc-primary/30 p-3">
                  <div className="font-hindi text-sm text-white leading-snug">
                    {detail.callToAction}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-xs text-sc-muted font-hindi">जानकारी लोड नहीं हो पाई</div>
          )}
        </motion.section>

        {/* Sources — transparency block */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded-2xl bg-sc-surface border border-sc-line p-4"
        >
          <div className="text-[10px] text-sc-muted uppercase tracking-wider font-semibold mb-2">
            Signal Sources
          </div>
          <div className="text-xs text-sc-muted mb-3 font-hindi">
            यह ट्रेंड इन जगहों से पकड़ा गया:
          </div>
          <SourceChips sources={trend.sources} />

          {trend.primaryUrl && (
            <a
              href={trend.primaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-press mt-4 block text-center text-sm font-semibold bg-sc-surfaceHi hover:bg-sc-line text-white py-2.5 rounded-xl border border-sc-line"
            >
              मूल खबर पढ़ें →
            </a>
          )}
        </motion.section>

        {/* Mock related content — signals "this is where feed content would go" */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="font-hindi text-sm font-semibold text-white">इस ट्रेंड पर पोस्ट्स</div>
            <div className="text-[10px] text-sc-muted">coming soon</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="aspect-[3/4] rounded-lg bg-gradient-to-br from-sc-surface to-sc-surfaceHi border border-sc-line flex items-center justify-center"
              >
                <span className="text-2xl opacity-30" aria-hidden="true">{catMeta.emoji}</span>
              </div>
            ))}
          </div>
          <div className="text-center text-[10px] text-sc-muted mt-3 font-hindi leading-relaxed">
            असली ShareChat में यहाँ इस टैग से जुड़े वीडियो और पोस्ट्स दिखेंगे
          </div>
        </motion.section>

        {/* Back link */}
        <Link
          href="/"
          className="tap-press block text-center text-sm text-sc-muted hover:text-white py-3"
        >
          ← सभी ट्रेंड्स देखें
        </Link>
      </div>
    </div>
  );
}
