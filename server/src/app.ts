import express from 'express';
import cors from 'cors';
import { CORS_ORIGINS } from './constants.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { dashboardRouter } from './routes/dashboard.js';
import { ok } from './types/api.js';

/**
 * Builds the Express app. Split from `index.ts` so tests can mount it without
 * binding a port.
 */
export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: CORS_ORIGINS, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json(ok({ status: 'healthy', uptime: process.uptime() }));
  });

  app.use('/api', dashboardRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
