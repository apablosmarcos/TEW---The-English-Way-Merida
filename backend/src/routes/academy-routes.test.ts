import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createHash, randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import express, { Router } from "express";

import { createApp } from "../app.ts";
import { hashPassword } from "../modules/academy/password.ts";
import { applyAcademyMigrations } from "../modules/storage/academy-migrations.ts";
import { openDatabase } from "../modules/storage/sqlite.ts";
import { academyAuthMiddleware, requireAcademyAdmin, requirePasswordChange } from "./academy-middleware.ts";

async function setup(users: Array<{ username: string; password: string; role?: "parent" | "admin"; mustChangePassword?: boolean }>) {
  const sqliteDbPath = join(tmpdir(), `academy-auth-${randomUUID()}.sqlite`);
  const database = openDatabase({ SQLITE_DB_PATH: sqliteDbPath });
  try {
    applyAcademyMigrations(database);
    for (const [index, user] of users.entries()) {
      database.prepare(`INSERT INTO users (id, displayName, username, normalizedUsername, role, passwordHash, mustChangePassword, disabledAt, deletedAt, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?)`).run(
        `user-${index}`, user.username, user.username, user.username.toLowerCase(), user.role ?? "parent",
        await hashPassword(user.password), user.mustChangePassword ? 1 : 0, new Date().toISOString(), new Date().toISOString(),
      );
    }
  } finally {
    database.close();
  }

  process.env.SQLITE_DB_PATH = sqliteDbPath;
  return {
    sqliteDbPath,
    async close() {
      delete process.env.SQLITE_DB_PATH;
      await rm(sqliteDbPath, { force: true });
    },
  };
}

