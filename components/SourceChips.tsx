'use client';

import type { SourceName } from '@/lib/types';

const SOURCE_META: Record<SourceName, { label: string; icon: string }> = {
  google_trends: { label: 'Google Trends', icon: '🔍' },
  news_rss:      { label: 'News',          icon: '📰' },
  reddit_india:  { label: 'Reddit r/india', icon: '💬' },
};

export function SourceChips({ sources, size = 'sm' }: { sources: SourceName[]; size?: 'xs' | 'sm' }) {
  const sizing = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5';
  return (
    <div className="flex flex-wrap gap-1">
      {sources.map(s => {
        const meta = SOURCE_META[s];
        return (
          <span
            key={s}
            className={`inline-flex items-center gap-1 rounded-md bg-sc-surfaceHi/60 text-sc-muted border border-sc-line ${sizing}`}
            title={meta.label}
          >
            <span aria-hidden="true">{meta.icon}</span>
            <span>{meta.label}</span>
          </span>
        );
      })}
    </div>
  );
}
