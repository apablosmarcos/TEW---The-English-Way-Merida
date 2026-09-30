import { DatabaseSync } from "node:sqlite";

import type { AcademyRole, AcademyUserDetail, UserListOptions } from "./academy-types.ts";

type StoredUser = AcademyUserDetail & { passwordHash: string; disabledAt: string | null; deletedAt: string | null };

export class UserRepository {
  private readonly database: DatabaseSync;

  constructor(database: DatabaseSync) {
    this.database = database;
  }

  transaction<T>(action: () => T) {
    this.database.exec("BEGIN IMMEDIATE");
    try { const result = action(); this.database.exec("COMMIT"); return result; }
    catch (error) { this.database.exec("ROLLBACK"); throw error; }
  }

  create(id: string, displayName: string, username: string, normalizedUsername: string, role: AcademyRole, passwordHash: string, mustChangePassword: boolean, now: string) {
    this.database.prepare(`INSERT INTO users (id, displayName, username, normalizedUsername, role, passwordHash, mustChangePassword, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, displayName, username, normalizedUsername, role, passwordHash, +mustChangePassword, now, now);
    return this.get(id)!;
  }

  get(id: string) {
    return this.database.prepare(`SELECT id, displayName, username, role, mustChangePassword, createdAt, updatedAt,
      CASE WHEN deletedAt IS NOT NULL THEN 'deleted' WHEN disabledAt IS NOT NULL THEN 'disabled' ELSE 'active' END AS state FROM users WHERE id = ?`)
      .get(id) as AcademyUserDetail | undefined;
  }

  stored(id: string) {
    return this.database.prepare(`SELECT id, displayName, username, role, passwordHash, mustChangePassword, disabledAt, deletedAt, createdAt, updatedAt,
      CASE WHEN deletedAt IS NOT NULL THEN 'deleted' WHEN disabledAt IS NOT NULL THEN 'disabled' ELSE 'active' END AS state FROM users WHERE id = ?`)
      .get(id) as StoredUser | undefined;
  }

  hasUsername(normalizedUsername: string) {
    return !!this.database.prepare("SELECT 1 FROM users WHERE normalizedUsername = ? AND deletedAt IS NULL").get(normalizedUsername);
  }

  list(options: UserListOptions, page: number, pageSize: number) {
    const where: string[] = [];
    const values: Array<string | number> = [];
    if (options.role) { where.push("role = ?"); values.push(options.role); }
    if (options.state === "active") where.push("deletedAt IS NULL AND disabledAt IS NULL");
    if (options.state === "disabled") where.push("deletedAt IS NULL AND disabledAt IS NOT NULL");
    if (options.state === "deleted") where.push("deletedAt IS NOT NULL");
    if (options.search?.trim()) { where.push("(lower(displayName) LIKE ? OR normalizedUsername LIKE ? OR id = ?)"); const search = options.search.trim().normalize("NFC").toLowerCase(); values.push(`%${search}%`, `%${search}%`, search); }
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const select = `SELECT id, displayName, username, role, mustChangePassword, createdAt, updatedAt, CASE WHEN deletedAt IS NOT NULL THEN 'deleted' WHEN disabledAt IS NOT NULL THEN 'disabled' ELSE 'active' END AS state FROM users ${clause}`;
    const total = (this.database.prepare(`SELECT COUNT(*) AS count FROM users ${clause}`).get(...values) as { count: number }).count;
    const items = this.database.prepare(`${select} ORDER BY displayName COLLATE NOCASE, id LIMIT ? OFFSET ?`).all(...values, pageSize, (page - 1) * pageSize) as unknown as AcademyUserDetail[];
    return { items, total };
  }

  activeAdminCount() {
    return (this.database.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND disabledAt IS NULL AND deletedAt IS NULL").get() as { count: number }).count;
  }

  disable(id: string, now: string) { this.database.prepare("UPDATE users SET disabledAt = ?, updatedAt = ? WHERE id = ?").run(now, now, id); }
  enable(id: string, now: string) { this.database.prepare("UPDATE users SET disabledAt = NULL, updatedAt = ? WHERE id = ?").run(now, id); }
  delete(id: string, now: string) { this.database.prepare("UPDATE users SET deletedAt = ?, updatedAt = ? WHERE id = ?").run(now, now, id); }
  resetPassword(id: string, passwordHash: string, now: string) { this.database.prepare("UPDATE users SET passwordHash = ?, mustChangePassword = 1, updatedAt = ? WHERE id = ?").run(passwordHash, now, id); }
  revokeSessions(id: string) { this.database.prepare("DELETE FROM sessions WHERE userId = ?").run(id); }
}
