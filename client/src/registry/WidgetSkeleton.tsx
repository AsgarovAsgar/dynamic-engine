import { Skeleton } from '@/components/Skeleton';
import type { WidgetType } from '@/types/widgets';
import {
  HEADER_HEIGHT,
  ROW_HEIGHT,
  SCROLL_BODY_HEIGHT,
  VISIBLE_ROWS,
} from '@/widgets/tableMetrics';

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
  // Label and sparkline share the top row, then the value, then the trend —
  // the same three bands MetricCard renders.
  return (
    <div className="flex h-full flex-col justify-between p-5">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-16 shrink-0" />
      </div>
      <Skeleton className="mt-3 h-8 w-28" />
      <Skeleton className="mt-2 h-4 w-16" />
    </div>
  );
}

function DataTableSkeleton() {
  // Mirrors DataTable's real structure: title row with a filter input, a
  // column header rule, 40px rows, and a bordered footer. Column widths follow
  // the same 3/2/1/2 weighting the scenarios use.
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-5 pb-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-7 w-36 rounded-control" />
      </div>


      {/* Same fixed box the real scroll body occupies, so the swap does not
          resize the card. */}
      <div
        style={{ height: SCROLL_BODY_HEIGHT }}
        className="shrink-0 overflow-hidden px-5"
      >
        <div
          className="flex items-center gap-4 border-b border-border"
          style={{ height: HEADER_HEIGHT }}
        >
          <Skeleton className="h-3 flex-3" />
          <Skeleton className="h-3 flex-2" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 flex-2" />
        </div>

        {Array.from({ length: VISIBLE_ROWS }, (_, i) => (
          <div
            key={i}
            className="flex shrink-0 items-center gap-4 border-b border-border/50"
            style={{ height: ROW_HEIGHT }}
          >
            <Skeleton className="h-3.5 flex-3" />
            <Skeleton className="h-3.5 flex-2" />
            <Skeleton className="h-3.5 flex-1" />
            <Skeleton className="h-3.5 flex-2" />
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-border px-5 py-2">
        <Skeleton className="h-3.5 w-32" />
      </div>
    </div>
  );
}

function DynamicFormSkeleton() {
  // Title, scrollable field list, then a bordered footer holding the submit
  // button — the same three regions DynamicForm renders.
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 px-5 pt-5">
        <Skeleton className="h-4 w-44" />
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-hidden px-5 py-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i}>
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-2 h-8 w-full rounded-control" />
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-border px-5 py-3">
        <Skeleton className="h-8 w-32 rounded-control" />
      </div>
    </div>
  );
}

function ActionListSkeleton() {
  // Title with its done/total counter, then rows matching the real list's
  // circle-plus-label layout and px-2 py-2 padding.
  return (
    <div className="flex h-full flex-col overflow-hidden p-5">
      <div className="flex shrink-0 items-baseline justify-between gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-8" />
      </div>
      <div className="mt-4 flex min-h-0 flex-col gap-1">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex shrink-0 items-center gap-3 px-2 py-2">
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
  // reads as a glitch. Eleven bars matches the scenarios' bin count.
  const heights = [
    '12%', '22%', '38%', '55%', '72%', '92%', '100%', '84%', '62%', '40%', '24%',
  ];

  return (
    <div className="flex h-full flex-col p-5">
      <div className="flex shrink-0 items-baseline justify-between gap-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-20" />
      </div>

      <div className="mt-4 flex min-h-0 flex-1 items-end gap-1">
        {heights.map((height, i) => (
          <Skeleton key={i} className="flex-1 rounded-t-[2px]" style={{ height }} />
        ))}
      </div>

      {/* Axis labels, matching the real chart's bottom row. */}
      <div className="mt-2 flex shrink-0 justify-between">
        <Skeleton className="h-2.5 w-6" />
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-2.5 w-6" />
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
