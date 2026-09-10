import { Router, type Request, type Response } from "express";

import { AcademyUserError } from "../modules/academy/academy-errors.ts";
import { AuditRepository } from "../modules/academy/audit-repository.ts";
import type { AcademyRole, AcademyUserState, UserListOptions } from "../modules/academy/academy-types.ts";
import { UserRepository } from "../modules/academy/user-repository.ts";
import { UserService } from "../modules/academy/user-service.ts";
import { openDatabase } from "../modules/storage/sqlite.ts";
import { academyAuth } from "./academy-middleware.ts";

export function createAcademyAdminUsersRouter() {
  const router = Router();

  router.get("/", (req, res) => {
    const options = readListOptions(req.query);
    if (!options) return validationError(res);
    return withUsers(req, res, (service) => {
      const result = service.list(options);
      res.json({ ok: true, data: { items: result.items, pagination: { page: result.page, pageSize: result.pageSize, total: result.total, pageCount: Math.ceil(result.total / result.pageSize) } } });
    });
  });

  router.post("/", async (req, res) => {
    const input = readCreateInput(req.body);
    if (!input) return validationError(res);
    return withUsers(req, res, async (service) => {
      const { temporaryPassword, ...user } = await service.createParent(academyAuth(req).session.user.id, input);
      res.status(201).set("Cache-Control", "no-store").json({ ok: true, data: { user, temporaryPassword } });
    });
  });

  router.get("/:id", (req, res) => withId(req, res, (id) => withUsers(req, res, (service) => {
    res.json({ ok: true, data: service.get(id) });
  })));

  router.patch("/:id", (req, res) => {
    if (!readDisableInput(req.body)) return validationError(res);
    return withId(req, res, (id) => withUsers(req, res, (service) => {
      res.json({ ok: true, data: service.disable(academyAuth(req).session.user.id, id) });
    }));
  });

  router.delete("/:id", (req, res) => withId(req, res, (id) => withUsers(req, res, (service) => {
    service.delete(academyAuth(req).session.user.id, id);
    res.status(204).end();
  })));

  router.post("/:id/enable", (req, res) => withId(req, res, (id) => withUsers(req, res, (service) => {
    service.enable(academyAuth(req).session.user.id, id);
    res.status(204).end();
  })));

  router.post("/:id/reset-password", async (req, res) => withId(req, res, (id) => withUsers(req, res, async (service) => {
    const { temporaryPassword } = await service.resetPassword(academyAuth(req).session.user.id, id);
    res.set("Cache-Control", "no-store").json({ ok: true, data: { temporaryPassword } });
  })));

  return router;
}

async function withUsers(req: Request, res: Response, action: (service: UserService) => void | Promise<void>) {
  let database: ReturnType<typeof openDatabase> | undefined;
  try {
    database = openDatabase(process.env);
    await action(new UserService(new UserRepository(database), new AuditRepository(database)));
  } catch (error) {
    sendUserError(res, error);
  } finally {
    database?.close();
  }
}

function withId(req: Request, res: Response, action: (id: string) => void | Promise<void>) {
  const id = req.params.id;
  if (!uuid(id)) return validationError(res);
  return action(id);
}

function readListOptions(query: Request["query"]): UserListOptions | null {
  const page = integer(query.page, Number.MAX_SAFE_INTEGER);
  const pageSize = integer(query.pageSize, 100);
  const search = string(query.search);
  const role = query.role === undefined ? undefined : roleValue(query.role);
  const state = query.state === undefined ? undefined : stateValue(query.state);
  if (page === null || pageSize === null || search === null || role === null || state === null) return null;
  return { page, pageSize, search, role, state };
}

function readCreateInput(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const input = body as Record<string, unknown>;
  if (Object.keys(input).length !== 2 || typeof input.displayName !== "string" || typeof input.username !== "string") return null;
  const displayName = input.displayName.trim();
  const username = input.username.trim().normalize("NFC");
  if (!displayName || !/^[a-z0-9._-]{4,30}$/.test(username)) return null;
  return { displayName, username };
}

function readDisableInput(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  const input = body as Record<string, unknown>;
  return Object.keys(input).length === 1 && input.disabled === true;
}

function integer(value: unknown, maximum: number) {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number <= maximum ? number : null;
}

function string(value: unknown) { return value === undefined ? undefined : typeof value === "string" ? value : null; }
function roleValue(value: unknown): AcademyRole | null { return value === "parent" || value === "admin" ? value : null; }
function stateValue(value: unknown): AcademyUserState | null { return value === "active" || value === "disabled" || value === "deleted" ? value : null; }
function uuid(value: unknown): value is string { return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
function validationError(res: Response) { res.status(400).json({ ok: false, error: "VALIDATION_ERROR" }); }

function sendUserError(res: Response, error: unknown) {
  if (error instanceof AcademyUserError) {
    res.status(error.code === "USER_NOT_FOUND" || error.code === "USER_DELETED" ? 404 : 409).json({ ok: false, error: error.code });
    return;
  }
  res.status(500).json({ ok: false, error: "Internal server error" });
}
