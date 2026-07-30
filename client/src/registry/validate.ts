import { WIDGET_TYPES, type Widget, type WidgetType } from '@/types/widgets';

/**
 * Runtime payload validation.
 *
 * The error boundary catches render-time throws, but a missing field usually
 * surfaces as `undefined.map is not a function` deep inside a component —
 * technically caught, yet useless to the user and to whoever debugs it.
 * Validating up front turns that into a precise, actionable fallback.
 *
 * Deliberately structural, not exhaustive: it checks what a component would
 * crash on, not every field's type. Over-validating would reject payloads that
 * render perfectly well.
 */

export type ValidationResult =
  | { valid: true; widget: Widget }
  | { valid: false; reason: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isWidgetType = (value: unknown): value is WidgetType =>
  typeof value === 'string' && (WIDGET_TYPES as readonly string[]).includes(value);

/** Fields every widget needs regardless of archetype. */
function validateEnvelope(value: unknown): string | null {
  if (!isRecord(value)) return 'Payload is not an object.';
  if (typeof value['id'] !== 'string' || value['id'].length === 0) {
    return 'Widget is missing an id.';
  }
  if (!isWidgetType(value['type'])) {
    return `Unknown widget type "${String(value['type'])}".`;
  }
  if (typeof value['title'] !== 'string') {
    return 'Widget is missing a title.';
  }
  if (!isRecord(value['data'])) {
    return 'Widget has no data payload.';
  }
  return null;
}

/** Only the fields whose absence would crash the corresponding component. */
function validateData(type: WidgetType, data: Record<string, unknown>): string | null {
  switch (type) {
    case 'METRIC_CARD': {
      if (typeof data['value'] !== 'string' && typeof data['value'] !== 'number') {
        return 'Metric card has no value.';
      }
      if (data['sparkline'] !== undefined && !Array.isArray(data['sparkline'])) {
        return 'Sparkline must be an array of numbers.';
      }
      return null;
    }

    case 'DATA_TABLE': {
      if (!Array.isArray(data['columns']) || data['columns'].length === 0) {
        return 'Table has no columns.';
      }
      if (!Array.isArray(data['rows'])) {
        return 'Table rows must be an array.';
      }
      const badColumn = data['columns'].some(
        (column) => !isRecord(column) || typeof column['key'] !== 'string',
      );
      if (badColumn) return 'Every table column needs a key.';
      return null;
    }

    case 'DYNAMIC_FORM': {
      if (!Array.isArray(data['fields']) || data['fields'].length === 0) {
        return 'Form has no fields.';
      }
      const badField = data['fields'].some(
        (field) =>
          !isRecord(field) ||
          typeof field['name'] !== 'string' ||
          typeof field['type'] !== 'string',
      );
      if (badField) return 'Every form field needs a name and type.';
      return null;
    }

    case 'ACTION_LIST': {
      if (!Array.isArray(data['items'])) return 'Action list has no items.';
      const badItem = data['items'].some(
        (item) => !isRecord(item) || typeof item['id'] !== 'string',
      );
      if (badItem) return 'Every action item needs an id.';
      return null;
    }

    case 'DISTRIBUTION_CHART': {
      if (!Array.isArray(data['bins']) || data['bins'].length === 0) {
        return 'Chart has no bins.';
      }
      const badBin = data['bins'].some(
        (bin) => !isRecord(bin) || typeof bin['value'] !== 'number',
      );
      if (badBin) return 'Every chart bin needs a numeric value.';
      return null;
    }

    case 'NARRATIVE_HEADLINE': {
      if (typeof data['headline'] !== 'string' || data['headline'].length === 0) {
        return 'Headline is empty.';
      }
      return null;
    }
  }
}

export function validateWidget(value: unknown): ValidationResult {
  const envelopeError = validateEnvelope(value);
  if (envelopeError) return { valid: false, reason: envelopeError };

  // validateEnvelope has established the shape; this cast is checked, not blind.
  const candidate = value as { type: WidgetType; data: Record<string, unknown> };

  const dataError = validateData(candidate.type, candidate.data);
  if (dataError) return { valid: false, reason: dataError };

  return { valid: true, widget: value as Widget };
}
