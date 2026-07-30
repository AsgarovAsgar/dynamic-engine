import { cn } from '@/lib/cn';
import { resolveIcon } from '@/lib/icons';
import type { WidgetComponentProps } from '@/registry/registry';
import type { NarrativeHeadlineWidget, WidgetStatus } from '@/types/widgets';

/** Chip tint per status. Muted fills so chips support the headline, not compete. */
const CHIP: Record<WidgetStatus, string> = {
  success: 'text-success border-success/30 bg-success/10',
  warning: 'text-warning border-warning/30 bg-warning/10',
  danger: 'text-danger border-danger/30 bg-danger/10',
  neutral: 'text-content-muted border-border bg-elevated',
};

export function NarrativeHeadline({
  widget,
}: WidgetComponentProps<NarrativeHeadlineWidget>) {
  const { headline, subline, chips } = widget.data;

  return (
    <div className="flex h-full flex-col justify-center p-6">
      {/* The generated answer is the page's real heading — h2 under the app's
          h1 — so screen-reader users land on the finding, not on chrome. */}
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
