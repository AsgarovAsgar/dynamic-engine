import { Router } from 'express';
import { STREAM_INITIAL_DELAY_MS, STREAM_WIDGET_DELAY_MS } from '../constants.js';
import { buildDashboard } from '../data/scenarios.js';
import { delay } from '../delay.js';
import { openStream, sendFrame } from '../sse.js';
import { fail } from '../types/api.js';

export const dashboardRouter = Router();

const MAX_PROMPT_LENGTH = 500;

/**
 * POST /api/generate-dashboard
 *
 * Streams a dashboard as SSE frames: meta -> widget* -> done.
 *
 * The meta frame lands first and carries a slot per widget (id, type, layout),
 * so the client can render the complete grid of correctly-sized skeletons
 * before any data arrives. Widget frames then fill those reserved holes, which
 * is what keeps cumulative layout shift at zero while streaming.
 */
dashboardRouter.post('/generate-dashboard', async (req, res, next) => {
  try {
    const body: unknown = req.body;
    const prompt =
      typeof body === 'object' && body !== null && 'prompt' in body
        ? (body as { prompt: unknown }).prompt
        : undefined;

    // Validation happens before the stream opens — once headers are sent we
    // can no longer respond with a JSON error envelope.
    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      res
        .status(400)
        .json(fail('INVALID_PROMPT', 'Body must include a non-empty "prompt" string.'));
      return;
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      res
        .status(400)
        .json(
          fail(
            'PROMPT_TOO_LONG',
            `Prompt must be ${MAX_PROMPT_LENGTH} characters or fewer.`,
          ),
        );
      return;
    }

    const dashboard = buildDashboard(prompt.trim());

    openStream(res);

    // Stop work if the client navigates away or aborts mid-stream.
    //
    // This listens on `res`, not `req`: once the JSON body has been consumed,
    // the request stream emits 'close' immediately (~1ms), which would abort
    // every frame before it was ever sent. The response only closes when the
    // socket actually goes away.
    let aborted = false;
    res.on('close', () => {
      aborted = true;
    });

    await delay(STREAM_INITIAL_DELAY_MS);
    if (aborted) return;

    sendFrame(res, {
      event: 'meta',
      dashboardId: dashboard.dashboardId,
      layout: dashboard.layout,
      theme: dashboard.theme,
      meta: dashboard.meta,
      slots: dashboard.widgets.map((widget) => ({
        id: widget.id,
        type: widget.type,
        layout: widget.layout,
      })),
    });

    for (const widget of dashboard.widgets) {
      await delay(STREAM_WIDGET_DELAY_MS);
      if (aborted) return;
      sendFrame(res, { event: 'widget', widget });
    }

    sendFrame(res, {
      event: 'done',
      dashboardId: dashboard.dashboardId,
      widgetCount: dashboard.widgets.length,
    });

    res.end();
  } catch (error) {
    next(error);
  }
});
