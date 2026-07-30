/**
 * Canonical widget schema contract.
 *
 * SOURCE OF TRUTH: server/src/types/widgets.ts — this is a copy. Change it
 * there first, then mirror it here; the two must stay identical or the client
 * will resolve schemas the server never sends.
 *
 * This module is the single source of truth for the payload shape that the
 * "LLM" emits and the client's Dynamic Component Registry resolves against.
 * The client imports these same types, so a schema change breaks the build on
 * both sides rather than at runtime in front of a reviewer.
 */

/** Every archetype the registry knows how to resolve. */
export const WIDGET_TYPES = [
  'METRIC_CARD',
  'DATA_TABLE',
  'DYNAMIC_FORM',
  'ACTION_LIST',
  'DISTRIBUTION_CHART',
  'NARRATIVE_HEADLINE',
] as const;

export type WidgetType = (typeof WIDGET_TYPES)[number];

/** Semantic status, mapped to design tokens on the client rather than raw colors. */
export type WidgetStatus = 'success' | 'warning' | 'danger' | 'neutral';

/** Grid archetypes the layout engine understands. */
export type LayoutType =
  | 'grid-1-col'
  | 'grid-2-col'
  | 'grid-3-col'
  | 'grid-4-col';

export type ThemeName = 'dark' | 'light' | 'high-contrast';

/**
 * Grid placement. Kept on the envelope (not inside `data`) so the layout engine
 * can reserve space for a widget before its data resolves — this is what makes
 * zero-CLS streaming possible.
 */
export interface WidgetLayoutHint {
  /** Columns the widget spans in the parent grid. */
  colSpan: number;
  /** Rows the widget spans. Drives skeleton height so nothing reflows on load. */
  rowSpan: number;
  /** Explicit ordering; lower renders first. */
  order: number;
  /** Reserved pixel height for the skeleton before real data arrives. */
  minHeight: number;
}

// ---------------------------------------------------------------------------
// Per-archetype data payloads
// ---------------------------------------------------------------------------

export interface MetricCardData {
  value: string;
  unit?: string;
  /** Pre-formatted delta, e.g. "+12.4%" or "-3.2%". */
  trend?: string;
  trendDirection?: 'up' | 'down' | 'flat';
  status: WidgetStatus;
  caption?: string;
  sparkline: number[];
}

export type TableColumnAlign = 'left' | 'right' | 'center';

export interface TableColumn {
  key: string;
  label: string;
  align: TableColumnAlign;
  sortable: boolean;
  /** Client formats by intent instead of receiving pre-baked strings. */
  format?: 'text' | 'currency' | 'number' | 'score' | 'percent';
  /** Flex-basis weight for column sizing; avoids fixed pixel widths. */
  weight?: number;
}

export type TableCellValue = string | number | boolean | null;

export interface DataTableData {
  columns: TableColumn[];
  rows: Array<Record<string, TableCellValue>>;
  /** Total rows available server-side; may exceed `rows.length` when paged. */
  totalRows: number;
  defaultSort?: { key: string; direction: 'asc' | 'desc' };
  /** Signals the client to mount the virtualized renderer. */
  virtualized: boolean;
}

export type FormFieldType =
  | 'slider'
  | 'toggle'
  | 'select'
  | 'text'
  | 'number';

export interface FormFieldOption {
  label: string;
  value: string;
}

/** Declarative validation, interpreted by the client — no code is ever sent. */
export interface FormFieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  /** Serialized RegExp source, applied with the `u` flag client-side. */
  pattern?: string;
  message?: string;
}

export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  description?: string;
  defaultValue: string | number | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: FormFieldOption[];
  validation?: FormFieldValidation;
}

export interface DynamicFormData {
  fields: FormField[];
  submitLabel: string;
  actionEndpoint: string;
}

export interface ActionItem {
  id: string;
  label: string;
  completed: boolean;
  /** Optimistic toggles post here; the client rolls back on failure. */
  actionEndpoint: string;
}

export interface ActionListData {
  items: ActionItem[];
}

export interface DistributionBin {
  label: string;
  value: number;
}

export interface DistributionChartData {
  bins: DistributionBin[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  /** Bin index to emphasize, e.g. the modal bucket. */
  highlightIndex?: number;
}

export interface NarrativeChip {
  label: string;
  icon?: string;
  status: WidgetStatus;
}

export interface NarrativeHeadlineData {
  headline: string;
  subline?: string;
  chips: NarrativeChip[];
}

// ---------------------------------------------------------------------------
// Discriminated union — `type` is the registry's resolution key
// ---------------------------------------------------------------------------

interface WidgetBase<TType extends WidgetType, TData> {
  id: string;
  type: TType;
  title: string;
  description?: string;
  layout: WidgetLayoutHint;
  data: TData;
}

export type MetricCardWidget = WidgetBase<'METRIC_CARD', MetricCardData>;
export type DataTableWidget = WidgetBase<'DATA_TABLE', DataTableData>;
export type DynamicFormWidget = WidgetBase<'DYNAMIC_FORM', DynamicFormData>;
export type ActionListWidget = WidgetBase<'ACTION_LIST', ActionListData>;
export type DistributionChartWidget = WidgetBase<
  'DISTRIBUTION_CHART',
  DistributionChartData
>;
export type NarrativeHeadlineWidget = WidgetBase<
  'NARRATIVE_HEADLINE',
  NarrativeHeadlineData
>;

export type Widget =
  | MetricCardWidget
  | DataTableWidget
  | DynamicFormWidget
  | ActionListWidget
  | DistributionChartWidget
  | NarrativeHeadlineWidget;

export interface DashboardMeta {
  /** Echoed so the client can label the investigation in history. */
  prompt: string;
  generatedAt: string;
  /** Simulated LLM confidence, drives the "High Confidence" chip. */
  confidence: number;
  sources: string[];
}

export interface DashboardPayload {
  dashboardId: string;
  layout: LayoutType;
  theme: ThemeName;
  meta: DashboardMeta;
  widgets: Widget[];
}

// ---------------------------------------------------------------------------
// Streaming envelope (SSE frames for POST /api/generate-dashboard)
// ---------------------------------------------------------------------------

/**
 * Frames arrive in order: `meta` (layout + skeleton slots) → one `widget` per
 * resolved widget → `done`. The client reserves grid space from the `meta`
 * frame's slots, so later frames fill holes instead of shifting the page.
 */
export type StreamFrame =
  | {
      event: 'meta';
      dashboardId: string;
      layout: LayoutType;
      theme: ThemeName;
      meta: DashboardMeta;
      /** Placeholders describing what is still to come. */
      slots: Array<{ id: string; type: WidgetType; layout: WidgetLayoutHint }>;
    }
  | { event: 'widget'; widget: Widget }
  | { event: 'error'; widgetId: string; message: string }
  | { event: 'done'; dashboardId: string; widgetCount: number };
