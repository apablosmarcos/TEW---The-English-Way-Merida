import { Router, type RequestHandler } from "express";

import { LoginLimiter } from "../modules/academy/login-limiter.ts";
import type { AcademyHttpLogin, AcademyHttpSession, AcademyLogin, AcademySession } from "../modules/academy/academy-types.ts";
import { academyAuth, academyAuthMiddleware, createAcademyAuthService, sendAcademyError, sendAcademyHttpError } from "./academy-middleware.ts";

export function createAcademyRouter() {
  const router = Router();
  const limiter = new LoginLimiter();

  router.post("/login", async (req, res) => {
    res.set("Cache-Control", "no-store");
    if (!limiter.attempt(req.ip ?? req.socket.remoteAddress ?? "unknown")) {
      res.set("Retry-After", "900");
      sendAcademyHttpError(res, 429, "RATE_LIMITED");
      return;
    }

    let close: (() => void) | undefined;
    try {
      const context = createAcademyAuthService();
      close = context.close;
      const username = typeof req.body?.username === "string" ? req.body.username : "";
      const password = typeof req.body?.password === "string" ? req.body.password : "";
      const login = await context.service.login(username, password);
      res.json({ ok: true, data: loginView(login) });
    } catch (error) {
      sendAcademyError(res, error);
    } finally {
      close?.();
    }
  });

  router.get("/session", academyAuthMiddleware, (req, res) => {
    const { session } = academyAuth(req);
    res.json({ ok: true, data: sessionView(session) });
  });

  router.post("/logout", academyAuthMiddleware, (req, res) => {
    try {
      academyAuth(req).service.logout(readBearerToken(req.headers.authorization));
      res.status(204).end();
    } catch (error) {
      sendAcademyError(res, error);
    }
  });

  router.post("/me/password", noStore, academyAuthMiddleware, async (req, res) => {
    const input = readPasswordInput(req.body);
    if (!input) {
      sendAcademyHttpError(res, 400, "VALIDATION_ERROR");
      return;
    }

    try {
      const { service } = academyAuth(req);
      await service.changeOwnPassword(readBearerToken(req.headers.authorization), input.currentPassword, input.newPassword);
      res.status(204).end();
    } catch (error) {
      sendAcademyError(res, error);
    }
  });

  return router;
}

const noStore: RequestHandler = (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
};

function readBearerToken(header: string | undefined) {
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
}

function loginView(login: AcademyLogin): AcademyHttpLogin {
  return { token: login.token, ...sessionView(login) };
}

function sessionView(session: AcademySession): AcademyHttpSession {
  const { id: _id, ...user } = session.user;
  return { expiresAt: session.expiresAt, user: { ...user, mustChangePassword: session.mustChangePassword } };
}

function readPasswordInput(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const data = input as Record<string, unknown>;
  if (typeof data.currentPassword !== "string" || typeof data.newPassword !== "string" || !data.newPassword) return null;
  return { currentPassword: data.currentPassword, newPassword: data.newPassword };
}
