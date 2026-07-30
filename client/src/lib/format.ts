import type { TableCellValue, TableColumn } from '@/types/widgets';

/**
 * Display formatting.
 *
 * The server sends raw numbers with a `format` hint rather than pre-formatted
 * strings, so sorting compares values — "SAR 900K" would otherwise sort above
 * "SAR 5.1M". Formatting happens here, at the edge.
 */

const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const plainNumber = new Intl.NumberFormat('en-US');

const percent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 1,
});

export function formatCell(
  value: TableCellValue,
  format: TableColumn['format'] = 'text',
): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';

  if (typeof value === 'number') {
    switch (format) {
      case 'currency':
        return `SAR ${compactNumber.format(value)}`;
      case 'number':
        return plainNumber.format(value);
      case 'percent':
        return percent.format(value);
      case 'score':
        // Fixed 2 decimals so scores align on the decimal point in a column.
        return value.toFixed(2);
      default:
        return plainNumber.format(value);
    }
  }

  return String(value);
}

/** Sort comparator that keeps numbers numeric and nulls last in both directions. */
export function compareCells(a: TableCellValue, b: TableCellValue): number {
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;

  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return Number(a) - Number(b);
  }

  return String(a).localeCompare(String(b), 'en', { numeric: true });
}
