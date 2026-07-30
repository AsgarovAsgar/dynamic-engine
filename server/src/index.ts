import { createApp } from './app.js';
import { PORT } from './constants.js';

const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`[dynamic-engine] server listening on http://localhost:${PORT}`);
});

/**
 * SSE responses stay open indefinitely, so `server.close()` alone never
 * settles — it waits on connections that are designed not to end. That stalls
 * every `tsx watch` restart until it force-kills at 5s. Destroy open sockets
 * explicitly, and keep a timer as a backstop.
 */
let shuttingDown = false;

const shutdown = (signal: string) => () => {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`[dynamic-engine] ${signal} received, shutting down`);

  server.close(() => {
    clearTimeout(forceExit);
    process.exit(0);
  });

  // Drop keep-alive and streaming sockets so `close` can complete.
  server.closeAllConnections();

  const forceExit = setTimeout(() => {
    console.warn('[dynamic-engine] forced exit after 3s');
    process.exit(1);
  }, 3000);
  forceExit.unref();
};

process.on('SIGINT', shutdown('SIGINT'));
process.on('SIGTERM', shutdown('SIGTERM'));
