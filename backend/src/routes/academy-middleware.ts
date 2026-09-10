import type { Request, RequestHandler } from "express";

import { AcademyAuthError } from "../modules/academy/academy-errors.ts";
import { AuthRepository } from "../modules/academy/auth-repository.ts";
import { AuthService } from "../modules/academy/auth-service.ts";
import type { AcademySession } from "../modules/academy/academy-types.ts";
import { openDatabase } from "../modules/storage/sqlite.ts";

type AcademyAuthContext = { service: AuthService; session: AcademySession };

declare global {
  namespace Express {
    interface Request {
      academyAuth?: AcademyAuthContext;
    }
  }
}

export const academyAuthMiddleware: RequestHandler = (req, res, next) => {
  const token = readBearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });
    return;
  }

  let database: ReturnType<typeof openDatabase> | undefined;
  try {
    database = openDatabase(process.env);
    const service = new AuthService(new AuthRepository(database));
    req.academyAuth = { service, session: service.getSession(token) };
    res.once("finish", () => database?.close());
    next();
  } catch (error) {
    database?.close();
    sendAcademyError(res, error);
  }
};

export const requirePasswordChange: RequestHandler = (req, res, next) => {
  if (req.academyAuth?.session.mustChangePassword) {
    res.status(403).json({ ok: false, error: "PASSWORD_CHANGE_REQUIRED" });
    return;
  }
  next();
};

export const requireAcademyAdmin: RequestHandler = (req, res, next) => {
  if (req.academyAuth?.session.user.role !== "admin") {
    res.status(403).json({ ok: false, error: "FORBIDDEN" });
    return;
  }
  next();
};

export function academyAuth(req: Request) {
  if (!req.academyAuth) throw new Error("Academy authentication middleware is required");
  return req.academyAuth;
}

export function createAcademyAuthService() {
  const database = openDatabase(process.env);
  return { service: new AuthService(new AuthRepository(database)), close: () => database.close() };
}

export function readBearerToken(header: string | undefined) {
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
}

export function sendAcademyError(res: Parameters<RequestHandler>[1], error: unknown) {
  if (error instanceof AcademyAuthError) {
    res.status(401).json({ ok: false, error: error.code });
    return;
  }
  res.status(500).json({ ok: false, error: "Internal server error" });
}
