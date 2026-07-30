import { useMemo, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { useOptimisticAction } from '@/hooks/useOptimisticAction';
import { cn } from '@/lib/cn';
import { validateAll, validateField, type FieldValue } from '@/lib/validateField';
import type { WidgetComponentProps } from '@/registry/registry';
import type { DynamicFormWidget, FormField } from '@/types/widgets';

/**
 * Renders a form from schema, including its validation rules.
 *
 * Field state is colocated here rather than lifted: nothing outside this widget
 * needs a half-filled form, and colocating keeps a keystroke from re-rendering
 * the dashboard.
 */
export function DynamicForm({ widget }: WidgetComponentProps<DynamicFormWidget>) {
  const { fields, submitLabel } = widget.data;

  const initialValues = useMemo(() => {
    const values: Record<string, FieldValue> = {};
    for (const field of fields) values[field.name] = field.defaultValue;
    return values;
  }, [fields]);

  const [values, setValues] = useState<Record<string, FieldValue>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle');

  /** Last values the server accepted — the state a failed submit reverts to. */
  const [submitted, setSubmitted] = useState<Record<string, FieldValue>>(initialValues);

  const { dispatch } = useOptimisticAction<Record<string, FieldValue>>({
    widgetId: widget.id,
    action: 'SUBMIT_FORM',
    apply: (next) => setSubmitted(next),
    rollback: (previous) => {
      // Restore both the accepted baseline and the visible fields, so the user
      // sees exactly what the server still holds.
      setSubmitted(previous);
      setValues(previous);
    },
    toPayload: (next) => ({ values: next }),
    failureMessage: () => `Could not apply ${widget.title}. Values reverted.`,
    successMessage: () => `${widget.title} applied.`,
  });

  const setValue = (field: FormField, value: FieldValue) => {
    setValues((current) => ({ ...current, [field.name]: value }));

    // Only re-validate a field the user has already left, so errors do not
    // appear while they are still typing the first character.
    if (touched[field.name]) {
      const error = validateField(field, value);
      setErrors((current) => {
        const next = { ...current };
        if (error) next[field.name] = error;
        else delete next[field.name];
        return next;
      });
    }
  };

  const blur = (field: FormField) => {
    setTouched((current) => ({ ...current, [field.name]: true }));
    const error = validateField(field, values[field.name] ?? '');
    setErrors((current) => {
      const next = { ...current };
      if (error) next[field.name] = error;
      else delete next[field.name];
      return next;
    });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    const found = validateAll(fields, values);
    setErrors(found);
    setTouched(Object.fromEntries(fields.map((field) => [field.name, true])));

    if (Object.keys(found).length > 0) return;

    // A form submit is optimistic in the sense that it confirms instantly and
    // reverts on refusal — but unlike a toggle it keeps a pending state, since
    // "applied" is a claim about the server, not about local UI.
    setStatus('submitting');
    void dispatch(values, submitted).finally(() => setStatus('idle'));
  };

  return (
    <form onSubmit={submit} className="flex h-full flex-col overflow-hidden">
      <h3 className="shrink-0 px-5 pt-5 text-sm font-medium text-content">
        {widget.title}
      </h3>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {fields.map((field) => (
          <Field
            key={field.name}
            field={field}
            value={values[field.name] ?? ''}
            error={errors[field.name]}
            widgetId={widget.id}
            onChange={(value) => setValue(field, value)}
            onBlur={() => blur(field)}
          />
        ))}
      </div>

      <div className="shrink-0 border-t border-border px-5 py-3">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className={cn(
            'inline-flex items-center gap-2 rounded-control bg-accent px-3.5 py-2',
            'text-xs font-medium text-on-accent',
            'transition-colors duration-(--duration-fast) ease-(--ease-out-soft)',
            'hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60',
          )}
        >
          {status === 'submitting' && (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          )}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  field,
  value,
  error,
  widgetId,
  onChange,
  onBlur,
}: {
  field: FormField;
  value: FieldValue;
  error?: string | undefined;
  widgetId: string;
  onChange: (value: FieldValue) => void;
  onBlur: () => void;
}) {
  const id = `${widgetId}-${field.name}`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : field.description ? `${id}-hint` : undefined;

  const control = cn(
    'w-full rounded-control border bg-elevated px-3 py-2 text-xs text-content',
    'transition-colors duration-(--duration-fast)',
    'focus:outline-none',
    error ? 'border-danger' : 'border-border hover:border-border-strong focus:border-accent',
  );

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium text-content">
          {field.label}
        </label>
        {field.type === 'slider' && (
          <span className="text-xs text-content-muted tabular-nums">{String(value)}</span>
        )}
      </div>

      {field.description && !error && (
        <p id={`${id}-hint`} className="mt-1 text-[0.6875rem] text-content-subtle">
          {field.description}
        </p>
      )}

      <div className="mt-2">
        {field.type === 'toggle' ? (
          <button
            type="button"
            id={id}
            role="switch"
            aria-checked={value === true}
            aria-describedby={describedBy}
            onClick={() => onChange(!value)}
            onBlur={onBlur}
            className={cn(
              'relative h-6 w-11 rounded-full',
              'transition-colors duration-(--duration-fast)',
              value === true ? 'bg-accent' : 'bg-overlay',
            )}
          >
            {/* Track 44×24, knob 16 — 4px inset all round, so 20px of travel.
                The offset is inline rather than a translate-x utility: those
                only set a CSS variable that needs a composing `transform`
                utility to take effect, and silently did nothing here. Vertical
                centring rides in the same transform. */}
            <span
              style={{
                transform: `translate(${value === true ? 20 : 0}px, -50%)`,
              }}
              className={cn(
                'absolute top-1/2 left-1 size-4 rounded-full bg-knob shadow-sm',
                'transition-transform duration-(--duration-fast) ease-(--ease-out-soft)',
              )}
            />
          </button>
        ) : field.type === 'slider' ? (
          <input
            id={id}
            type="range"
            value={Number(value)}
            min={field.min ?? 0}
            max={field.max ?? 1}
            step={field.step ?? 0.01}
            aria-describedby={describedBy}
            onChange={(event) => onChange(Number(event.target.value))}
            onBlur={onBlur}
            className="w-full accent-accent"
          />
        ) : field.type === 'select' ? (
          <select
            id={id}
            value={String(value)}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
            className={control}
          >
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={id}
            type={field.type === 'number' ? 'number' : 'text'}
            value={String(value)}
            min={field.min}
            max={field.max}
            step={field.step}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            onChange={(event) =>
              onChange(
                field.type === 'number' ? Number(event.target.value) : event.target.value,
              )
            }
            onBlur={onBlur}
            className={control}
          />
        )}
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-[0.6875rem] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
