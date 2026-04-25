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

export function TrendCard({ trend, index }: { trend: RankedTrend; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/trend/${trend.slug}`}
        className="group block tap-press"
        aria-label={`Trend ${trend.rank}: ${trend.hashtagEn}`}
      >
        <div className="relative rounded-2xl bg-sc-surface/80 backdrop-blur border border-sc-line p-4 hover:border-sc-primary/40 transition-colors">
          <div className="flex items-start gap-3">
            {/* Rank number — big, prominent */}
            <div className="flex-shrink-0 w-10 text-center">
              <div className="text-2xl font-bold tabular-nums bg-gradient-to-br from-sc-accent to-sc-primary bg-clip-text text-transparent leading-none">
                {trend.rank}
              </div>
              <div className="text-[9px] text-sc-muted mt-0.5 tracking-wider uppercase">Rank</div>
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <CategoryPill category={trend.category} size="xs" />
                {trend.approxPosts ? (
                  <span className="text-[10px] text-sc-muted">
                    {formatApprox(trend.approxPosts)} posts
                  </span>
                ) : null}
              </div>

              <h3 className="font-hindi font-bold text-lg leading-tight text-white group-hover:text-sc-accent transition-colors truncate">
                {trend.hashtagHi}
              </h3>
              <div className="text-[11px] text-sc-muted mt-0.5 truncate">
                {trend.hashtagEn}
              </div>

              <p className="font-hindi text-sm text-sc-muted mt-2 line-clamp-2 leading-snug">
                {trend.descriptionHi}
              </p>

              <div className="mt-3">
                <HeatBar heat={trend.heat} />
              </div>
            </div>

            {/* Chevron */}
            <div className="flex-shrink-0 self-center text-sc-muted group-hover:text-sc-accent group-hover:translate-x-0.5 transition-all">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