async function withServer(app: express.Express, action: (baseUrl: string) => Promise<void>) {
  const server = createServer(app);
  try {
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not expose a port");
    await action(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

async function login(baseUrl: string, username: string, password: string) {
  const response = await fetch(`${baseUrl}/api/academy/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return { response, body: await response.json() as { token: string; mustChangePassword: boolean } };
}

test("academy login, session, logout, and password change expose only safe session data", async () => {
  const fixture = await setup([{ username: "ada", password: "correct password" }]);
  try {
    await withServer(createApp(), async (baseUrl) => {
      const failed = await login(baseUrl, "ada", "wrong password");
      assert.equal(failed.response.status, 401);
      assert.deepEqual(failed.body, { ok: false, error: "AUTHENTICATION_FAILED" });

      const signedIn = await login(baseUrl, "ada", "correct password");
      assert.equal(signedIn.response.status, 200);
      assert.equal(signedIn.response.headers.get("cache-control"), "no-store");
      assert.equal(typeof signedIn.body.token, "string");
      assert.equal("passwordHash" in signedIn.body, false);
      assert.equal("tokenHash" in signedIn.body, false);

      const session = await fetch(`${baseUrl}/api/academy/session`, { headers: { authorization: `Bearer ${signedIn.body.token}` } });
      assert.equal(session.status, 200);
      assert.deepEqual(await session.json(), {
        ok: true,
        user: { id: "user-0", displayName: "ada", username: "ada", role: "parent" },
        mustChangePassword: false,
      });

      const expired = await login(baseUrl, "ada", "correct password");
      const database = openDatabase({ SQLITE_DB_PATH: fixture.sqliteDbPath });
      try {
        database.prepare("UPDATE sessions SET expiresAt = '2000-01-01T00:00:00.000Z' WHERE tokenHash = ?")
          .run(createHash("sha256").update(expired.body.token).digest("hex"));
      } finally {
        database.close();
      }
      const expiredSession = await fetch(`${baseUrl}/api/academy/session`, { headers: { authorization: `Bearer ${expired.body.token}` } });
      assert.equal(expiredSession.status, 401);
      assert.deepEqual(await expiredSession.json(), { ok: false, error: "UNAUTHENTICATED" });

      const changed = await fetch(`${baseUrl}/api/academy/me/password`, {
        method: "POST",
        headers: { authorization: `Bearer ${signedIn.body.token}`, "content-type": "application/json" },
        body: JSON.stringify({ currentPassword: "correct password", newPassword: "new password" }),
      });
      assert.equal(changed.status, 200);
      assert.equal(changed.headers.get("cache-control"), "no-store");
      assert.deepEqual(await changed.json(), { ok: true });

      const revoked = await fetch(`${baseUrl}/api/academy/session`, { headers: { authorization: `Bearer ${signedIn.body.token}` } });
      assert.equal(revoked.status, 401);
      assert.deepEqual(await revoked.json(), { ok: false, error: "UNAUTHENTICATED" });

      const renewed = await login(baseUrl, "ada", "new password");
      const loggedOut = await fetch(`${baseUrl}/api/academy/logout`, { method: "POST", headers: { authorization: `Bearer ${renewed.body.token}` } });
      assert.equal(loggedOut.status, 200);
      assert.deepEqual(await loggedOut.json(), { ok: true });
    });
  } finally {
    await fixture.close();
  }
});

test("academy storage failures return a generic safe error", async () => {
  const originalPath = process.env.SQLITE_DB_PATH;
  process.env.SQLITE_DB_PATH = tmpdir();
  try {
    await withServer(createApp(), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/academy/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "ada", password: "password" }),
      });
      assert.equal(response.status, 500);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.deepEqual(await response.json(), { ok: false, error: "Internal server error" });
    });
  } finally {
    if (originalPath === undefined) delete process.env.SQLITE_DB_PATH;
    else process.env.SQLITE_DB_PATH = originalPath;
  }
});

test("academy middleware blocks forced-password users and enforces administrators", async () => {
  const fixture = await setup([
    { username: "forced", password: "password", mustChangePassword: true },
    { username: "parent", password: "password" },
    { username: "admin", password: "password", role: "admin" },
  ]);
  try {
    const app = createApp();
    const protectedRouter = Router();
    protectedRouter.get("/protected", academyAuthMiddleware, requirePasswordChange, (_req, res) => res.json({ ok: true }));
    protectedRouter.get("/admin", academyAuthMiddleware, requirePasswordChange, requireAcademyAdmin, (_req, res) => res.json({ ok: true }));
    app.use("/test", protectedRouter);
    await withServer(app, async (baseUrl) => {
      const forced = await login(baseUrl, "forced", "password");
      const forcedSession = await fetch(`${baseUrl}/api/academy/session`, { headers: { authorization: `Bearer ${forced.body.token}` } });
      assert.equal(forcedSession.status, 200);
      const blocked = await fetch(`${baseUrl}/test/protected`, { headers: { authorization: `Bearer ${forced.body.token}` } });
      assert.equal(blocked.status, 403);
      assert.deepEqual(await blocked.json(), { ok: false, error: "PASSWORD_CHANGE_REQUIRED" });

      const parent = await login(baseUrl, "parent", "password");
      const denied = await fetch(`${baseUrl}/test/admin`, { headers: { authorization: `Bearer ${parent.body.token}` } });
      assert.equal(denied.status, 403);
      assert.deepEqual(await denied.json(), { ok: false, error: "FORBIDDEN" });

      const admin = await login(baseUrl, "admin", "password");
      const allowed = await fetch(`${baseUrl}/test/admin`, { headers: { authorization: `Bearer ${admin.body.token}` } });
      assert.equal(allowed.status, 200);
    });
  } finally {
    await fixture.close();
  }
});

test("academy login rate-limits each IP after ten attempts", async () => {
  const fixture = await setup([{ username: "ada", password: "correct password" }]);
  try {
    await withServer(createApp(), async (baseUrl) => {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        assert.equal((await login(baseUrl, "ada", "wrong password")).response.status, 401);
      }
      const limited = await login(baseUrl, "ada", "wrong password");
      assert.equal(limited.response.status, 429);
      assert.equal(limited.response.headers.get("retry-after"), "900");
      assert.deepEqual(limited.body, { ok: false, error: "TOO_MANY_REQUESTS" });
    });
  } finally {
    await fixture.close();
  }
});
