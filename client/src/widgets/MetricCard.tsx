import { TrendingDown, TrendingUp } from 'lucide-react';
import { Sparkline } from '@/components/Sparkline';
import { cn } from '@/lib/cn';
import type { WidgetComponentProps } from '@/registry/registry';
import type { MetricCardWidget, WidgetStatus } from '@/types/widgets';

/** Semantic status → token class. Components never name a literal colour. */
const STATUS_TEXT: Record<WidgetStatus, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  neutral: 'text-content-muted',
};

export function MetricCard({ widget }: WidgetComponentProps<MetricCardWidget>) {
  const { value, unit, trend, trendDirection, status, caption, sparkline } = widget.data;

  const isDown = trendDirection === 'down';
  const TrendIcon = isDown ? TrendingDown : TrendingUp;

  return (
    <div className="flex h-full flex-col justify-between p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[0.6875rem] font-medium uppercase tracking-wider text-content-subtle">
          {widget.title}
        </h3>
        {sparkline && sparkline.length > 1 && (
          <Sparkline
            values={sparkline}
            className={cn('h-6 w-16 shrink-0', STATUS_TEXT[status])}
          />
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        {/* Tabular figures stop the value jittering when digits change. */}
        <span className="text-3xl font-semibold tracking-tight text-content tabular-nums">
          {value}
        </span>
        {unit && <span className="text-sm text-content-muted">{unit}</span>}
      </div>

      <div className="mt-2 flex min-h-5 items-center gap-1.5">
        {trend && (
          <span className={cn('flex items-center gap-1 text-xs font-medium', STATUS_TEXT[status])}>
            <TrendIcon className="size-3.5" aria-hidden="true" />
            <span className="tabular-nums">{trend}</span>
            {/* Direction is conveyed by an icon and colour; spell it out for
                screen readers, which cannot see either. */}
            <span className="sr-only">{isDown ? 'decrease' : 'increase'}</span>
          </span>
        )}
        {caption && <span className="text-xs text-content-subtle">{caption}</span>}
      </div>
    </div>
  );
}
