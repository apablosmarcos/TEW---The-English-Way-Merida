import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

import { AcademyAuthError } from "./academy-errors.ts";
import { AuthRepository } from "./auth-repository.ts";
import { AuthService, normalizeUsername } from "./auth-service.ts";
import { hashPassword } from "./password.ts";
import { applyAcademyMigrations } from "../storage/academy-migrations.ts";

const start = new Date("2026-01-01T00:00:00.000Z");

async function setup(options: { disabled?: boolean; deleted?: boolean; mustChangePassword?: boolean } = {}) {
  const database = new DatabaseSync(":memory:");
  applyAcademyMigrations(database);
  const passwordHash = await hashPassword("correct password");
  database.prepare(`INSERT INTO users (id, displayName, username, normalizedUsername, role, passwordHash, mustChangePassword, disabledAt, deletedAt, createdAt, updatedAt)
    VALUES ('user-1', 'Ada', 'Ada', 'ada', 'parent', ?, ?, ?, ?, ?, ?)`)
    .run(passwordHash, options.mustChangePassword ? 1 : 0, options.disabled ? start.toISOString() : null, options.deleted ? start.toISOString() : null, start.toISOString(), start.toISOString());
  let now = start;
  return { database, service: new AuthService(new AuthRepository(database), () => now), setNow: (value: Date) => { now = value; } };
}

async function rejectsLogin(service: AuthService, username: string, password: string) {
  await assert.rejects(service.login(username, password), (error) => error instanceof AcademyAuthError && error.code === "AUTHENTICATION_FAILED");
}

test("normalizes active usernames, creates opaque eight-hour sessions, and exposes forced-change state", async () => {
  const { database, service } = await setup({ mustChangePassword: true });
  const result = await service.login("  ADA  ", "correct password");

  assert.deepEqual(result.user, { id: "user-1", displayName: "Ada", username: "Ada", role: "parent" });
  assert.equal(result.mustChangePassword, true);
  assert.equal(result.expiresAt, "2026-01-01T08:00:00.000Z");
  assert.equal("passwordHash" in result, false);
  const session = database.prepare("SELECT tokenHash FROM sessions").get() as { tokenHash: string };
  assert.equal(session.tokenHash, createHash("sha256").update(result.token).digest("hex"));
  assert.equal("tokenHash" in result, false);
});

test("returns the same generic failure for invalid account states and passwords", async () => {
  for (const options of [{}, { disabled: true }, { deleted: true }]) {
    const { service } = await setup(options);
    await rejectsLogin(service, "ada", options.disabled || options.deleted ? "correct password" : "wrong password");
  }
  const { database, service } = await setup();
  await rejectsLogin(service, "missing", "wrong password");
  database.prepare("UPDATE users SET passwordHash = 'malformed'").run();
  await rejectsLogin(service, "ada", "wrong password");
});

test("normalizes Unicode usernames", () => {
  assert.equal(normalizeUsername("  A\u030Ada  "), "åda");
});

test("rolls active sessions, deletes expired tokens, supports logout, and keeps simultaneous sessions", async () => {
  const { database, service, setNow } = await setup();
  const first = await service.login("ada", "correct password");
  const second = await service.login("ada", "correct password");
  setNow(new Date("2026-01-01T01:00:00.000Z"));
  assert.equal((await service.getSession(first.token)).expiresAt, "2026-01-01T09:00:00.000Z");
  await service.logout(first.token);
  assert.throws(() => service.getSession(first.token), { code: "UNAUTHENTICATED" });
  database.prepare("UPDATE sessions SET expiresAt = ? WHERE tokenHash != ?").run(start.toISOString(), "no-match");
  assert.throws(() => service.getSession(second.token), { code: "UNAUTHENTICATED" });
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM sessions").get()?.count, 0);
});

test("password changes clear forced state and revoke every existing session", async () => {
  const { service } = await setup({ mustChangePassword: true });
  const first = await service.login("ada", "correct password");
  const second = await service.login("ada", "correct password");
  await service.changeOwnPassword(first.token, "correct password", "new password");

  assert.throws(() => service.getSession(first.token), { code: "UNAUTHENTICATED" });
  assert.throws(() => service.getSession(second.token), { code: "UNAUTHENTICATED" });
  await rejectsLogin(service, "ada", "correct password");
  assert.equal((await service.login("ada", "new password")).mustChangePassword, false);
});
