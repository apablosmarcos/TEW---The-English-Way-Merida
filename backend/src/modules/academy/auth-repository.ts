import { DatabaseSync } from "node:sqlite";

import type { AcademyRole, AcademySession, AcademyUser } from "./academy-types.ts";

export type StoredUser = AcademyUser & { passwordHash: string; mustChangePassword: number; disabledAt: string | null };

export class AuthRepository {
  private readonly database: DatabaseSync;

  constructor(database: DatabaseSync) {
    this.database = database;
  }

  findLoginUser(normalizedUsername: string) {
    return this.database.prepare(`SELECT id, displayName, username, role, passwordHash, mustChangePassword, disabledAt
      FROM users WHERE normalizedUsername = ? AND deletedAt IS NULL`).get(normalizedUsername) as StoredUser | undefined;
  }

  createSession(tokenHash: string, userId: string, now: string, expiresAt: string) {
    this.database.prepare("INSERT INTO sessions (tokenHash, userId, createdAt, lastSeenAt, expiresAt) VALUES (?, ?, ?, ?, ?)")
      .run(tokenHash, userId, now, now, expiresAt);
  }

  resolveSession(tokenHash: string, now: string, expiresAt: string): AcademySession | undefined {
    this.database.prepare("DELETE FROM sessions WHERE expiresAt <= ?").run(now);
    const row = this.database.prepare(`SELECT u.id, u.displayName, u.username, u.role, u.mustChangePassword
      FROM sessions s JOIN users u ON u.id = s.userId
      WHERE s.tokenHash = ? AND u.disabledAt IS NULL AND u.deletedAt IS NULL`).get(tokenHash) as (AcademyUser & { mustChangePassword: number }) | undefined;
    if (!row) return undefined;
    this.database.prepare("UPDATE sessions SET lastSeenAt = ?, expiresAt = ? WHERE tokenHash = ?").run(now, expiresAt, tokenHash);
    return { user: user(row), expiresAt, mustChangePassword: !!row.mustChangePassword };
  }

  deleteSession(tokenHash: string) {
    this.database.prepare("DELETE FROM sessions WHERE tokenHash = ?").run(tokenHash);
  }

  changePasswordAndRevoke(userId: string, passwordHash: string, now: string) {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.prepare("UPDATE users SET passwordHash = ?, mustChangePassword = 0, updatedAt = ? WHERE id = ?")
        .run(passwordHash, now, userId);
      this.database.prepare("DELETE FROM sessions WHERE userId = ?").run(userId);
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }
}

function user(row: AcademyUser) {
  return { id: row.id, displayName: row.displayName, username: row.username, role: row.role as AcademyRole };
}
