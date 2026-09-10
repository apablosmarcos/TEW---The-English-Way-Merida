import { Router, type RequestHandler } from "express";

import { LoginLimiter } from "../modules/academy/login-limiter.ts";
import { academyAuth, academyAuthMiddleware, createAcademyAuthService, sendAcademyError } from "./academy-middleware.ts";

export function createAcademyRouter() {
  const router = Router();
  const limiter = new LoginLimiter();

  router.post("/login", async (req, res) => {
    res.set("Cache-Control", "no-store");
    if (!limiter.attempt(req.ip ?? req.socket.remoteAddress ?? "unknown")) {
      res.set("Retry-After", "900").status(429).json({ ok: false, error: "TOO_MANY_REQUESTS" });
      return;
    }

    let close: (() => void) | undefined;
    try {
      const context = createAcademyAuthService();
      close = context.close;
      const username = typeof req.body?.username === "string" ? req.body.username : "";
      const password = typeof req.body?.password === "string" ? req.body.password : "";
      const login = await context.service.login(username, password);
      res.json({ ok: true, ...login });
    } catch (error) {
      sendAcademyError(res, error);
    } finally {
      close?.();
    }
  });

  router.get("/session", academyAuthMiddleware, (req, res) => {
    const { session } = academyAuth(req);
    res.json({ ok: true, user: session.user, mustChangePassword: session.mustChangePassword });
  });

  router.post("/logout", academyAuthMiddleware, (req, res) => {
    try {
      academyAuth(req).service.logout(readBearerToken(req.headers.authorization));
      res.json({ ok: true });
    } catch (error) {
      sendAcademyError(res, error);
    }
  });

  router.post("/me/password", noStore, academyAuthMiddleware, async (req, res) => {
    const input = readPasswordInput(req.body);
    if (!input) {
      res.status(400).json({ ok: false, error: "INVALID_PASSWORD_CHANGE" });
      return;
    }

    try {
      const { service } = academyAuth(req);
      await service.changeOwnPassword(readBearerToken(req.headers.authorization), input.currentPassword, input.newPassword);
      res.json({ ok: true });
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

function readPasswordInput(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const data = input as Record<string, unknown>;
  if (typeof data.currentPassword !== "string" || typeof data.newPassword !== "string" || !data.newPassword) return null;
  return { currentPassword: data.currentPassword, newPassword: data.newPassword };
}
