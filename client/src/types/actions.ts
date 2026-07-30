/**
 * Contract for POST /api/widget-action.
 *
 * SOURCE OF TRUTH: server/src/types/actions.ts — this is a copy.
 *
 * The endpoint is a stateless echo: it validates the request, simulates
 * latency, and confirms what it would have applied. Nothing is persisted, so a
 * regenerated dashboard starts fresh — the client owns interaction state.
 */

export const WIDGET_ACTIONS = [
  /** ACTION_LIST checkbox toggle. */
  'TOGGLE_ITEM',
  /** DYNAMIC_FORM submission. */
  'SUBMIT_FORM',
  /** DATA_TABLE sort change. */
  'SORT_TABLE',
  /** Grid rearrangement after a drag. */
  'UPDATE_LAYOUT',
] as const;

export type WidgetActionType = (typeof WIDGET_ACTIONS)[number];

export interface WidgetActionRequest {
  widgetId: string;
  action: WidgetActionType;
  /** Shape depends on `action`; validated per-type in the route. */
  payload: Record<string, unknown>;
}

export interface WidgetActionResult {
  widgetId: string;
  action: WidgetActionType;
  /** Echo of the values the server accepted. */
  applied: Record<string, unknown>;
  /** Server-authoritative timestamp, for reconciling optimistic state. */
  appliedAt: string;
  message: string;
}
