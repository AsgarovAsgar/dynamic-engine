import { useState } from 'react';
import { Check } from 'lucide-react';
import { useOptimisticAction } from '@/hooks/useOptimisticAction';
import { cn } from '@/lib/cn';
import type { WidgetComponentProps } from '@/registry/registry';
import type { ActionListWidget } from '@/types/widgets';

/**
 * Checklist of recommended actions.
 *
 * Toggling is optimistic: the checkbox flips instantly, the request goes out
 * behind it, and a refusal restores the previous state with a toast offering
 * a retry.
 */
export function ActionList({ widget }: WidgetComponentProps<ActionListWidget>) {
  const [completed, setCompleted] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(widget.data.items.map((item) => [item.id, item.completed])),
  );

  const setItem = (id: string, value: boolean) =>
    setCompleted((current) => ({ ...current, [id]: value }));

  const { dispatch } = useOptimisticAction<{ id: string; label: string; done: boolean }>({
    widgetId: widget.id,
    action: 'TOGGLE_ITEM',
    apply: ({ id, done }) => setItem(id, done),
    rollback: ({ id, done }) => setItem(id, done),
    toPayload: ({ id, done }) => ({ itemId: id, completed: done }),
    failureMessage: ({ label }) => `Could not update “${label}”. Change reverted.`,
  });

  const done = Object.values(completed).filter(Boolean).length;
  const total = widget.data.items.length;

  return (
    <div className="flex h-full flex-col overflow-hidden p-5">
      <div className="flex shrink-0 items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-content">{widget.title}</h3>
        <p className="text-xs text-content-muted tabular-nums">
          {done}/{total}
        </p>
      </div>

      <ul className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto">
        {widget.data.items.map((item) => {
          const isDone = completed[item.id] ?? false;

          return (
            <li key={item.id}>
              {/* A real checkbox, not a div with a click handler: space to
                  toggle, correct role, and announced state all come free. */}
              <label
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-control px-2 py-2',
                  'transition-colors duration-(--duration-fast) ease-(--ease-out-soft)',
                  'hover:bg-elevated',
                  'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent',
                )}
              >
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={(event) =>
                    void dispatch(
                      { id: item.id, label: item.label, done: event.target.checked },
                      { id: item.id, label: item.label, done: isDone },
                    )
                  }
                  className="peer sr-only"
                />

                <span
                  aria-hidden="true"
                  className={cn(
                    'grid size-4 shrink-0 place-items-center rounded-full border',
                    'transition-colors duration-(--duration-fast) ease-(--ease-out-soft)',
                    isDone
                      ? 'border-success bg-success text-on-accent'
                      : 'border-border-strong',
                  )}
                >
                  {isDone && <Check className="size-2.5" strokeWidth={3} />}
                </span>

                <span
                  className={cn(
                    'text-sm transition-colors duration-(--duration-fast)',
                    isDone ? 'text-content-subtle line-through' : 'text-content',
                  )}
                >
                  {item.label}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
