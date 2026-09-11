import { DatabaseSync } from "node:sqlite";

export type StoredAttachment = { id: string; postId: string; storageId: string; extension: "pdf" | "jpg" | "png" | "webp"; mimeType: string; byteSize: number; visibleTitle: string | null; materialOrdinal: number; createdAt: string; updatedAt: string; deletedAt: string | null };

export class AttachmentRepository {
  private readonly database: DatabaseSync;
  constructor(database: DatabaseSync) { this.database = database; }
  transaction<T>(action: () => T) { this.database.exec("BEGIN IMMEDIATE"); try { const result = action(); this.database.exec("COMMIT"); return result; } catch (error) { this.database.exec("ROLLBACK"); throw error; } }
  mutablePost(id: string) { return this.database.prepare("SELECT visibility, deletedAt FROM posts WHERE id = ?").get(id) as { visibility: string; deletedAt: string | null } | undefined; }
  count(postId: string) { return (this.database.prepare("SELECT COUNT(*) AS count FROM attachments WHERE postId = ?").get(postId) as { count: number }).count; }
  nextOrdinal(postId: string) { return (this.database.prepare("SELECT COALESCE(MAX(materialOrdinal), 0) + 1 AS ordinal FROM attachments WHERE postId = ?").get(postId) as { ordinal: number }).ordinal; }
  create(attachment: StoredAttachment) { this.database.prepare("INSERT INTO attachments (id, postId, storageId, extension, mimeType, byteSize, visibleTitle, materialOrdinal, createdAt, updatedAt, deletedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)").run(attachment.id, attachment.postId, attachment.storageId, attachment.extension, attachment.mimeType, attachment.byteSize, attachment.visibleTitle, attachment.materialOrdinal, attachment.createdAt, attachment.updatedAt); }
  attachment(id: string) { return this.database.prepare("SELECT id, postId, storageId, extension, mimeType, byteSize, visibleTitle, materialOrdinal, createdAt, updatedAt, deletedAt FROM attachments WHERE id = ?").get(id) as StoredAttachment | undefined; }
  list(postId: string, includeDeleted: boolean) { return this.database.prepare(`SELECT id, postId, storageId, extension, mimeType, byteSize, visibleTitle, materialOrdinal, createdAt, updatedAt, deletedAt FROM attachments WHERE postId = ?${includeDeleted ? "" : " AND deletedAt IS NULL"} ORDER BY materialOrdinal`).all(postId) as StoredAttachment[]; }
  rename(id: string, visibleTitle: string | null, now: string) { this.database.prepare("UPDATE attachments SET visibleTitle = ?, updatedAt = ? WHERE id = ?").run(visibleTitle, now, id); return this.attachment(id)!; }
  softDelete(id: string, now: string) { this.database.prepare("UPDATE attachments SET deletedAt = ?, updatedAt = ? WHERE id = ?").run(now, now, id); return this.attachment(id)!; }
}
