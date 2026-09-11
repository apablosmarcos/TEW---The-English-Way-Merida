import { Router, type Request, type Response } from "express";

import type { PostEditInput, PostInput, PublicationVisibility } from "../modules/academy/academy-types.ts";
import { academyAuth } from "./academy-middleware.ts";
import { uuid, validationError, withId, withPublications } from "./academy-posts.ts";

export function createAcademyAdminCategoriesRouter() {
  const router = Router();
  router.get("/", (_req, res) => withPublications(res, (service) => { res.json({ ok: true, data: { items: service.listCategories() } }); }));
  router.post("/", (req, res) => {
    const input = categoryInput(req.body);
    if (!input) { validationError(res); return; }
    return withPublications(res, (service) => { res.status(201).json({ ok: true, data: service.createCategory(academyAuth(req).session.user.id, input) }); });
  });
  router.patch("/:id", (req, res) => {
    const input = categoryInput(req.body);
    if (!input) { validationError(res); return; }
    return withId(req, res, (id) => withPublications(res, (service) => { res.json({ ok: true, data: service.updateCategory(academyAuth(req).session.user.id, id, input) }); }));
  });
  router.delete("/:id", (req, res) => withId(req, res, (id) => withPublications(res, (service) => { service.deleteCategory(academyAuth(req).session.user.id, id); res.status(204).end(); })));
  return router;
}

export function createAcademyAdminPostsRouter() {
  const router = Router();
  router.get("/", (req, res) => {
    const status = readStatus(req.query.status);
    if (status === null) { validationError(res); return; }
    return withPublications(res, (service) => { res.json({ ok: true, data: { items: service.listAdminPosts().filter((post) => !status || post.visibility === status) } }); });
  });
  router.post("/", (req, res) => {
    const input = postInput(req.body, true);
    if (!input) { validationError(res); return; }
    return withPublications(res, (service) => { res.status(201).json({ ok: true, data: service.createPost(academyAuth(req).session.user.id, input) }); });
  });
  router.get("/:id", (req, res) => withId(req, res, (id) => withPublications(res, (service) => {
    const post = service.getAdminPost(id);
    if (!post) { res.status(404).json({ ok: false, error: "POST_NOT_FOUND" }); return; }
    res.json({ ok: true, data: post });
  })));
  router.patch("/:id", (req, res) => {
    const input = postInput(req.body, false);
    if (!input) { validationError(res); return; }
    return withId(req, res, (id) => withPublications(res, (service) => { res.json({ ok: true, data: service.editPost(academyAuth(req).session.user.id, id, input) }); }));
  });
  router.post("/:id/:action", (req, res) => withId(req, res, (id) => {
    const action = req.params.action;
    if (action !== "show" && action !== "hide") { res.status(404).end(); return; }
    return withPublications(res, (service) => { res.json({ ok: true, data: action === "show" ? service.showPost(academyAuth(req).session.user.id, id) : service.hidePost(academyAuth(req).session.user.id, id) }); });
  }));
  router.delete("/:id", (req, res) => withId(req, res, (id) => withPublications(res, (service) => { service.deletePost(academyAuth(req).session.user.id, id); res.status(204).end(); })));
  return router;
}

function categoryInput(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const data = body as Record<string, unknown>;
  return Object.keys(data).length === 1 && typeof data.displayName === "string" && data.displayName.trim() ? { displayName: data.displayName } : null;
}

function postInput(body: unknown, create: true): PostInput | null;
function postInput(body: unknown, create: false): PostEditInput | null;
function postInput(body: unknown, create: boolean): PostInput | PostEditInput | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const data = body as Record<string, unknown>, keys = Object.keys(data);
  if (!keys.length || keys.some((key) => key !== "title" && key !== "markdownSource" && key !== "categoryId") || (create && (!Object.hasOwn(data, "title") || !Object.hasOwn(data, "markdownSource")))) return null;
  if (data.title !== undefined && (typeof data.title !== "string" || !data.title.trim())) return null;
  if (data.markdownSource !== undefined && typeof data.markdownSource !== "string") return null;
  if (data.categoryId !== undefined && data.categoryId !== null && !uuid(data.categoryId)) return null;
  return data as PostInput | PostEditInput;
}

function readStatus(value: unknown): PublicationVisibility | undefined | null { return value === undefined ? undefined : value === "visible" || value === "hidden" || value === "deleted" ? value : null; }
