import { useCallback, useEffect, useRef, useState } from 'react';
import { createSseParser } from '@/lib/sseParser';
import type {
  DashboardMeta,
  LayoutType,
  WidgetLayoutHint,
  WidgetType,
} from '@/types/widgets';

export interface DashboardSlot {
  id: string;
  type: WidgetType;
  layout: WidgetLayoutHint;
}

export type StreamStatus = 'idle' | 'streaming' | 'complete' | 'error';

export interface DashboardState {
  status: StreamStatus;
  dashboardId: string | null;
  layout: LayoutType;
  meta: DashboardMeta | null;
  /** Grid shape, known from the meta frame before any widget data arrives. */
  slots: DashboardSlot[];
  /** Widget payloads keyed by id; a missing key means "still streaming". */
  widgets: Map<string, unknown>;
  error: string | null;
}

const INITIAL: DashboardState = {
  status: 'idle',
  dashboardId: null,
  layout: 'grid-4-col',
  meta: null,
  slots: [],
  widgets: new Map(),
  error: null,
};

/**
 * Consumes POST /api/generate-dashboard and exposes the dashboard as it
 * assembles.
 *
 * The meta frame arrives first with a slot per widget, so the grid can render
 * a full set of correctly-sized skeletons immediately; subsequent widget
 * frames fill those reserved holes. Nothing moves as data lands.
 *
 * Widgets stay `unknown` here rather than being typed as `Widget` — validation
 * belongs to the registry, which is the trust boundary. Typing them optimistically
 * at this layer would be a lie the renderer then has to defend against anyway.
 */
export function useDashboardStream() {
  const [state, setState] = useState<DashboardState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);

  // Abort any in-flight stream when the component unmounts, so a navigation
  // mid-stream does not leave a reader running.
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const generate = useCallback(async (prompt: string) => {
    // A new prompt supersedes whatever is streaming.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ ...INITIAL, status: 'streaming', widgets: new Map() });

    try {
      const response = await fetch('/api/generate-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      if (!response.ok) {
        // Validation failures arrive as JSON before the stream opens.
        const problem = await response.json().catch(() => null);
        const message =
          problem && typeof problem === 'object' && 'error' in problem
            ? String((problem as { error: { message?: string } }).error.message)
            : `Request failed with ${response.status}`;
        setState((prev) => ({ ...prev, status: 'error', error: message }));
        return;
      }

      if (!response.body) {
        setState((prev) => ({ ...prev, status: 'error', error: 'No response body.' }));
        return;
      }

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      const parser = createSseParser();

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        for (const frame of parser.push(value)) {
          applyFrame(frame.event, frame.data, setState);
        }
      }

      const trailing = parser.flush();
      if (trailing) applyFrame(trailing.event, trailing.data, setState);
    } catch (error) {
      // An abort is a deliberate supersede, not a failure to report.
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Stream failed.',
      }));
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL);
  }, []);

  return { ...state, generate, reset };
}

function applyFrame(
  event: string,
  data: string,
  setState: React.Dispatch<React.SetStateAction<DashboardState>>,
): void {
  let payload: unknown;
  try {
    payload = JSON.parse(data);
  } catch {
    // A malformed frame should cost that frame, not the stream.
    console.warn('[stream] could not parse frame', event);
    return;
  }

  if (!payload || typeof payload !== 'object') return;
  const frame = payload as Record<string, unknown>;

  switch (event) {
    case 'meta': {
      setState((prev) => ({
        ...prev,
        status: 'streaming',
        dashboardId: typeof frame['dashboardId'] === 'string' ? frame['dashboardId'] : null,
        layout: (frame['layout'] as LayoutType) ?? prev.layout,
        meta: (frame['meta'] as DashboardMeta) ?? null,
        slots: Array.isArray(frame['slots']) ? (frame['slots'] as DashboardSlot[]) : [],
      }));
      break;
    }

    case 'widget': {
      const widget = frame['widget'];
      if (!widget || typeof widget !== 'object') return;
      const id = (widget as { id?: unknown }).id;
      if (typeof id !== 'string') return;

      setState((prev) => {
        // Cloning keeps the Map immutable for React's identity check; these
        // dashboards are tens of widgets, so the copy is not a concern.
        const widgets = new Map(prev.widgets);
        widgets.set(id, widget);
        return { ...prev, widgets };
      });
      break;
    }

    case 'error': {
      const widgetId = frame['widgetId'];
      const message = frame['message'];
      console.warn('[stream] widget error', widgetId, message);
      break;
    }

    case 'done': {
      setState((prev) => ({ ...prev, status: 'complete' }));
      break;
    }

    default:
      break;
  }
}

/** Convenience for rendering: pairs each slot with its payload, if it has one. */
export function toRenderList(
  state: Pick<DashboardState, 'slots' | 'widgets'>,
): Array<{ slot: DashboardSlot; payload: unknown }> {
  return state.slots.map((slot) => ({
    slot,
    payload: state.widgets.get(slot.id),
  }));
}
