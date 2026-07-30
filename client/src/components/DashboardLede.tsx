import { Skeleton } from '@/components/Skeleton';
import { cn } from '@/lib/cn';
import { resolveIcon } from '@/lib/icons';
import type { NarrativeHeadlineData, WidgetStatus } from '@/types/widgets';

/** Chip tint per status. Muted fills so chips support the headline, not compete. */
const CHIP: Record<WidgetStatus, string> = {
  success: 'text-success border-success/30 bg-success/10',
  warning: 'text-warning border-warning/30 bg-warning/10',
  danger: 'text-danger border-danger/30 bg-danger/10',
  neutral: 'text-content-muted border-border bg-elevated',
};

/**
 * The generated answer, rendered as page content rather than as a widget.
 *
 * It reads as the lede — the thing the user asked for — so it gets no card,
 * border, or fill. Everything below it is supporting detail.
 */
/**
 * Placeholder matching the lede's rendered proportions, so the grid below does
 * not jump when the headline frame arrives. Heights mirror the real elements:
 * a headline line, a subline, and a row of chips.
 */
export function DashboardLedeSkeleton() {
  return (
    <div className="mb-6" role="status" aria-label="Loading summary">
      <Skeleton className="h-9 w-3/4 max-w-2xl" />
      <Skeleton className="mt-3 h-5 w-1/2 max-w-lg" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-6 w-52 rounded-full" />
        <Skeleton className="h-6 w-28 rounded-full" />
      </div>
    </div>
  );
}

export function DashboardLede({ data }: { data: NarrativeHeadlineData }) {
  const { headline, subline, chips } = data;

  return (
    <div className="mb-6">
      {/* An h2 under the app's h1, so screen reader users land on the finding
          rather than on chrome. */}
      <h2 className="text-balance text-2xl leading-tight font-semibold tracking-tight text-content sm:text-3xl">
        {headline}
      </h2>

      {subline && (
        <p className="mt-2 text-pretty text-sm text-content-muted">{subline}</p>
      )}

      {chips.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => {
            const Icon = resolveIcon(chip.icon);
            return (
              <li
                key={chip.label}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1',
                  'text-xs font-medium',
                  CHIP[chip.status],
                )}
              >
                <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                {chip.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
