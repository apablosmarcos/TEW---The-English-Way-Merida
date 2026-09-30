import assert from "node:assert/strict";
import { chmod, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";

import { AcademySchemaError, applyAcademyMigrations } from "./academy-migrations.ts";
import { startupDiagnostic } from "../../startup-diagnostic.ts";
import {
  ensureStorageDirectories,
  openDatabase,
} from "./sqlite.ts";

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

test("clean initialization leaves legacy tables absent and preserves existing legacy bytes", () => {
  const clean = new DatabaseSync(":memory:");
  applyAcademyMigrations(clean);
  assert.deepEqual(academyTables(clean), ["attachments", "audit_log", "categories", "posts", "sessions", "users"]);

  const database = new DatabaseSync(":memory:");
  database.exec(`
    CREATE TABLE leads (id TEXT PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE admin_sessions (tokenHash TEXT PRIMARY KEY, expiresAt TEXT NOT NULL);
    INSERT INTO leads VALUES ('lead-1', 'Existing lead');
    INSERT INTO admin_sessions VALUES ('legacy-token', '2026-01-01T00:00:00.000Z');
  `);
  const legacyBefore = database.prepare("SELECT sql FROM sqlite_master WHERE name IN ('leads', 'admin_sessions') ORDER BY name").all();
  const rowsBefore = [database.prepare("SELECT * FROM leads").all(), database.prepare("SELECT * FROM admin_sessions").all()];

  applyAcademyMigrations(database);

  assert.deepEqual(database.prepare("SELECT sql FROM sqlite_master WHERE name IN ('leads', 'admin_sessions') ORDER BY name").all(), legacyBefore);
  assert.deepEqual([database.prepare("SELECT * FROM leads").all(), database.prepare("SELECT * FROM admin_sessions").all()], rowsBefore);
});

test("rejects incompatible Academy schemas at versions zero and one without mutation", () => {
  for (const version of [0, 1]) {
    const database = new DatabaseSync(":memory:");
    database.exec(`
      CREATE TABLE users (id TEXT PRIMARY KEY, normalizedUsername TEXT, deletedAt TEXT);
      INSERT INTO users VALUES ('legacy-user', 'legacy', NULL);
    `);
    database.exec(version === 0 ? "PRAGMA user_version = 0" : "PRAGMA user_version = 1");
    const before = {
      version: database.prepare("PRAGMA user_version").get(),
      schema: database.prepare("SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name").all(),
      rows: database.prepare("SELECT * FROM users").all(),
    };

    assert.throws(
      () => applyAcademyMigrations(database),
      /Academy database schema is incompatible/,
    );
    assert.deepEqual(database.prepare("PRAGMA user_version").get(), before.version);
    assert.deepEqual(database.prepare("SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name").all(), before.schema);
    assert.deepEqual(database.prepare("SELECT * FROM users").all(), before.rows);
  }
});

test("startup preserves a safe operator diagnosis for incompatible Academy schemas", () => {
  const diagnostic = startupDiagnostic(new AcademySchemaError());
  assert.deepEqual(diagnostic, {
    event: "api_startup_failed",
    errorCode: "ACADEMY_SCHEMA_INCOMPATIBLE",
    operatorMessage: "Academy schema is incompatible. Stop writers, create and verify a copy, inspect that copy, and obtain explicit authorization before recovery.",
  });
  const serialized = JSON.stringify(diagnostic);
  for (const sensitive of ["SELECT * FROM users", "/private/academy.sqlite", "secret-password"]) {
    assert.equal(serialized.includes(sensitive), false);
  }
  assert.deepEqual(startupDiagnostic(Object.assign(new Error("SELECT secret-password FROM /private/academy.sqlite"), { code: "ERR_SQLITE_ERROR" })), {
    event: "api_startup_failed",
    errorCode: "ERR_SQLITE_ERROR",
  });
});

test("configures foreign keys on every opened database connection", () => {
  const database = openDatabase({ SQLITE_DB_PATH: ":memory:" });

  try {
    assert.equal(
      database.prepare("PRAGMA foreign_keys").get()?.foreign_keys,
      1,
    );
    assert.equal(database.prepare("PRAGMA busy_timeout").get()?.timeout, 5000);
  } finally {
    database.close();
  }
});

test("prepares configured SQLite and upload parent directories", async () => {
  const root = await mkdtemp(join(tmpdir(), "tew-academy-storage-"));
  const databasePath = join(root, "database", "academy.sqlite");
  const uploadPath = join(root, "uploads");

  try {
    await ensureStorageDirectories({
      SQLITE_DB_PATH: databasePath,
      FILE_STORAGE_PATH: uploadPath,
    });

    const database = new DatabaseSync(databasePath);
    database.close();
    await assert.doesNotReject(async () => {
      await import("node:fs/promises").then(({ access }) => access(uploadPath));
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects a configured upload directory that is not writable", async () => {
  const root = await mkdtemp(join(tmpdir(), "tew-academy-storage-"));
  const uploadPath = join(root, "uploads");

  try {
    await ensureStorageDirectories({ FILE_STORAGE_PATH: uploadPath });
    await chmod(uploadPath, 0o500);

    await assert.rejects(
      ensureStorageDirectories({ FILE_STORAGE_PATH: uploadPath }),
      { code: "EACCES" },
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("does not alter pre-existing legacy tables or rows", () => {
  const database = new DatabaseSync(":memory:");

  database.exec(`
    CREATE TABLE leads (id TEXT PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE admin_sessions (tokenHash TEXT PRIMARY KEY, expiresAt TEXT NOT NULL);
    INSERT INTO leads VALUES ('lead-1', 'Existing lead');
    INSERT INTO admin_sessions VALUES ('legacy-token', '2026-01-01T00:00:00.000Z');
  `);
  applyAcademyMigrations(database);

  assert.deepEqual(
    database
      .prepare("SELECT * FROM leads")
      .all()
      .map((row) => ({ ...row })),
    [{ id: "lead-1", name: "Existing lead" }],
  );
  assert.deepEqual(
    database
      .prepare("SELECT * FROM admin_sessions")
      .all()
      .map((row) => ({ ...row })),
    [{ tokenHash: "legacy-token", expiresAt: "2026-01-01T00:00:00.000Z" }],
  );
});
