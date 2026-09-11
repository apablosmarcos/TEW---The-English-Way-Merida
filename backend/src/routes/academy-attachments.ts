import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import Busboy from "busboy";
import { Router, type Request, type Response } from "express";

import { AttachmentError } from "../modules/academy/academy-errors.ts";
import { AttachmentRepository } from "../modules/academy/attachment-repository.ts";
import { AttachmentService } from "../modules/academy/attachment-service.ts";
import { AuditRepository } from "../modules/academy/audit-repository.ts";
import { FileStorage, MAX_ATTACHMENT_BYTES } from "../modules/academy/file-storage.ts";
import { openDatabase, resolveFileStoragePath } from "../modules/storage/sqlite.ts";
import { academyAuth } from "./academy-middleware.ts";
import { uuid } from "./academy-posts.ts";

export function createAcademyAttachmentsRouter() {
  const router = Router();
  router.post("/:id/attachments", async (req, res) => {
    if (!uuid(req.params.id)) { res.status(400).json({ ok: false, error: "VALIDATION_ERROR" }); return; }
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
  if (!(error instanceof AttachmentError)) { res.status(500).json({ ok: false, error: "Internal server error" }); return; }
  const status = error.code === "VALIDATION_ERROR" ? 400 : error.code === "ATTACHMENT_LIMIT" || error.code === "POST_DELETED" ? 409 : error.code === "POST_NOT_FOUND" ? 404 : error.code === "UPLOAD_TOO_LARGE" ? 413 : 415;
  res.status(status).json({ ok: false, error: error.code });
}
