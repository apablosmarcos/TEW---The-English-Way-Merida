import { Router } from 'express';

import { createAdminToken, isValidAdminLogin } from '../modules/auth/admin-auth.ts';

export const adminAuthRouter = Router();

adminAuthRouter.post('/admin/login', (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!isValidAdminLogin(username, password, process.env)) {
    res.status(401).json({ ok: false });
    return;
  }

  res.json({ ok: true, token: createAdminToken(process.env) });
});
