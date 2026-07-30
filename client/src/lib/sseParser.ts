/**
 * Minimal SSE frame parser for `fetch` response bodies.
 *
 * The browser's EventSource cannot issue POST requests, and the dashboard
 * endpoint takes a prompt in the body — so the stream is consumed manually.
 *
 * Frames are separated by a blank line. A chunk boundary can land anywhere,
 * including mid-field, so the buffer keeps whatever follows the last complete
 * separator and prepends it to the next chunk.
 */

export interface SseFrame {
  event: string;
  data: string;
}

export function createSseParser() {
  let buffer = '';

  return {
    /** Feeds a chunk and returns whatever complete frames it produced. */
    push(chunk: string): SseFrame[] {
      buffer += chunk;
      const frames: SseFrame[] = [];

      let separator = buffer.indexOf('\n\n');
      while (separator !== -1) {
        const raw = buffer.slice(0, separator);
        buffer = buffer.slice(separator + 2);

        const frame = parseFrame(raw);
        if (frame) frames.push(frame);

        separator = buffer.indexOf('\n\n');
      }

      return frames;
    },

    /** Flushes a trailing frame if the stream ended without a blank line. */
    flush(): SseFrame | null {
      if (buffer.trim().length === 0) return null;
      const frame = parseFrame(buffer);
      buffer = '';
      return frame;
    },
  };
}

function parseFrame(raw: string): SseFrame | null {
  let event = 'message';
  const dataLines: string[] = [];

  for (const line of raw.split('\n')) {
    if (line.startsWith(':')) continue; // comment / keep-alive
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0) return null;
  return { event, data: dataLines.join('\n') };
}
