import { Router } from 'express';

export const leadsRouter = Router();

leadsRouter.post('/leads', (_req, res) => {
  res.status(201).json({ ok: true });
});
