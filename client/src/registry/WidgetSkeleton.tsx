import { Skeleton } from '@/components/Skeleton';
import type { WidgetType } from '@/types/widgets';

/**
 * Per-archetype loading placeholders.
 *
 * Each mirrors the internal structure of the widget it stands in for — a
 * metric card's skeleton has a label bar, a big value bar, and a sparkline
 * strip in the same positions. A generic grey box would technically reserve
 * the space, but the swap would be visible; matching the structure makes it
 * read as the same element resolving.
 */

function MetricCardSkeleton() {
  return (
    <div className="flex h-full flex-col justify-between p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-32" />
      <Skeleton className="mt-3 h-3 w-16" />
    </div>
  );
}

function DataTableSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden p-5">
      <Skeleton className="h-4 w-40 shrink-0" />
      <div className="mt-5 flex shrink-0 gap-4">
        <Skeleton className="h-3 flex-3" />
        <Skeleton className="h-3 flex-2" />
        <Skeleton className="h-3 flex-1" />
        <Skeleton className="h-3 flex-2" />
      </div>
      {/* min-h-0 lets this shrink below its content height inside a flex
          column, so a short slot clips rows instead of stretching the cell. */}
      <div className="mt-4 flex min-h-0 flex-col gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex shrink-0 gap-4">
            <Skeleton className="h-4 flex-3" />
            <Skeleton className="h-4 flex-2" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 flex-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DynamicFormSkeleton() {
  return (
    <div className="flex h-full flex-col p-5">
      <Skeleton className="h-4 w-44" />
      <div className="mt-5 flex flex-col gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i}>
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-2 h-8 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionListSkeleton() {
  return (
    <div className="flex h-full flex-col p-5">
      <Skeleton className="h-4 w-40" />
      <div className="mt-5 flex flex-col gap-3.5">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-4 shrink-0 rounded-full" />
            <Skeleton className="h-3.5 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DistributionChartSkeleton() {
  // Fixed heights, not random: a skeleton that changes shape between renders
  // reads as a glitch.
  const heights = ['30%', '45%', '65%', '85%', '70%', '50%', '35%', '25%'];

  return (
    <div className="flex h-full flex-col p-5">
      <Skeleton className="h-4 w-36" />
      <div className="mt-auto flex h-24 items-end gap-2">
        {heights.map((height, i) => (
          <Skeleton key={i} className="flex-1 rounded-t-sm" style={{ height }} />
        ))}
      </div>
    </div>
  );
}

function NarrativeHeadlineSkeleton() {
  return (
    <div className="flex h-full flex-col justify-center p-6">
      <Skeleton className="h-8 w-3/4 max-w-2xl" />
      <Skeleton className="mt-3 h-4 w-1/2 max-w-lg" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-7 w-32 rounded-full" />
        <Skeleton className="h-7 w-44 rounded-full" />
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>
    </div>
  );
}

function GenericSkeleton() {
  return (
    <div className="flex h-full flex-col p-5">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-full w-full" />
    </div>
  );
}

const SKELETONS: Record<WidgetType, () => React.JSX.Element> = {
  METRIC_CARD: MetricCardSkeleton,
  DATA_TABLE: DataTableSkeleton,
  DYNAMIC_FORM: DynamicFormSkeleton,
  ACTION_LIST: ActionListSkeleton,
  DISTRIBUTION_CHART: DistributionChartSkeleton,
  NARRATIVE_HEADLINE: NarrativeHeadlineSkeleton,
};

/**
 * Resolves the placeholder for a widget type. Unknown types still get a
 * sensible box, so a schema the client has never seen degrades rather than
 * leaving a hole in the grid.
 */
export function WidgetSkeleton({ type }: { type: WidgetType | string }) {
  const Component = SKELETONS[type as WidgetType] ?? GenericSkeleton;
  return (
    <div role="status" aria-label="Loading widget" className="h-full">
      <Component />
    </div>
  );
}
