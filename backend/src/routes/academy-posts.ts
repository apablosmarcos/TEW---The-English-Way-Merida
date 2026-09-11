import { Router, type Request, type Response } from "express";

import { AcademyPublicationError } from "../modules/academy/academy-errors.ts";
import { AuditRepository } from "../modules/academy/audit-repository.ts";
import type { PublicationListOptions } from "../modules/academy/academy-types.ts";
import { PublicationRepository } from "../modules/academy/publication-repository.ts";
import { PublicationService } from "../modules/academy/publication-service.ts";
import { openDatabase } from "../modules/storage/sqlite.ts";

export function createAcademyPostsRouter() {
  const router = Router();
  router.get("/", (req, res) => {
    const options = listOptions(req.query);
    if (!options) return validationError(res);
    return withPublications(res, (service) => {
      const result = service.listParentPosts(options);
      res.json({ ok: true, data: { items: result.items, pagination: { page: result.page, pageSize: result.pageSize, total: result.total, pageCount: Math.ceil(result.total / result.pageSize) } } });
    });
  });
  router.get("/:id", (req, res) => withId(req, res, (id) => withPublications(res, (service) => {
    const post = service.getParentPost(id);
    if (!post) { notFound(res); return; }
    res.json({ ok: true, data: post });
  })));
  return router;
}

export function withPublications(res: Response, action: (service: PublicationService) => void | Promise<void>) {
  let database: ReturnType<typeof openDatabase> | undefined;
  return Promise.resolve().then(async () => {
    try {
      database = openDatabase(process.env);
      await action(new PublicationService(new PublicationRepository(database), new AuditRepository(database)));
    } catch (error) {
      sendPublicationError(res, error);
    } finally {
      database?.close();
    }
  });
}

export function withId(req: Request, res: Response, action: (id: string) => void | Promise<void>) {
  return uuid(req.params.id) ? action(req.params.id) : validationError(res);
}

export function uuid(value: unknown): value is string { return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
export function validationError(res: Response) { return res.status(400).json({ ok: false, error: "VALIDATION_ERROR" }); }
export function notFound(res: Response) { return res.status(404).json({ ok: false, error: "POST_NOT_FOUND" }); }

function listOptions(query: Request["query"]): PublicationListOptions | null {
  const page = integer(query.page, Number.MAX_SAFE_INTEGER), pageSize = integer(query.pageSize, 100);
  const search = string(query.search), categoryId = query.categoryId === undefined ? undefined : uuid(query.categoryId) ? query.categoryId : null;
  return page === null || pageSize === null || search === null || categoryId === null ? null : { page, pageSize, search, categoryId };
}
function integer(value: unknown, maximum: number) { if (value === undefined) return undefined; if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null; const number = Number(value); return Number.isSafeInteger(number) && number <= maximum ? number : null; }
function string(value: unknown) { return value === undefined ? undefined : typeof value === "string" ? value : null; }

export function sendPublicationError(res: Response, error: unknown) {
  if (error instanceof AcademyPublicationError) {
    const status = error.code === "CATEGORY_NAME_TAKEN" || error.code === "CATEGORY_IN_USE" ? 409 : 404;
    res.status(status).json({ ok: false, error: error.code });
    return;
  }
  res.status(500).json({ ok: false, error: "Internal server error" });
}
