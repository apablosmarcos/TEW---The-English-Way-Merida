import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { adminAuthRouter } from './routes/admin-auth.ts';
import { adminLeadsRouter } from './routes/admin-leads.ts';
import { healthRouter } from './routes/health.ts';
import { leadsRouter } from './routes/leads.ts';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  app.use('/api', healthRouter);
  app.use('/api', leadsRouter);
  app.use('/api', adminAuthRouter);
  app.use('/api', adminLeadsRouter);

  return app;
}
