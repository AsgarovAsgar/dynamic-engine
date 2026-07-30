import type { FormField } from '@/types/widgets';

export type FieldValue = string | number | boolean;

/**
 * Interprets the schema's declarative validation rules.
 *
 * Rules arrive as data (min, max, pattern, message) and are applied here — no
 * code is ever sent from the server. These checks intentionally mirror the
 * server's own: if the client accepts a value the server then rejects, the user
 * sees a rollback that looks like a bug.
 */
export function validateField(field: FormField, value: FieldValue): string | null {
  const rules = field.validation;
  if (!rules) return null;

  const isEmpty =
    value === '' || value === null || value === undefined;

  if (rules.required && isEmpty) {
    return rules.message ?? `${field.label} is required.`;
  }

  // Nothing further to check on an empty optional field.
  if (isEmpty) return null;

  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      return rules.message ?? `${field.label} must be at least ${rules.min}.`;
    }
    if (rules.max !== undefined && value > rules.max) {
      return rules.message ?? `${field.label} must be at most ${rules.max}.`;
    }
  }

  if (typeof value === 'string') {
    if (rules.minLength !== undefined && value.length < rules.minLength) {
      return rules.message ?? `${field.label} must be at least ${rules.minLength} characters.`;
    }
    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      return rules.message ?? `${field.label} must be at most ${rules.maxLength} characters.`;
    }
    if (rules.pattern) {
      try {
        if (!new RegExp(rules.pattern, 'u').test(value)) {
          return rules.message ?? `${field.label} is not in the expected format.`;
        }
      } catch {
        // A malformed pattern from the server must not break the form.
        console.warn(`[form] invalid pattern for field "${field.name}"`);
      }
    }
  }

  return null;
}

export function validateAll(
  fields: FormField[],
  values: Record<string, FieldValue>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const value = values[field.name];
    if (value === undefined) continue;
    const error = validateField(field, value);
    if (error) errors[field.name] = error;
  }

  return errors;
}
