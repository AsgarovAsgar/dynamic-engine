import { useCallback, useRef, useState } from 'react';
import { useToaster } from '@/components/Toaster';
import { withFailureFlag } from '@/lib/failureMode';
import type { WidgetActionType } from '@/types/actions';

/**
 * Optimistic mutation.
 *
 * The pattern: apply the change locally and immediately, dispatch in the
 * background, and restore the previous value if the server refuses. The user
 * never waits on the network for feedback — which is the whole point, and why
 * the mock server injects 450ms of latency. Against an instant server, an
 * optimistic update and a pessimistic one look identical.
 *
 * State is owned by the caller. This hook does not know what it is updating,
 * only how to sequence the attempt and how to undo it.
 */
export interface OptimisticActionOptions<TValue> {
  widgetId: string;
  action: WidgetActionType;
  /** Applies the new value locally. Called before the request goes out. */
  apply: (value: TValue) => void;
  /** Restores the prior value. Called only if the request fails. */
  rollback: (previous: TValue) => void;
  /** Builds the request payload. */
  toPayload: (value: TValue) => Record<string, unknown>;
  /** Message shown when the server refuses and state is reverted. */
  failureMessage: (value: TValue) => string;
  successMessage?: ((value: TValue) => string) | undefined;
}

export function useOptimisticAction<TValue>(options: OptimisticActionOptions<TValue>) {
  const [pending, setPending] = useState(false);
  const { notify } = useToaster();

  // Options change identity every render (inline closures); a ref keeps the
  // returned callback stable so memoized children do not re-render per keystroke.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  /** Aborts a superseded request: only the newest toggle should decide state. */
  const inFlight = useRef<AbortController | null>(null);

  const dispatch = useCallback(async (value: TValue, previous: TValue) => {
    const current = optionsRef.current;

    // 1. Apply immediately. The UI is already correct before the network call.
    current.apply(value);
    setPending(true);

    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;

    try {
      const response = await fetch('/api/widget-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetId: current.widgetId,
          action: current.action,
          payload: withFailureFlag(current.toPayload(value)),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        // 2a. Refused — restore the previous value and say so.
        current.rollback(previous);
        notify({ tone: 'error', message: current.failureMessage(value) });
        return false;
      }

      // 2b. Accepted. The optimistic state was already right, so there is
      // nothing to re-apply — only an optional confirmation.
      const message = current.successMessage?.(value);
      if (message) notify({ tone: 'success', message });
      return true;
    } catch (error) {
      // A superseded request must not roll back state a newer one just set.
      if (error instanceof DOMException && error.name === 'AbortError') return false;

      current.rollback(previous);
      notify({ tone: 'error', message: current.failureMessage(value) });
      return false;
    } finally {
      if (inFlight.current === controller) {
        inFlight.current = null;
        setPending(false);
      }
    }
  }, [notify]);

  return { dispatch, pending };
}
