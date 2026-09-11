import { randomUUID } from "node:crypto";

import { AttachmentError } from "./academy-errors.ts";
import { AttachmentRepository, type StoredAttachment } from "./attachment-repository.ts";
import { AuditRepository } from "./audit-repository.ts";
import { FileStorage } from "./file-storage.ts";
import type { AcademyAttachment } from "./academy-types.ts";

export class AttachmentService {
  private readonly attachments: AttachmentRepository;
  private readonly audit: AuditRepository;
  private readonly storage: FileStorage;
  private readonly clock: () => string;
  constructor(attachments: AttachmentRepository, audit: AuditRepository, storage: FileStorage, clock = () => new Date().toISOString()) { this.attachments = attachments; this.audit = audit; this.storage = storage; this.clock = clock; }

  async upload(actorUserId: string, postId: string, input: { temporaryPath: string; mimeType: string; title?: string }): Promise<AcademyAttachment> {
    let file;
    try { file = await this.storage.validate(input.temporaryPath, input.mimeType); } catch (error) { this.storage.remove(input.temporaryPath); throw error; }
    const now = this.clock(), storageId = randomUUID(), id = randomUUID(), visibleTitle = input.title?.trim() || null;
    let finalPath = "";
    try {
      const attachment = this.attachments.transaction(() => {
        const post = this.attachments.mutablePost(postId);
        if (!post) throw new AttachmentError("POST_NOT_FOUND");
        if (post.deletedAt || post.visibility === "deleted") throw new AttachmentError("POST_DELETED");
        if (this.attachments.count(postId) >= 10) throw new AttachmentError("ATTACHMENT_LIMIT");
        const stored: StoredAttachment = { id, postId, storageId, ...file, visibleTitle, materialOrdinal: this.attachments.nextOrdinal(postId), createdAt: now, updatedAt: now };
        finalPath = this.storage.finalPath(storageId, file.extension);
        this.storage.move(input.temporaryPath, storageId, file.extension);
        this.attachments.create(stored);
        this.audit.append(actorUserId, "attachment.uploaded", id, now, "attachment");
        return safe(stored);
      });
      return attachment;
    } catch (error) {
      this.storage.remove(input.temporaryPath);
      if (finalPath) this.storage.remove(finalPath);
      throw error;
    }
  }
}

function safe(attachment: StoredAttachment): AcademyAttachment { const { storageId: _storageId, ...metadata } = attachment; return metadata; }
