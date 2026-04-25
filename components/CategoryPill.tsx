'use client';

import { CATEGORY_META, type Category } from '@/lib/types';

const CATEGORY_COLORS: Record<Category, { bg: string; text: string; border: string }> = {
  cricket:       { bg: 'bg-emerald-500/15',  text: 'text-emerald-300',  border: 'border-emerald-500/30' },
  entertainment: { bg: 'bg-fuchsia-500/15',  text: 'text-fuchsia-300',  border: 'border-fuchsia-500/30' },
  devotional:    { bg: 'bg-amber-500/15',    text: 'text-amber-200',    border: 'border-amber-500/30' },
  festival:      { bg: 'bg-orange-500/15',   text: 'text-orange-300',   border: 'border-orange-500/30' },
  politics:      { bg: 'bg-sky-500/15',      text: 'text-sky-300',      border: 'border-sky-500/30' },
  regional_news: { bg: 'bg-teal-500/15',     text: 'text-teal-300',     border: 'border-teal-500/30' },
  business:      { bg: 'bg-lime-500/15',     text: 'text-lime-300',     border: 'border-lime-500/30' },
  tech:          { bg: 'bg-indigo-500/15',   text: 'text-indigo-300',   border: 'border-indigo-500/30' },
  sports_other:  { bg: 'bg-cyan-500/15',     text: 'text-cyan-300',     border: 'border-cyan-500/30' },
  viral:         { bg: 'bg-rose-500/15',     text: 'text-rose-300',     border: 'border-rose-500/30' },
};

export function CategoryPill({
  category,
  size = 'sm',
  hindi = true,
}: {
  category: Category;
  size?: 'xs' | 'sm' | 'md';
  hindi?: boolean;
}) {
  const meta = CATEGORY_META[category];
  const colors = CATEGORY_COLORS[category];
  const sizing =
    size === 'xs' ? 'text-[10px] px-1.5 py-0.5' :
    size === 'md' ? 'text-xs px-2.5 py-1' :
                    'text-[11px] px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${colors.bg} ${colors.text} ${colors.border} ${sizing}`}
    >
      <span aria-hidden="true">{meta.emoji}</span>
      <span className={hindi ? 'font-hindi' : ''}>
        {hindi ? meta.labelHi : meta.label}
      </span>
    </span>
  );
}
