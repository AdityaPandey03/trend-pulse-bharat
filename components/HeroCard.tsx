'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CategoryPill } from './CategoryPill';
import { HeatBar } from './HeatBar';
import type { RankedTrend } from '@/lib/types';

function formatApprox(n?: number): string {
  if (!n) return '';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return `${n}`;
}

/**
 * Hero card for rank #1.
 *
 * Why a hero: the #1 trend is almost always the story of the day.
 * Giving it hero treatment communicates hierarchy at a glance — the
 * user doesn't have to scan 10 identical cards to find the biggest story.
 * This is ShareChat's feed language too: one visual hero, then stack.
 */
export function HeroCard({ trend }: { trend: RankedTrend }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      {/* Floating glow orb for visual depth */}
      <div className="hero-orb absolute -top-8 -right-8 w-48 h-48 pointer-events-none" aria-hidden="true" />

      <Link href={`/trend/${trend.slug}`} className="block tap-press" aria-label={`Top trend: ${trend.hashtagEn}`}>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sc-primary via-[#B5123D] to-sc-surfaceHi p-5 border border-sc-primary/30 shadow-lg shadow-sc-primary/20">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 backdrop-blur text-[10px] font-semibold uppercase tracking-wider text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" aria-hidden="true" />
                #1 Trending
              </span>
              <CategoryPill category={trend.category} size="xs" />
            </div>
            <div className="text-white/80">
              <HeatBar heat={trend.heat} compact />
            </div>
          </div>

          {/* Main hashtag — huge */}
          <h2 className="font-hindi font-extrabold text-3xl leading-tight text-white mb-1 break-words">
            {trend.hashtagHi}
          </h2>
          <div className="text-sm text-white/70 mb-3">
            {trend.hashtagEn}
          </div>

          {/* Description */}
          <p className="font-hindi text-white/90 text-[15px] leading-snug line-clamp-3">
            {trend.descriptionHi}
          </p>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between">
            {trend.approxPosts ? (
              <div className="text-xs text-white/70">
                <span className="font-semibold text-white">{formatApprox(trend.approxPosts)}</span> posts
              </div>
            ) : <div />}
            <div className="inline-flex items-center gap-1 text-sm font-semibold text-white">
              देखें
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
