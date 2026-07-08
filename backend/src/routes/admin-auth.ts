import { Router } from 'express';

import { isValidAdminLogin } from '../modules/auth/admin-auth.ts';
import { createAdminSession, storeAdminSession } from '../modules/auth/admin-session-repository.ts';

export const adminAuthRouter = Router();

adminAuthRouter.post('/admin/login', (req, res) => {
  try {
    const username = typeof req.body?.username === 'string' ? req.body.username : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!isValidAdminLogin(username, password, process.env)) {
      res.status(401).json({ ok: false });
      return;
    }

    const session = createAdminSession(process.env);
    storeAdminSession(session.token, session.expiresAt, process.env);

    res.json({ ok: true, token: session.token, expiresAt: session.expiresAt });
  } catch {
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});
