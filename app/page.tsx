'use client';

import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HeroCard } from '@/components/HeroCard';
import { TrendCard } from '@/components/TrendCard';
import { CategoryPill } from '@/components/CategoryPill';
import { UtsavCalendar } from '@/components/UtsavCalendar';
import { CATEGORY_META, type Category, type RankedTrend, type TrendsResponse } from '@/lib/types';

type FilterKey = 'all' | Category;

function formatRelative(iso: string): string {
  const diffMs = Date.now() - Date.parse(iso);
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function HomePage() {
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');

  const load = useCallback(async (opts?: { fresh?: boolean }) => {
    setError(null);
    try {
      const res = await fetch(`/api/trends${opts?.fresh ? '?fresh=1' : ''}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const json = (await res.json()) as TrendsResponse;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load({ fresh: true });
  };

  const filtered = data
    ? (filter === 'all' ? data.trends : data.trends.filter(t => t.category === filter))
    : [];

  // Build unique category list present in data for the filter bar
  const categoriesInData: Category[] = data
    ? Array.from(new Set(data.trends.map(t => t.category)))
    : [];

  return (
    <div className="pt-safe pb-safe min-h-screen relative">
      {/* Sticky top bar */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-sc-ink/80 border-b border-sc-line/50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sc-accent to-sc-primary flex items-center justify-center text-white font-bold text-sm shadow-md shadow-sc-primary/30">
                SC
              </div>
              <div>
                <div className="text-[11px] text-sc-muted leading-none">ShareChat</div>
                <div className="font-bold text-white text-sm leading-tight">Trends <span className="font-hindi text-sc-accent">ट्रेंड्स</span></div>
              </div>
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="tap-press inline-flex items-center gap-1.5 text-xs text-sc-muted hover:text-white disabled:opacity-50 px-2 py-1 rounded-full border border-sc-line"
            aria-label="Refresh trends"
          >
            <svg
              width="12" height="12" viewBox="0 0 16 16" fill="none"
              className={refreshing ? 'animate-spin' : ''}
              aria-hidden="true"
            >
              <path d="M2 8a6 6 0 0 1 10.24-4.24M14 8a6 6 0 0 1-10.24 4.24M12 2v4h-4M4 14v-4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {refreshing ? 'updating' : 'refresh'}
          </button>
        </div>

        {/* Meta row: generated at, source count */}
        {data && (
          <div className="px-4 pb-2 flex items-center justify-between text-[10px] text-sc-muted">
            <span>
              आज {new Date(data.generatedAt).toLocaleDateString('hi-IN', { day: 'numeric', month: 'long' })} · updated {formatRelative(data.generatedAt)}
            </span>
            <span className="tabular-nums">{data.count} trends</span>
          </div>
        )}

        {/* Category filter row — horizontal scroll */}
        {data && categoriesInData.length > 0 && (
          <div className="px-4 pb-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilter('all')}
              className={`tap-press flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
                filter === 'all'
                  ? 'bg-white text-sc-ink border-white font-semibold'
                  : 'bg-sc-surface/50 text-sc-muted border-sc-line'
              }`}
            >
              सब
            </button>
            {categoriesInData.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`tap-press flex-shrink-0 transition-transform ${filter === cat ? 'scale-105' : ''}`}
              >
                {/* Visual hack: we reuse CategoryPill but dim when unselected */}
                <span className={filter === cat ? '' : 'opacity-70'}>
                  <CategoryPill category={cat} size="xs" />
                </span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <div className="px-4 pt-4 pb-24">
        {loading && <LoadingSkeleton />}

        {error && !loading && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
            <div className="font-semibold text-red-300 mb-1">Couldn&apos;t load trends</div>
            <div className="text-red-200/70 text-xs mb-3">{error}</div>
            <button onClick={() => { setLoading(true); load(); }} className="tap-press text-xs bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-1.5 rounded-full">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {filter === 'all' && filtered.length > 0 && (
                <div className="mb-4">
                  <HeroCard trend={filtered[0]} />
                </div>
              )}

              {filter === 'all' && <UtsavCalendar />}

              <div className="space-y-2.5">
                {(filter === 'all' ? filtered.slice(1) : filtered).map((t, i) => (
                  <TrendCard key={t.id} trend={t} index={i} />
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-12 text-sc-muted text-sm">
                  <div className="font-hindi">इस श्रेणी में अभी कुछ ट्रेंड नहीं है</div>
                  <button onClick={() => setFilter('all')} className="mt-2 text-sc-accent text-xs underline">सब देखें</button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Footer note about how this works — transparency */}
        {!loading && !error && data && (
          <div className="mt-8 text-center text-[10px] text-sc-muted px-4 leading-relaxed">
            Trends curated live from Google Trends India, news feeds, and r/india.
            <br />
            Next refresh in ~{Math.max(1, Math.floor((Date.parse(data.nextRefreshAt) - Date.now()) / 60_000))} min.
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-44 rounded-3xl shimmer" />
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="h-24 rounded-2xl shimmer" />
      ))}
    </div>
  );
}
