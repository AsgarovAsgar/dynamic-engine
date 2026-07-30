import { cn } from '@/lib/cn';
import type { LayoutType } from '@/types/widgets';

/**
 * Auto-layout matrix.
 *
 * Column count comes from the schema, but each track is `minmax(0, 1fr)` — the
 * `0` floor is what prevents a wide table from forcing the grid past its
 * container and leaking horizontal scroll. The default `auto` minimum would
 * let content dictate track width.
 *
 * Below the `md` breakpoint everything collapses to a single column: widget
 * colSpans are authored for a 4-column desktop grid and would overflow a phone.
 */
const COLUMNS: Record<LayoutType, string> = {
  'grid-1-col': 'md:grid-cols-1',
  'grid-2-col': 'md:grid-cols-2',
  'grid-3-col': 'md:grid-cols-3',
  'grid-4-col': 'md:grid-cols-4',
};

export function DashboardGrid({
  layout,
  className,
  children,
}: {
  layout: LayoutType;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn('grid w-full grid-cols-1 gap-4', COLUMNS[layout], className)}
      style={{ gridAutoRows: 'min-content' }}
    >
      {children}
    </div>
  );
}
