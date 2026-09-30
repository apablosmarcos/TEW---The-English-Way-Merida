import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, readdir, rm, truncate, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { AttachmentError } from "./academy-errors.ts";
import { AttachmentRepository } from "./attachment-repository.ts";
import { AttachmentService } from "./attachment-service.ts";
import { AuditRepository } from "./audit-repository.ts";
import { FileStorage } from "./file-storage.ts";
import { applyAcademyMigrations } from "../storage/academy-migrations.ts";
import { openDatabase } from "../storage/sqlite.ts";

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "academy-attachment-"));
  const database = openDatabase({ SQLITE_DB_PATH: join(root, "academy.sqlite") });
  applyAcademyMigrations(database);
  const postId = randomUUID(), actorId = randomUUID(), now = new Date().toISOString();
  database.prepare("INSERT INTO users (id, displayName, username, normalizedUsername, role, passwordHash, mustChangePassword, disabledAt, deletedAt, createdAt, updatedAt) VALUES (?, 'Admin', 'admin', 'admin', 'admin', 'unused', 0, NULL, NULL, ?, ?)").run(actorId, now, now);
  database.prepare("INSERT INTO posts (id, title, markdownSource, categoryId, visibility, publishedAt, updatedAt, deletedAt) VALUES (?, 'Post', '', NULL, 'visible', ?, ?, NULL)").run(postId, now, now);
  const storage = new FileStorage(join(root, "uploads"));
  await storage.ensureDirectory();
  return { root, database, postId, actorId, storage, service: new AttachmentService(new AttachmentRepository(database), new AuditRepository(database), storage) };
}

test("attachment upload validates a staged PDF, moves it opaquely, and atomically records metadata and audit", async () => {
  const context = await fixture();
  try {
    const temporaryPath = await context.storage.createTemporaryPath();
    await writeFile(temporaryPath, "%PDF-1.7\ncontent");
    const attachment = await context.service.upload(context.actorId, context.postId, { temporaryPath, mimeType: "application/pdf", title: " Lesson " });
    assert.deepEqual(Object.keys(attachment).sort(), ["byteSize", "createdAt", "deletedAt", "extension", "id", "materialOrdinal", "mimeType", "postId", "updatedAt", "visibleTitle"]);
    assert.equal(attachment.visibleTitle, "Lesson");
    assert.equal(attachment.extension, "pdf");
    assert.equal(attachment.materialOrdinal, 1);
    const storedFiles = await readdir(join(context.root, "uploads"));
    assert.equal(storedFiles.length, 1);
    assert.match(storedFiles[0]!, /^[0-9a-f-]+\.pdf$/);
    assert.equal((context.database.prepare("SELECT COUNT(*) AS count FROM audit_log WHERE action = 'attachment.uploaded'").get() as { count: number }).count, 1);
  } finally { context.database.close(); await rm(context.root, { recursive: true, force: true }); }
});

test("attachment upload rejects invalid, oversized, and full-post files without retaining staged or moved data", async () => {
  const context = await fixture();
  try {
    const invalid = await context.storage.createTemporaryPath();
    await writeFile(invalid, "not a PDF");
    await assert.rejects(context.service.upload(context.actorId, context.postId, { temporaryPath: invalid, mimeType: "application/pdf" }), new AttachmentError("UNSUPPORTED_FILE_TYPE"));
    assert.equal(await context.storage.existsPath(invalid), false);
    const oversized = context.storage.createTemporaryPath();
    await writeFile(oversized, "%PDF-"); await truncate(oversized, 20 * 1024 * 1024 + 1);
    await assert.rejects(context.service.upload(context.actorId, context.postId, { temporaryPath: oversized, mimeType: "application/pdf" }), new AttachmentError("UPLOAD_TOO_LARGE"));
    assert.equal(await context.storage.existsPath(oversized), false);
    context.database.exec("CREATE TRIGGER reject_attachment BEFORE INSERT ON attachments BEGIN SELECT RAISE(FAIL, 'database failure'); END");
    const rejectedByDatabase = context.storage.createTemporaryPath();
    await writeFile(rejectedByDatabase, "%PDF-");
    await assert.rejects(context.service.upload(context.actorId, context.postId, { temporaryPath: rejectedByDatabase, mimeType: "application/pdf" }));
    assert.deepEqual(await readdir(join(context.root, "uploads")), []);
    context.database.exec("DROP TRIGGER reject_attachment");

    for (let ordinal = 1; ordinal <= 10; ordinal += 1) context.database.prepare("INSERT INTO attachments (id, postId, storageId, extension, mimeType, byteSize, visibleTitle, materialOrdinal, createdAt, updatedAt, deletedAt) VALUES (?, ?, ?, 'pdf', 'application/pdf', 1, NULL, ?, ?, ?, ?)").run(randomUUID(), context.postId, randomUUID(), ordinal, new Date().toISOString(), new Date().toISOString(), ordinal === 10 ? new Date().toISOString() : null);
    const full = await context.storage.createTemporaryPath();
    await writeFile(full, "%PDF-");
    await assert.rejects(context.service.upload(context.actorId, context.postId, { temporaryPath: full, mimeType: "application/pdf" }), new AttachmentError("ATTACHMENT_LIMIT"));
    assert.equal(await context.storage.existsPath(full), false);
  } finally { context.database.close(); await rm(context.root, { recursive: true, force: true }); }
});

test("attachment rename and soft deletion retain files, ordinals, and safe audit evidence", async () => {
  const context = await fixture();
  try {
    const upload = async (title: string) => { const temporaryPath = await context.storage.createTemporaryPath(); await writeFile(temporaryPath, "%PDF-"); return context.service.upload(context.actorId, context.postId, { temporaryPath, mimeType: "application/pdf", title }); };
    const first = await upload("First"), second = await upload("Second");
    const renamed = context.service.rename(context.actorId, first.id, { title: " Renamed " });
    assert.equal(renamed.visibleTitle, "Renamed");
    await context.service.delete(context.actorId, second.id);
    const third = await upload("Third");
    assert.deepEqual(context.service.listAdmin(context.postId).map(({ materialOrdinal, deletedAt }) => [materialOrdinal, deletedAt !== null]), [[1, false], [2, true], [3, false]]);
    const storageId = (context.database.prepare("SELECT storageId FROM attachments WHERE id = ?").get(second.id) as { storageId: string }).storageId;
    assert.equal(await context.storage.existsPath(join(context.root, "uploads", `${storageId}.pdf`)), true);
    const audit = JSON.stringify(context.database.prepare("SELECT action, entityType, entityId FROM audit_log WHERE entityId IN (?, ?)").all(first.id, second.id));
    assert.match(audit, /attachment.renamed/);
    assert.match(audit, /attachment.deleted/);
    assert.equal(audit.includes(storageId), false);
    assert.equal(audit.includes("Renamed"), false);
    assert.equal(audit.includes("Second"), false);
    assert.throws(() => context.service.rename(context.actorId, second.id, { title: "Nope" }), new AttachmentError("ATTACHMENT_DELETED"));
  } finally { context.database.close(); await rm(context.root, { recursive: true, force: true }); }
});
