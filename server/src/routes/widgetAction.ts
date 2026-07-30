import { Router } from 'express';
import { ACTION_LATENCY_MS, FORCE_FAIL_FLAG } from '../constants.js';
import { delay } from '../delay.js';
import { fail, ok } from '../types/api.js';
import {
  WIDGET_ACTIONS,
  type WidgetActionResult,
  type WidgetActionType,
} from '../types/actions.js';

export const widgetActionRouter = Router();

interface ValidationIssue {
  path: string;
  message: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isWidgetAction = (value: unknown): value is WidgetActionType =>
  typeof value === 'string' && (WIDGET_ACTIONS as readonly string[]).includes(value);

/**
 * Per-action payload rules. Mirrors the validation the client runs optimistically,
 * so a request the client accepted is not rejected here for a different reason.
 */
function validatePayload(
  action: WidgetActionType,
  payload: Record<string, unknown>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  switch (action) {
    case 'TOGGLE_ITEM': {
      if (typeof payload['itemId'] !== 'string' || payload['itemId'].length === 0) {
        issues.push({ path: 'payload.itemId', message: 'itemId must be a non-empty string.' });
      }
      if (typeof payload['completed'] !== 'boolean') {
        issues.push({ path: 'payload.completed', message: 'completed must be a boolean.' });
      }
      break;
    }

    case 'SUBMIT_FORM': {
      const values = payload['values'];
      if (!isRecord(values)) {
        issues.push({ path: 'payload.values', message: 'values must be an object of field name to value.' });
        break;
      }
      if (Object.keys(values).length === 0) {
        issues.push({ path: 'payload.values', message: 'values must contain at least one field.' });
      }
      break;
    }

    case 'SORT_TABLE': {
      if (typeof payload['key'] !== 'string' || payload['key'].length === 0) {
        issues.push({ path: 'payload.key', message: 'key must be a non-empty string.' });
      }
      if (payload['direction'] !== 'asc' && payload['direction'] !== 'desc') {
        issues.push({ path: 'payload.direction', message: 'direction must be "asc" or "desc".' });
      }
      break;
    }

    case 'UPDATE_LAYOUT': {
      const order = payload['order'];
      if (!Array.isArray(order) || order.some((id) => typeof id !== 'string')) {
        issues.push({ path: 'payload.order', message: 'order must be an array of widget ids.' });
      }
      break;
    }
  }

  return issues;
}

/**
 * POST /api/widget-action
 *
 * Stateless: validates, waits out a simulated latency window, and confirms what
 * it would have applied. The latency is the point — without it, an optimistic
 * update and a pessimistic one are indistinguishable locally.
 *
 * Sending `__forceFail: true` in the payload returns 503, so the client's
 * rollback path can be demoed on demand.
 */
widgetActionRouter.post('/widget-action', async (req, res, next) => {
  try {
    const body: unknown = req.body;

    if (!isRecord(body)) {
      res.status(400).json(fail('INVALID_BODY', 'Request body must be a JSON object.'));
      return;
    }

    const { widgetId, action, payload } = body;
    const issues: ValidationIssue[] = [];

    if (typeof widgetId !== 'string' || widgetId.length === 0) {
      issues.push({ path: 'widgetId', message: 'widgetId must be a non-empty string.' });
    }

    if (!isWidgetAction(action)) {
      issues.push({
        path: 'action',
        message: `action must be one of: ${WIDGET_ACTIONS.join(', ')}.`,
      });
    }

    // Default to an empty payload so a missing one surfaces as specific field
    // errors rather than a generic "payload required".
    const safePayload = isRecord(payload) ? payload : {};
    if (payload !== undefined && !isRecord(payload)) {
      issues.push({ path: 'payload', message: 'payload must be an object.' });
    }

    if (isWidgetAction(action)) {
      issues.push(...validatePayload(action, safePayload));
    }

    if (issues.length > 0) {
      res
        .status(400)
        .json(fail('INVALID_ACTION', 'Action request failed validation.', issues));
      return;
    }

    // Latency applies to failures too — a rollback that only triggers after an
    // instant response would not exercise the client's in-flight state.
    await delay(ACTION_LATENCY_MS);

    if (safePayload[FORCE_FAIL_FLAG] === true) {
      res
        .status(503)
        .json(
          fail(
            'ACTION_FAILED',
            'The action could not be applied. Please retry.',
          ),
        );
      return;
    }

    // Strip the test-only flag from the echo.
    const { [FORCE_FAIL_FLAG]: _forceFail, ...applied } = safePayload;

    const result: WidgetActionResult = {
      widgetId: widgetId as string,
      action: action as WidgetActionType,
      applied,
      appliedAt: new Date().toISOString(),
      message: 'Action applied.',
    };

    res.json(ok(result));
  } catch (error) {
    next(error);
  }
});
