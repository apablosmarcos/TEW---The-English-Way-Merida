import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import Busboy from "busboy";
import { Router, type Request, type Response } from "express";

import { academyErrorBody, AttachmentError } from "../modules/academy/academy-errors.ts";
import { AttachmentRepository } from "../modules/academy/attachment-repository.ts";
import { AttachmentService } from "../modules/academy/attachment-service.ts";
import { AuditRepository } from "../modules/academy/audit-repository.ts";
import { FileStorage, MAX_ATTACHMENT_BYTES } from "../modules/academy/file-storage.ts";
import { openDatabase, resolveFileStoragePath } from "../modules/storage/sqlite.ts";
import { academyAuth, logAcademyError } from "./academy-middleware.ts";
import { uuid } from "./academy-posts.ts";

export function createAcademyAttachmentsRouter() {
  const router = Router();
  router.post("/:id/attachments", async (req, res) => {
    if (!uuid(req.params.id)) { sendError(res, new AttachmentError("VALIDATION_ERROR")); return; }
    const storage = new FileStorage(resolveFileStoragePath(process.env));
    try {
      const input = await parseUpload(req, storage);
      const database = openDatabase(process.env);
      try {
        const service = new AttachmentService(new AttachmentRepository(database), new AuditRepository(database), storage);
        res.status(201).json({ ok: true, data: await service.upload(academyAuth(req).session.user.id, req.params.id, input) });
      } finally { database.close(); }
    } catch (error) { sendError(res, error); }
  });
  return router;
}

export function createAcademyAttachmentStreamsRouter() {
  const router = Router();
  router.get("/:id/preview", streamAttachment("inline"));
  router.get("/:id/download", streamAttachment("attachment"));
  return router;
}

function streamAttachment(disposition: "inline" | "attachment") {
  return async (req: Request, res: Response) => {
    if (!uuid(req.params.id)) { sendError(res, new AttachmentError("VALIDATION_ERROR")); return; }
    let database: ReturnType<typeof openDatabase> | undefined;
    try {
      database = openDatabase(process.env);
      const attachment = new AttachmentRepository(database).streamable(req.params.id, academyAuth(req).session.user.role === "admin");
      if (!attachment) { sendError(res, new AttachmentError("ATTACHMENT_NOT_FOUND")); return; }
      const storage = new FileStorage(resolveFileStoragePath(process.env)), path = storage.finalPath(attachment.storageId, attachment.extension);
      if (!await storage.existsPath(path)) { sendError(res, new Error("Attachment file is unavailable")); return; }
      res.set({ "Content-Type": attachmentMimeType(attachment.extension), "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store", "Content-Disposition": `${disposition}; filename="${attachmentFilename(attachment.visibleTitle, attachment.materialOrdinal, attachment.extension)}"` });
      createReadStream(path).on("error", () => res.destroy()).pipe(res);
    } catch (error) { if (!res.headersSent) sendError(res, error); else res.destroy(); }
    finally { database?.close(); }
  };
}

function attachmentMimeType(extension: "pdf" | "jpg" | "png" | "webp") {
  return extension === "pdf" ? "application/pdf" : extension === "jpg" ? "image/jpeg" : extension === "png" ? "image/png" : "image/webp";
}

function attachmentFilename(title: string | null, ordinal: number, extension: "pdf" | "jpg" | "png" | "webp") {
  const safeTitle = title?.normalize("NFKD").replace(/[^\x20-\x7e]/g, "").replace(/[^A-Za-z0-9 ._-]+/g, " ").replace(/\s+/g, " ").trim() || `Material ${ordinal}`;
  return safeTitle.toLowerCase().endsWith(`.${extension}`) ? safeTitle : `${safeTitle}.${extension}`;
}

export function createAcademyAttachmentLifecycleRouter() {
  const router = Router();
  router.patch("/:id", (req, res) => {
    const title = renameTitle(req.body);
    if (!uuid(req.params.id) || title === null) { sendError(res, new AttachmentError("VALIDATION_ERROR")); return; }
    return withAttachments(res, (service) => { res.json({ ok: true, data: service.rename(academyAuth(req).session.user.id, req.params.id, { title }) }); });
  });
  router.delete("/:id", (req, res) => {
    if (!uuid(req.params.id)) { sendError(res, new AttachmentError("VALIDATION_ERROR")); return; }
    return withAttachments(res, (service) => { service.delete(academyAuth(req).session.user.id, req.params.id); res.status(204).end(); });
  });
  return router;
}

function withAttachments(res: Response, action: (service: AttachmentService) => void) {
  let database: ReturnType<typeof openDatabase> | undefined;
  return Promise.resolve().then(() => {
    try { database = openDatabase(process.env); action(new AttachmentService(new AttachmentRepository(database), new AuditRepository(database), new FileStorage(resolveFileStoragePath(process.env)))); }
    catch (error) { sendError(res, error); }
    finally { database?.close(); }
  });
}

function renameTitle(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const data = body as Record<string, unknown>;
  return Object.keys(data).length === 1 && typeof data.title === "string" ? data.title : null;
}

async function parseUpload(req: Request, storage: FileStorage) {
  await storage.ensureDirectory();
  return new Promise<{ temporaryPath: string; mimeType: string; title?: string }>((resolve, reject) => {
    let temporaryPath = "", mimeType = "", title: string | undefined, files = 0, failure: Error | undefined, write: Promise<void> | undefined;
    const fail = (error: Error) => { failure ??= error; };
    let parser: ReturnType<typeof Busboy>;
    try { parser = Busboy({ headers: req.headers, limits: { fileSize: MAX_ATTACHMENT_BYTES, files: 2, fields: 2, parts: 4 } }); } catch { reject(new AttachmentError("VALIDATION_ERROR")); return; }
    parser.on("file", (name, file, info) => {
      files += 1;
      if (name !== "file" || files !== 1) { fail(new AttachmentError("VALIDATION_ERROR")); file.resume(); return; }
      temporaryPath = storage.createTemporaryPath(); mimeType = info.mimeType;
      file.on("limit", () => fail(new AttachmentError("UPLOAD_TOO_LARGE")));
      write = pipeline(file, createWriteStream(temporaryPath)).catch(fail);
    });
    parser.on("field", (name, value) => { if (name !== "title" || title !== undefined) fail(new AttachmentError("VALIDATION_ERROR")); else title = value; });
    parser.on("error", fail);
    parser.on("close", () => void (async () => {
      try {
        await write;
        if (failure) throw failure;
        if (files !== 1 || !temporaryPath) throw new AttachmentError("VALIDATION_ERROR");
        resolve({ temporaryPath, mimeType, title });
      } catch (error) { if (temporaryPath) storage.remove(temporaryPath); reject(error); }
    })());
    req.pipe(parser);
  });
}

function sendError(res: Response, error: unknown) {
  if (!(error instanceof AttachmentError)) { logAcademyError(res, error); res.status(500).json(academyErrorBody("INTERNAL_ERROR")); return; }
  const status = error.code === "VALIDATION_ERROR" ? 400 : error.code === "ATTACHMENT_LIMIT" || error.code === "ATTACHMENT_DELETED" || error.code === "POST_DELETED" ? 409 : error.code === "ATTACHMENT_NOT_FOUND" || error.code === "POST_NOT_FOUND" ? 404 : error.code === "UPLOAD_TOO_LARGE" ? 413 : 415;
  res.status(status).json(academyErrorBody(error.code));
}
