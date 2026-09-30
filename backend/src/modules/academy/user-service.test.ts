import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

import { AcademyUserError } from "./academy-errors.ts";
import { AuditRepository } from "./audit-repository.ts";
import { UserRepository } from "./user-repository.ts";
import { UserService } from "./user-service.ts";
import { verifyPassword } from "./password.ts";
import { applyAcademyMigrations } from "../storage/academy-migrations.ts";

const now = new Date("2026-01-01T00:00:00.000Z");

function setup() {
  const database = new DatabaseSync(":memory:");
  applyAcademyMigrations(database);
  return { database, service: new UserService(new UserRepository(database), new AuditRepository(database), () => now) };
}

function session(database: DatabaseSync, userId: string, token = "a") {
  database.prepare("INSERT INTO sessions (tokenHash, userId, createdAt, lastSeenAt, expiresAt) VALUES (?, ?, ?, ?, ?)")
    .run(createHash("sha256").update(token).digest("hex"), userId, now.toISOString(), now.toISOString(), "2026-01-02T00:00:00.000Z");
}

test("creates parents with one-time passwords, normalized unique usernames, and secret-free audit", async () => {
  const { database, service } = setup();
  const actor = await service.createActiveAdministrator({ displayName: "Actor", username: "actor", password: "chosen password" });
  const created = await service.createParent(actor.id, { displayName: "Ada Lovelace", username: "  Ada  " });

  assert.match(created.id, /^[0-9a-f-]{36}$/);
  assert.equal(created.username, "Ada");
  assert.equal(created.mustChangePassword, true);
  assert.equal(created.temporaryPassword.length, 10);
  assert.equal("passwordHash" in created, false);
  assert.equal("temporaryPassword" in service.get(created.id), false);
  assert.equal("passwordHash" in service.get(created.id), false);
  const stored = database.prepare("SELECT passwordHash FROM users WHERE id = ?").get(created.id) as { passwordHash: string };
  assert.equal(await verifyPassword(created.temporaryPassword, stored.passwordHash), true);
  assert.equal(JSON.stringify(database.prepare("SELECT * FROM audit_log WHERE entityId = ?").all(created.id)), JSON.stringify([{ id: 2, actorUserId: actor.id, action: "user.created", entityType: "user", entityId: created.id, createdAt: now.toISOString() }]));
  assert.equal(JSON.stringify(database.prepare("SELECT * FROM audit_log").all()).includes(created.temporaryPassword), false);
  await assert.rejects(service.createParent(null, { displayName: "Other", username: "ADA" }), { code: "USERNAME_TAKEN" });
});

test("creates an active system administrator without a temporary password", async () => {
  const { database, service } = setup();
  const admin = await service.createActiveAdministrator({ displayName: "System", username: "root", password: "chosen password" });

  assert.equal(admin.role, "admin");
  assert.equal(admin.mustChangePassword, false);
  assert.equal("temporaryPassword" in admin, false);
  assert.equal(database.prepare("SELECT actorUserId FROM audit_log").get()?.actorUserId, null);
});

test("lists deterministic filtered pages and searches display names, usernames, and UUIDs", async () => {
  const { service } = setup();
  const ada = await service.createParent(null, { displayName: "Ada", username: "first" });
  const zoe = await service.createParent(null, { displayName: "Zoe", username: "second" });
  await service.disable(null, zoe.id);

  assert.deepEqual(service.list({ search: "ada" }).items.map((user) => user.id), [ada.id]);
  assert.deepEqual(service.list({ search: "first" }).items.map((user) => user.id), [ada.id]);
  assert.deepEqual(service.list({ search: ada.id }).items.map((user) => user.id), [ada.id]);
  assert.deepEqual(service.list({ state: "disabled", pageSize: 1 }).items.map((user) => user.id), [zoe.id]);
  assert.equal(service.list({ role: "admin" }).total, 0);
  assert.deepEqual(service.list({ page: 2, pageSize: 1 }).items.map((user) => user.displayName), ["Zoe"]);
  assert.equal(service.list({ page: 0, pageSize: 0 }).items[0]?.id, ada.id);
  assert.equal(service.list({ page: 3, pageSize: 1 }).items.length, 0);
});

test("revokes sessions with transactional audits and protects the sole active administrator", async () => {
  const { database, service } = setup();
  const admin = await service.createActiveAdministrator({ displayName: "Admin", username: "admin", password: "chosen password" });
  const parent = await service.createParent(admin.id, { displayName: "Parent", username: "parent" });
  session(database, parent.id, "first");
  session(database, parent.id, "second");
  const reset = await service.resetPassword(admin.id, parent.id);
  assert.equal(reset.temporaryPassword.length, 10);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM sessions WHERE userId = ?").get(parent.id)?.count, 0);
  assert.equal((await service.get(parent.id)).mustChangePassword, true);
  assert.equal(JSON.stringify(database.prepare("SELECT * FROM audit_log").all()).includes(reset.temporaryPassword), false);
  assert.throws(() => service.disable(admin.id, admin.id), (error) => error instanceof AcademyUserError && error.code === "LAST_ACTIVE_ADMIN");
  assert.throws(() => service.delete(admin.id, admin.id), { code: "LAST_ACTIVE_ADMIN" });

  session(database, parent.id);
  database.exec("CREATE TRIGGER abort_disable BEFORE INSERT ON audit_log WHEN NEW.action = 'user.disabled' BEGIN SELECT RAISE(ABORT, 'audit failed'); END;");
  assert.throws(() => service.disable(admin.id, parent.id), /audit failed/);
  assert.equal((await service.get(parent.id)).state, "active");
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM sessions WHERE userId = ?").get(parent.id)?.count, 1);
  database.exec("DROP TRIGGER abort_disable");
  await service.delete(admin.id, parent.id);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM sessions WHERE userId = ?").get(parent.id)?.count, 0);
  assert.deepEqual(service.list({ state: "deleted", role: "parent" }).items.map((user) => user.id), [parent.id]);
  const replacement = await service.createParent(admin.id, { displayName: "Replacement", username: "parent" });
  assert.equal(replacement.username, "parent");
  assert.throws(() => service.enable(admin.id, parent.id), { code: "USER_DELETED" });
});
