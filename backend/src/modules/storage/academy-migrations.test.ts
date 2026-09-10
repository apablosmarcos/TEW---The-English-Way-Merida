import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";

import { applyAcademyMigrations } from "./academy-migrations.ts";

function academyTables(database: DatabaseSync) {
  return (
    database
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
      )
      .all() as Array<{ name: string }>
  )
    .map((row) => row.name)
    .filter((name) => !name.startsWith("sqlite_"));
}

test("creates the academy schema directly and repeats without changing data", () => {
  const database = new DatabaseSync(":memory:");

  applyAcademyMigrations(database);
  database
    .prepare(`
    INSERT INTO users (
      id, displayName, username, normalizedUsername, role, passwordHash,
      mustChangePassword, createdAt, updatedAt
    ) VALUES ('user-1', 'Ada', 'Ada', 'ada', 'parent', 'hash', 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')
  `)
    .run();
  applyAcademyMigrations(database);

  assert.deepEqual(academyTables(database), [
    "attachments",
    "audit_log",
    "categories",
    "posts",
    "sessions",
    "users",
  ]);
  assert.equal(database.prepare("PRAGMA user_version").get()?.user_version, 1);
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM users").get()?.count,
    1,
  );
});

test("enforces academy foreign keys and allows a username after its prior account is deleted", () => {
  const database = new DatabaseSync(":memory:");

  applyAcademyMigrations(database);
  assert.equal(database.prepare("PRAGMA foreign_keys").get()?.foreign_keys, 1);
  assert.throws(
    () =>
      database
        .prepare(
          "INSERT INTO sessions (tokenHash, userId, createdAt, lastSeenAt, expiresAt) VALUES ('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'missing', 'now', 'now', 'later')",
        )
        .run(),
    /FOREIGN KEY constraint failed/,
  );
  database
    .prepare(`
    INSERT INTO users (
      id, displayName, username, normalizedUsername, role, passwordHash,
      mustChangePassword, deletedAt, createdAt, updatedAt
    ) VALUES ('deleted-user', 'Ada', 'Ada', 'ada', 'parent', 'hash', 1, 'now', 'now', 'now')
  `)
    .run();
  database
    .prepare(`
    INSERT INTO users (
      id, displayName, username, normalizedUsername, role, passwordHash,
      mustChangePassword, createdAt, updatedAt
    ) VALUES ('replacement-user', 'Ada Two', 'Ada', 'ada', 'parent', 'hash', 1, 'now', 'now')
  `)
    .run();

  assert.equal(
    database
      .prepare(
        "SELECT COUNT(*) AS count FROM users WHERE normalizedUsername = ?",
      )
      .get("ada")?.count,
    2,
  );
});

test("rolls back a failing migration and refuses a database newer than this binary", () => {
  const database = new DatabaseSync(":memory:");

  assert.throws(
    () =>
      applyAcademyMigrations(database, [
        {
          version: 1,
          sql: "CREATE TABLE retained (id TEXT PRIMARY KEY) STRICT;",
        },
        {
          version: 2,
          sql: "CREATE TABLE rolled_back (id TEXT PRIMARY KEY) STRICT; INVALID SQL;",
        },
      ]),
    /near "INVALID": syntax error/,
  );
  assert.equal(database.prepare("PRAGMA user_version").get()?.user_version, 1);
  assert.deepEqual(academyTables(database), ["retained"]);

  database.exec("PRAGMA user_version = 2");
  assert.throws(
    () => applyAcademyMigrations(database),
    /newer than supported version 1/,
  );
});
