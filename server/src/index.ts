import { createApp } from './app.js';
import { PORT } from './constants.js';

const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`[dynamic-engine] server listening on http://localhost:${PORT}`);
});

/** Streaming responses hold sockets open; close them deliberately on shutdown. */
const shutdown = (signal: string) => () => {
  console.log(`[dynamic-engine] ${signal} received, shutting down`);
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown('SIGINT'));
process.on('SIGTERM', shutdown('SIGTERM'));
