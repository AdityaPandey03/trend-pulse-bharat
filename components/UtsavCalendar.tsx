'use client';

import { motion } from 'framer-motion';
import {
  getUpcomingFestivals,
  daysUntil,
  relativeLabelHi,
  type Festival,
} from '@/lib/festivals';

const MONTH_HI = [
  'जन', 'फ़र', 'मार्च', 'अप्रै', 'मई', 'जून',
  'जुला', 'अग', 'सित', 'अक्तू', 'नव', 'दिस',
];

function formatDateChip(dateStr: string): { day: string; month: string } {
  const [, m, d] = dateStr.split('-').map(Number);
  return {
    day: String(d ?? 1).padStart(2, '0'),
    month: MONTH_HI[(m ?? 1) - 1] ?? '',
  };
}

/**
 * Utsav Calendar — horizontal-scroll widget surfacing the next ~45 days of
 * Hindu panchang observances and festivals.
 *
 * Why this lives below the hero: the #1 trend tells the user what is hot
 * *right now*, but a ShareChat user often opens the app with intent tied
 * to a vrat or upcoming festival ("kal Ekadashi hai kya?"). Putting the
 * calendar one swipe below the hero answers that intent without a new
 * tab or search.
 */
export function UtsavCalendar({ now = new Date() }: { now?: Date }) {
  const items = getUpcomingFestivals(now, 45);
  if (items.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      className="mb-5"
      aria-label="Upcoming Hindu festivals and observances"
    >
      {/* Section header */}
      <div className="flex items-end justify-between mb-2.5 px-0.5">
        <div>
          <h3 className="font-hindi font-bold text-white text-[15px] leading-tight">
            उत्सव कैलेंडर
            <span className="ml-2 text-[11px] font-sans font-medium text-sc-muted tracking-wide uppercase">
              Utsav
            </span>
          </h3>
          <div className="text-[10px] text-sc-muted mt-0.5">
            अगले 45 दिन · {items.length} पर्व
          </div>
        </div>
        <span className="text-[10px] text-sc-muted/70 font-medium">
          🪔
        </span>
      </div>

      {/* Horizontal scroller */}
      <div className="-mx-4 px-4 flex items-stretch gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1">
        {items.map((f, i) => (
          <FestivalCard key={f.id} festival={f} index={i} now={now} />
        ))}
        {/* Trailing spacer so last card isn't flush to edge */}
        <div className="flex-shrink-0 w-1" aria-hidden="true" />
      </div>
    </motion.section>
  );
}

function FestivalCard({
  festival,
  index,
  now,
}: {
  festival: Festival;
  index: number;
  now: Date;
}) {
  const days = daysUntil(festival.date, now);
  const isToday = days === 0;
  const isMajor = festival.tier === 'major';
  const chip = formatDateChip(festival.date);

  // Today: saffron glow + accent gradient.
  // Major (future): subtle warm gradient.
  // Observance: plain surface.
  const surfaceClasses = isToday
    ? 'bg-gradient-to-br from-sc-accent/25 via-sc-primary/15 to-sc-surfaceHi border-sc-accent/60 shadow-lg shadow-sc-accent/20'
    : isMajor
      ? 'bg-gradient-to-br from-sc-surfaceHi to-sc-surface border-sc-line hover:border-sc-accent/30'
      : 'bg-sc-surface/60 border-sc-line/60 hover:border-sc-line';

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.05 + index * 0.03 }}
      className={`flex-shrink-0 snap-start w-[180px] rounded-2xl border p-3 relative overflow-hidden ${surfaceClasses}`}
    >
      {/* Top row: date chip + relative pill */}
      <div className="flex items-start justify-between mb-2">
        <div
          className={`flex flex-col items-center justify-center rounded-lg px-2 py-1 leading-none ${
            isToday
              ? 'bg-sc-accent text-sc-ink'
              : 'bg-sc-ink/60 text-white border border-sc-line/60'
          }`}
        >
          <span className="font-bold text-base tabular-nums">{chip.day}</span>
          <span
            className={`font-hindi text-[9px] mt-0.5 ${
              isToday ? 'text-sc-ink/70' : 'text-sc-muted'
            }`}
          >
            {chip.month}
          </span>
        </div>
        <span
          className={`font-hindi text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${
            isToday
              ? 'bg-white text-sc-primary font-bold'
              : days <= 3
                ? 'bg-sc-primary/15 text-sc-primary border border-sc-primary/30'
                : 'bg-sc-ink/40 text-sc-muted border border-sc-line/60'
          }`}
        >
          {relativeLabelHi(festival.date, now)}
        </span>
      </div>

      {/* Emoji */}
      <div className="text-2xl mb-1.5 leading-none" aria-hidden="true">
        {festival.emoji}
      </div>

      {/* Names */}
      <div
        className="font-hindi font-bold text-white text-[13px] leading-tight line-clamp-2"
        title={festival.nameHi}
      >
        {festival.nameHi}
      </div>
      <div className="text-[10px] text-sc-muted mt-0.5 truncate">
        {festival.nameEn}
      </div>

      {/* Today: soft glow corner accent */}
      {isToday && (
        <div
          className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-sc-accent/30 blur-2xl pointer-events-none"
          aria-hidden="true"
        />
      )}
    </motion.div>
  );
}
