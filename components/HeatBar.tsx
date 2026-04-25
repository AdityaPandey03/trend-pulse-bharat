'use client';

/**
 * Heat indicator.
 *
 * Why not just a number: a 0..100 score is abstract. A visual bar tells
 * the user at a glance "this is the hottest" without them doing math.
 * The flame emoji count reinforces that (80+ = 3 flames, 60+ = 2, else 1).
 */
export function HeatBar({ heat, compact = false }: { heat: number; compact?: boolean }) {
  const clamped = Math.max(0, Math.min(100, heat));
  const flames = clamped >= 80 ? '🔥🔥🔥' : clamped >= 60 ? '🔥🔥' : '🔥';

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1 text-xs">
        <span aria-hidden="true">{flames}</span>
        <span className="font-semibold text-sc-heat2 tabular-nums">{clamped}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-xs" aria-hidden="true">{flames}</span>
      <div className="flex-1 h-1.5 bg-sc-line rounded-full overflow-hidden">
        <div
          className="h-full heat-fill rounded-full transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-sc-heat2 tabular-nums min-w-[28px] text-right">
        {clamped}
      </span>
    </div>
  );
}
