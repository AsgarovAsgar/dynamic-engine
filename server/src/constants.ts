export const PORT = 4000;

/** Vite and Next dev server origins. */
export const CORS_ORIGINS = ['http://localhost:5173', 'http://localhost:3000'];

/** Pause before the first stream frame, simulating LLM latency. */
export const STREAM_INITIAL_DELAY_MS = 320;

/** Gap between widget frames, so streaming is visible without dragging. */
export const STREAM_WIDGET_DELAY_MS = 240;

/** Latency on /api/widget-action, so optimistic updates are observable. */
export const ACTION_LATENCY_MS = 450;

/**
 * Probability an action fails, exercising the client's rollback path.
 * Bump to ~0.3 when demoing rollback.
 */
export const ACTION_FAILURE_RATE = 0;
