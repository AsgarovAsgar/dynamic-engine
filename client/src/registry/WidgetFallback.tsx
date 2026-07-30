import { FileQuestion, ShieldAlert } from 'lucide-react';

/**
 * Shown when a payload is structurally unusable — distinct from the error
 * boundary, which handles a component that threw while rendering valid data.
 * Separating them means the message can be specific about which happened.
 */
export function WidgetFallback({
  title,
  reason,
  variant,
}: {
  title?: string;
  reason: string;
  variant: 'unknown-type' | 'invalid-data';
}) {
  const Icon = variant === 'unknown-type' ? FileQuestion : ShieldAlert;

  return (
    <div
      role="note"
      className="flex h-full flex-col items-start justify-center gap-2 overflow-y-auto p-5"
    >
      <div className="flex items-center gap-2 text-content-muted">
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <p className="text-sm font-medium text-content">
          {title ?? 'Unsupported widget'}
        </p>
      </div>

      <p className="text-xs leading-relaxed text-content-subtle">{reason}</p>

      {variant === 'unknown-type' && (
        <p className="text-xs leading-relaxed text-content-subtle">
          This client version does not know how to render it.
        </p>
      )}
    </div>
  );
}
