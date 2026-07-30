import type { Response } from 'express';
import type { StreamFrame } from './types/widgets.js';

/**
 * Opens an SSE stream. `X-Accel-Buffering` stops nginx-style proxies from
 * buffering frames, which would defeat the point of streaming.
 */
export function openStream(res: Response): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
}

/**
 * Writes one frame. The `event:` line lets the client dispatch on frame type
 * without inspecting the payload; `data` is always a single line of JSON, so
 * no multi-line escaping is needed.
 */
export function sendFrame(res: Response, frame: StreamFrame): void {
  res.write(`event: ${frame.event}\ndata: ${JSON.stringify(frame)}\n\n`);
}
