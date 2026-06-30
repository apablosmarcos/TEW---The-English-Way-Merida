import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { adminAuthRouter } from './routes/admin-auth.ts';
import { adminLeadsRouter } from './routes/admin-leads.ts';
import { healthRouter } from './routes/health.ts';
import { leadsRouter } from './routes/leads.ts';

const appDir = dirname(fileURLToPath(import.meta.url));
const defaultStaticDir = join(appDir, '../../frontend/dist/tew-frontend/browser');

type CreateAppOptions = {
  staticDir?: string;
};

export function createApp(options: CreateAppOptions = {}) {
  const app = express();
  const staticDir = options.staticDir ?? defaultStaticDir;

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  app.use('/api', healthRouter);
  app.use('/api', leadsRouter);
  app.use('/api', adminAuthRouter);
  app.use('/api', adminLeadsRouter);

  if (existsSync(staticDir)) {
    app.use(express.static(staticDir));
    app.use((request, response, next) => {
      if ((request.method === 'GET' || request.method === 'HEAD') && !request.path.startsWith('/api')) {
        response.sendFile(join(staticDir, 'index.html'));
        return;
      }

      next();
    });
  }

  return app;
}
