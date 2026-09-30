import { randomUUID } from 'node:crypto';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { getTrustProxyHops } from './config/env.ts';
import { academyErrorBody } from './modules/academy/academy-errors.ts';
import { createAcademyRouter } from './routes/academy-router.ts';
import { healthRouter } from './routes/health.ts';

export function createApp() {
  const app = express();

  app.set('trust proxy', getTrustProxyHops());
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use((_req, res, next) => {
    res.locals.requestId = randomUUID();
    res.set('X-Request-Id', res.locals.requestId);
    next();
  });
  app.use(morgan(':method :status :response-time ms request_id=:res[x-request-id]'));

  app.get('/', (_req, res) => {
    res.json({
      ok: true,
      service: 'tew-backend',
      health: '/api/health',
    });
  });

  app.use('/api', healthRouter);
  app.use('/api/academy', createAcademyRouter());
  app.use((error: { type?: string }, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api/academy/') && error.type === 'entity.parse.failed') {
      res.status(400).json(academyErrorBody('VALIDATION_ERROR'));
      return;
    }
    next(error);
  });

  return app;
}
