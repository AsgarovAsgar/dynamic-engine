import { Suspense, memo } from 'react';
import { cn } from '@/lib/cn';
import type { Widget, WidgetLayoutHint } from '@/types/widgets';
import { resolveWidget } from './registry';
import { validateWidget } from './validate';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';
import { WidgetFallback } from './WidgetFallback';
import { WidgetSkeleton } from './WidgetSkeleton';

interface WidgetRendererProps {
  /** Unvalidated payload — this component is the trust boundary. */
  payload: unknown;
  /** Slot geometry from the stream's meta frame, known before data arrives. */
  layout: WidgetLayoutHint;
  /** Type from the slot, used for the skeleton before the payload lands. */
  slotType: string;
}

/**
 * Renders one widget through four layers of protection:
 *
 *   1. validate  — structural check; bad data becomes a fallback, not a crash
 *   2. resolve   — registry lookup; unknown types become a fallback
 *   3. boundary  — catches anything that throws during render
 *   4. Suspense  — code-split component loads behind its own skeleton
 *
 * Any single widget can fail at any layer without touching its neighbours.
 */
function WidgetRendererImpl({ payload, layout, slotType }: WidgetRendererProps) {
  // The grid cell is sized identically in every branch — loading, loaded,
  // failed. This is what holds CLS at zero: the container never changes size
  // based on what ends up inside it.
  // `overflow-hidden` is load-bearing, not cosmetic: minHeight reserves a
  // floor but does not cap growth, so content taller than its slot would push
  // the row and shift everything below it. Clipping keeps the cell's footprint
  // identical whether it holds a skeleton, a fallback, or the real widget.
  const shell = cn(
    'overflow-hidden rounded-widget border border-border bg-surface',
    'transition-colors duration-(--duration-base) ease-(--ease-out-soft)',
    // One column on phones; authored spans apply from md up.
    'col-span-1 md:col-span-(--col-span)',
  );

  // height (not minHeight) pins the cell to exactly its reserved size in every
  // state. A floor alone lets a tall skeleton or a verbose error message grow
  // the row and shift the page — the precise failure this design prevents.
  //
  // colSpan goes through a custom property rather than a direct `gridColumn`:
  // spans are authored for a 4-column desktop grid, and an inline style would
  // beat any media query, forcing `span 4` onto a single-column phone layout.
  // The stylesheet consumes `--col-span` only from `md` up.
  const style = {
    '--col-span': layout.colSpan,
    gridRow: `span ${layout.rowSpan}`,
    height: `${layout.minHeight}px`,
    order: layout.order,
  } as React.CSSProperties;

  // Payload not yet streamed in.
  if (payload === undefined) {
    return (
      <div className={shell} style={style}>
        <WidgetSkeleton type={slotType} />
      </div>
    );
  }

  const result = validateWidget(payload);

  if (!result.valid) {
    const title =
      typeof payload === 'object' && payload !== null && 'title' in payload
        ? String((payload as { title: unknown }).title)
        : undefined;

    return (
      <div className={shell} style={style}>
        <WidgetFallback
          {...(title !== undefined && { title })}
          reason={result.reason}
          variant={result.reason.startsWith('Unknown widget type') ? 'unknown-type' : 'invalid-data'}
        />
      </div>
    );
  }

  const widget: Widget = result.widget;
  const Component = resolveWidget(widget.type);

  if (!Component) {
    return (
      <div className={shell} style={style}>
        <WidgetFallback
          title={widget.title}
          reason={`No component is registered for "${widget.type}".`}
          variant="unknown-type"
        />
      </div>
    );
  }

  return (
    <div className={shell} style={style} data-widget-id={widget.id}>
      <WidgetErrorBoundary widgetId={widget.id} widgetTitle={widget.title}>
        <Suspense fallback={<WidgetSkeleton type={widget.type} />}>
          <Component widget={widget} />
        </Suspense>
      </WidgetErrorBoundary>
    </div>
  );
}

/**
 * Memoized: a streaming dashboard re-renders the grid on every frame, and
 * without this every settled widget would re-render each time a new one
 * arrives — janking the very stream the design is meant to keep smooth.
 */
export const WidgetRenderer = memo(WidgetRendererImpl);
