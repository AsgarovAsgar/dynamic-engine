import type { ErrorRequestHandler, RequestHandler } from 'express';
import { fail } from '../types/api.js';

/** Thrown by routes to short-circuit with a specific status and code. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFound: RequestHandler = (req, res) => {
  res
    .status(404)
    .json(fail('NOT_FOUND', `No route matches ${req.method} ${req.path}`));
};

/**
 * Terminal error handler. Express needs all four parameters to recognize this
 * as an error middleware, so `next` stays even though it is unused.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (res.headersSent) {
    // A stream already started; destroy rather than emit a broken frame.
    res.end();
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json(fail(err.code, err.message));
    return;
  }

  const message = err instanceof Error ? err.message : 'Unknown error';
  console.error('[unhandled]', err);
  res.status(500).json(fail('INTERNAL_ERROR', message));
};
