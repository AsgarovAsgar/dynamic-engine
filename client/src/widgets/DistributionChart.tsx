import { useId, useState } from 'react';
import { cn } from '@/lib/cn';
import type { WidgetComponentProps } from '@/registry/registry';
import type { DistributionChartWidget } from '@/types/widgets';

/**
 * Histogram.
 *
 * Flexbox bars rather than SVG or a charting library: bars need to be hoverable
 * and individually tinted, which is cheaper with real DOM than with SVG rects.
 *
 * Heights are percentages of the tallest bin, so the chart fills whatever box
 * the grid gives it without measuring anything.
 *
 * The bars themselves are decorative — the readable content is the visually
 * hidden summary below, so assistive tech gets the numbers rather than a dozen
 * unlabelled graphics.
 */
export function DistributionChart({
  widget,
}: WidgetComponentProps<DistributionChartWidget>) {
  const { bins, xAxisLabel, yAxisLabel, highlightIndex } = widget.data;
  const [active, setActive] = useState<number | null>(null);

  const titleId = useId();
  const max = Math.max(...bins.map((bin) => bin.value), 1);
  const total = bins.reduce((sum, bin) => sum + bin.value, 0);
  const activeBin = active !== null ? bins[active] : undefined;

  return (
    <div className="flex h-full flex-col p-5">
      <div className="flex shrink-0 items-baseline justify-between gap-3">
        <h3 id={titleId} className="text-sm font-medium text-content">
          {widget.title}
        </h3>
        {/* Occupies its own line always, so hovering cannot shift the chart. */}
        <p className="min-h-4 text-xs text-content-muted tabular-nums">
          {activeBin
            ? `${activeBin.label}: ${activeBin.value.toLocaleString()}`
            : `${total.toLocaleString()} total`}
        </p>
      </div>

      <div
        aria-hidden="true"
        className="mt-4 flex min-h-0 flex-1 items-end gap-1"
        onMouseLeave={() => setActive(null)}
      >
        {bins.map((bin, index) => {
          const height = (bin.value / max) * 100;
          const isEmphasised = index === highlightIndex || index === active;

          return (
            <div
              key={bin.label}
              onMouseEnter={() => setActive(index)}
              className="group flex h-full flex-1 flex-col justify-end"
            >
              <span
                style={{ height: `${Math.max(height, 2)}%` }}
                className={cn(
                  'w-full rounded-t-[2px]',
                  // Colour rather than scale on hover: a transform here would
                  // make neighbouring bars appear to move.
                  'transition-colors duration-(--duration-fast) ease-(--ease-out-soft)',
                  isEmphasised ? 'bg-accent' : 'bg-accent/40 group-hover:bg-accent/70',
                )}
              />
            </div>
          );
        })}
      </div>

      <p className="sr-only">
        {widget.title}. {yAxisLabel ?? 'Value'} by {xAxisLabel ?? 'bucket'}:{' '}
        {bins.map((bin) => `${bin.label}, ${bin.value}`).join('; ')}.
      </p>

      <div className="mt-2 flex shrink-0 justify-between text-[0.625rem] text-content-subtle tabular-nums">
        <span>{bins[0]?.label}</span>
        {xAxisLabel && <span>{xAxisLabel}</span>}
        <span>{bins[bins.length - 1]?.label}</span>
      </div>
    </div>
  );
}
