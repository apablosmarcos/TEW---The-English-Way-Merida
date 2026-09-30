import type { Request, RequestHandler, Response } from "express";

import { academyErrorBody, type AcademyHttpErrorCode, AcademyAuthError } from "../modules/academy/academy-errors.ts";
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

export function createAcademyAuthMiddleware(open: typeof openDatabase = openDatabase): RequestHandler {
  return (req, res, next) => {
    const token = readBearerToken(req.headers.authorization);
    if (!token) {
      sendAcademyHttpError(res, 401, "AUTHENTICATION_REQUIRED");
      return;
    }

    let database: ReturnType<typeof openDatabase> | undefined;
    let closed = false;
    const close = () => {
      if (!database || closed) return;
      closed = true;
      database.close();
    };
    try {
      database = open(process.env);
      const service = new AuthService(new AuthRepository(database));
      req.academyAuth = { service, session: service.getSession(token) };
      res.once("finish", close);
      res.once("close", close);
      next();
    } catch (error) {
      close();
      sendAcademyError(res, error);
    }
  };
}

export const academyAuthMiddleware = createAcademyAuthMiddleware();

export const requirePasswordChange: RequestHandler = (req, res, next) => {
  if (req.academyAuth?.session.mustChangePassword) {
    sendAcademyHttpError(res, 403, "PASSWORD_CHANGE_REQUIRED");
    return;
  }
  next();
};

export const requireAcademyAdmin: RequestHandler = (req, res, next) => {
  if (req.academyAuth?.session.user.role !== "admin") {
    sendAcademyHttpError(res, 403, "FORBIDDEN");
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

export function sendAcademyHttpError(res: Response, status: number, code: AcademyHttpErrorCode) {
  res.status(status).json(academyErrorBody(code));
}

export function sendAcademyError(res: Response, error: unknown) {
  if (error instanceof AcademyAuthError) {
    sendAcademyHttpError(res, 401, error.code);
    return;
  }
  logAcademyError(res, error);
  sendAcademyHttpError(res, 500, "INTERNAL_ERROR");
}

export function logAcademyError(res: Response, error: unknown) {
  const candidate = (error as { code?: unknown } | null)?.code;
  const errorCode = typeof candidate === "string" && /^[A-Z0-9_]{1,40}$/.test(candidate) ? candidate : "UNKNOWN";
  console.error(JSON.stringify({ event: "academy_request_failed", requestId: res.locals.requestId ?? "unknown", errorCode }));
}
