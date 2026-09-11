import { randomUUID } from "node:crypto";
import { access, mkdir, open } from "node:fs/promises";
import { renameSync, rmSync } from "node:fs";
import { join } from "node:path";

import { AttachmentError } from "./academy-errors.ts";

export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
export type ValidatedFile = { extension: "pdf" | "jpg" | "png" | "webp"; mimeType: string; byteSize: number };

export class FileStorage {
  private readonly root: string;
  constructor(root: string) { this.root = root; }
  async ensureDirectory() { await mkdir(this.root, { recursive: true }); }
  createTemporaryPath() { return join(this.root, `${randomUUID()}.tmp`); }
  finalPath(storageId: string, extension: ValidatedFile["extension"]) { return join(this.root, `${storageId}.${extension}`); }
  move(temporaryPath: string, storageId: string, extension: ValidatedFile["extension"]) { renameSync(temporaryPath, this.finalPath(storageId, extension)); }
  remove(path: string) { rmSync(path, { force: true }); }
  async existsPath(path: string) { try { await access(path); return true; } catch { return false; } }

  async validate(path: string, mimeType: string): Promise<ValidatedFile> {
    const handle = await open(path, "r");
    try {
      const { size } = await handle.stat();
      if (size > MAX_ATTACHMENT_BYTES) throw new AttachmentError("UPLOAD_TOO_LARGE");
      const header = Buffer.alloc(12); await handle.read(header, 0, header.length, 0);
      const extension = signature(mimeType, header);
      if (!extension) throw new AttachmentError("UNSUPPORTED_FILE_TYPE");
      return { extension, mimeType, byteSize: size };
    } finally { await handle.close(); }
  }
}

function signature(mimeType: string, header: Buffer): ValidatedFile["extension"] | null {
  if (mimeType === "application/pdf" && header.subarray(0, 5).toString() === "%PDF-") return "pdf";
  if (mimeType === "image/jpeg" && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return "jpg";
  if (mimeType === "image/png" && header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "png";
  if (mimeType === "image/webp" && header.subarray(0, 4).toString() === "RIFF" && header.subarray(8, 12).toString() === "WEBP") return "webp";
  return null;
}
