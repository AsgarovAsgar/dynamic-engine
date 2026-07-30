import { useDeferredValue, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { compareCells, formatCell } from '@/lib/format';
import type { WidgetComponentProps } from '@/registry/registry';
import type { DataTableWidget, TableColumn } from '@/types/widgets';
import { ROW_HEIGHT, SCROLL_BODY_HEIGHT } from './tableMetrics';

type SortDirection = 'asc' | 'desc';

/**
 * Below this, plain rendering wins: the DOM cost is trivial and virtualization
 * would add scroll machinery with no benefit. Above it, windowing keeps the
 * node count flat regardless of dataset size.
 */
const VIRTUALIZE_THRESHOLD = 100;

/**
 * Extra rows rendered above and below the viewport, so fast scrolling does not
 * flash gaps. Kept small relative to the visible window — a large overscan on a
 * short viewport renders far more than it saves.
 */
const OVERSCAN = 3;

const ALIGN: Record<NonNullable<TableColumn['align']>, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

export function DataTable({ widget }: WidgetComponentProps<DataTableWidget>) {
  const { columns, rows, defaultSort, totalRows } = widget.data;

  const [sortKey, setSortKey] = useState<string | null>(defaultSort?.key ?? null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    defaultSort?.direction ?? 'desc',
  );
  const [filter, setFilter] = useState('');
  const [scrollTop, setScrollTop] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState(0);

  // Keeps typing responsive: filtering a large table stays off the keystroke's
  // critical path, so the input never feels laggy.
  const deferredFilter = useDeferredValue(filter);

  const visibleRows = useMemo(() => {
    const needle = deferredFilter.trim().toLowerCase();

    const filtered = needle
      ? rows.filter((row) =>
          columns.some((column) =>
            String(row[column.key] ?? '')
              .toLowerCase()
              .includes(needle),
          ),
        )
      : rows;

    if (!sortKey) return filtered;

    // Copy before sorting: mutating props would corrupt the payload the
    // registry validated.
    return [...filtered].sort((a, b) => {
      const result = compareCells(a[sortKey] ?? null, b[sortKey] ?? null);
      return sortDirection === 'asc' ? result : -result;
    });
  }, [rows, columns, deferredFilter, sortKey, sortDirection]);

  const shouldVirtualize = visibleRows.length > VIRTUALIZE_THRESHOLD;

  const { offsetY, offsetBottom, windowRows } = useMemo(() => {
    if (!shouldVirtualize || viewportHeight === 0) {
      return { offsetY: 0, offsetBottom: 0, windowRows: visibleRows };
    }

    const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const count = Math.ceil(viewportHeight / ROW_HEIGHT) + OVERSCAN * 2;
    const last = Math.min(visibleRows.length, first + count);

    return {
      offsetY: first * ROW_HEIGHT,
      // Both spacers are required: without the trailing one the container is
      // only as tall as the rendered window, so there is nowhere to scroll to
      // and the scrollbar misrepresents the dataset.
      offsetBottom: (visibleRows.length - last) * ROW_HEIGHT,
      windowRows: visibleRows.slice(first, last),
    };
  }, [shouldVirtualize, viewportHeight, scrollTop, visibleRows]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-3">
        <h3 className="text-sm font-medium text-content">{widget.title}</h3>

        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-content-subtle"
            aria-hidden="true"
          />
          <label htmlFor={`${widget.id}-filter`} className="sr-only">
            Filter {widget.title}
          </label>
          <input
            id={`${widget.id}-filter`}
            type="text"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter…"
            className={cn(
              'w-36 rounded-control border border-border bg-elevated py-1.5 pr-2.5 pl-8',
              'text-xs text-content placeholder:text-content-subtle',
              'transition-colors duration-(--duration-fast)',
              'hover:border-border-strong focus:border-accent focus:outline-none',
            )}
          />
        </div>
      </div>

      <div
        ref={(node) => {
          scrollRef.current = node;
          // Measured from the node itself rather than a resize listener: the
          // cell has a fixed reserved height, so this settles on first layout.
          if (node && node.clientHeight !== viewportHeight) {
            setViewportHeight(node.clientHeight);
          }
        }}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        // Fixed height rather than flex-1: the body shows exactly VISIBLE_ROWS
        // rows regardless of how tall the card is or what the surrounding
        // chrome does. The sticky header sits inside this box, so its height
        // is part of the total.
        style={{ height: SCROLL_BODY_HEIGHT }}
        // shrink-0 is required: a flex child shrinks below its specified height
        // by default, which would collapse the body and show fewer rows.
        className="shrink-0 overflow-auto px-5"
      >
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-surface">
            <tr>
              {columns.map((column) => {
                const isSorted = sortKey === column.key;
                const SortIcon = !isSorted
                  ? ArrowUpDown
                  : sortDirection === 'asc'
                    ? ArrowUp
                    : ArrowDown;

                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={
                      isSorted
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                    style={{ width: `${(column.weight ?? 1) * 10}%` }}
                    className={cn(
                      'border-b border-border py-2 text-[0.6875rem] font-medium uppercase tracking-wider',
                      'text-content-subtle',
                      ALIGN[column.align],
                    )}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className={cn(
                          'inline-flex items-center gap-1 transition-colors duration-(--duration-fast)',
                          'hover:text-content',
                          isSorted && 'text-content',
                          column.align === 'right' && 'flex-row-reverse',
                        )}
                      >
                        {column.label}
                        <SortIcon className="size-3" aria-hidden="true" />
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {/* Spacer rows carry the scroll height of the rows not rendered,
                so the scrollbar reflects the full dataset. */}
            {offsetY > 0 && (
              <tr aria-hidden="true">
                <td colSpan={columns.length} style={{ height: offsetY, padding: 0 }} />
              </tr>
            )}

            {windowRows.map((row, index) => (
              <tr
                key={String(row[columns[0]?.key ?? ''] ?? index)}
                style={{ height: ROW_HEIGHT }}
                className="transition-colors duration-(--duration-fast) hover:bg-elevated"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    // Height on the cell, not padding: `height` on a <tr> is
                    // only a minimum that cell padding overrides, so padded
                    // cells made rows 57px while the virtualization maths
                    // assumed 40 — putting every window and spacer out.
                    style={{ height: ROW_HEIGHT }}
                    className={cn(
                      'truncate border-b border-border/50 py-0 text-content',
                      ALIGN[column.align],
                      (column.format === 'score' ||
                        column.format === 'number' ||
                        column.format === 'currency' ||
                        column.format === 'percent') &&
                        'tabular-nums',
                    )}
                  >
                    {formatCell(row[column.key] ?? null, column.format)}
                  </td>
                ))}
              </tr>
            ))}

            {offsetBottom > 0 && (
              <tr aria-hidden="true">
                <td colSpan={columns.length} style={{ height: offsetBottom, padding: 0 }} />
              </tr>
            )}
          </tbody>
        </table>

        {visibleRows.length === 0 && (
          <p className="py-6 text-center text-xs text-content-subtle">
            No rows match “{filter}”.
          </p>
        )}
      </div>

      <p className="shrink-0 border-t border-border px-5 py-2 text-[0.6875rem] text-content-subtle">
        Showing {visibleRows.length.toLocaleString()} of {totalRows.toLocaleString()}
        {shouldVirtualize && ' · virtualized'}
      </p>
    </div>
  );
}
