import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createHash, randomUUID } from "node:crypto";
import { readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import express, { Router } from "express";

import { createApp } from "../app.ts";
import { hashPassword } from "../modules/academy/password.ts";
import { applyAcademyMigrations } from "../modules/storage/academy-migrations.ts";
import { openDatabase } from "../modules/storage/sqlite.ts";
import { academyAuthMiddleware, requireAcademyAdmin, requirePasswordChange } from "./academy-middleware.ts";

async function setup(users: Array<{ id?: string; username: string; password: string; role?: "parent" | "admin"; mustChangePassword?: boolean }>) {
  const sqliteDbPath = join(tmpdir(), `academy-auth-${randomUUID()}.sqlite`);
  const database = openDatabase({ SQLITE_DB_PATH: sqliteDbPath });
  try {
    applyAcademyMigrations(database);
    for (const [index, user] of users.entries()) {
      database.prepare(`INSERT INTO users (id, displayName, username, normalizedUsername, role, passwordHash, mustChangePassword, disabledAt, deletedAt, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?)`).run(
        user.id ?? `user-${index}`, user.username, user.username, user.username.toLowerCase(), user.role ?? "parent",
        await hashPassword(user.password), user.mustChangePassword ? 1 : 0, new Date().toISOString(), new Date().toISOString(),
      );
    }
  } finally {
    database.close();
  }

  const fileStoragePath = join(tmpdir(), `academy-uploads-${randomUUID()}`);
  process.env.SQLITE_DB_PATH = sqliteDbPath;
  process.env.FILE_STORAGE_PATH = fileStoragePath;
  return {
    sqliteDbPath, fileStoragePath,
    async close() {
      delete process.env.SQLITE_DB_PATH;
      delete process.env.FILE_STORAGE_PATH;
      await rm(sqliteDbPath, { force: true });
      await rm(fileStoragePath, { recursive: true, force: true });
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

function academyError(code: "AUTHENTICATION_REQUIRED" | "FORBIDDEN" | "INTERNAL_ERROR" | "PASSWORD_CHANGE_REQUIRED" | "RATE_LIMITED") {
  const messages = {
    AUTHENTICATION_REQUIRED: "Authentication is required.",
    FORBIDDEN: "You do not have permission to perform this action.",
    INTERNAL_ERROR: "An unexpected error occurred.",
    PASSWORD_CHANGE_REQUIRED: "You must change your password.",
    RATE_LIMITED: "Too many login attempts. Please try again later.",
  };
  return { ok: false, error: { code, message: messages[code] } };
}

async function login(baseUrl: string, username: string, password: string) {
  const response = await fetch(`${baseUrl}/api/academy/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const payload = await response.json() as { ok: boolean; data?: { token: string; expiresAt: string; user: { mustChangePassword: boolean } } };
  const body = payload.ok ? { ...payload.data!, mustChangePassword: payload.data!.user.mustChangePassword } : payload;
  return { response, body: body as { token: string; mustChangePassword: boolean } };
}

test("academy auth routes expose the HTTP session contract", async () => {
  const fixture = await setup([{ username: "ada", password: "correct password" }]);
  try {
    await withServer(createApp(), async (baseUrl) => {
      const invalidJson = await fetch(`${baseUrl}/api/academy/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      });
      assert.equal(invalidJson.status, 400);
      assert.deepEqual(await invalidJson.json(), {
        ok: false,
        error: { code: "VALIDATION_ERROR", message: "The request is invalid." },
      });

      const invalidCredentials = await fetch(`${baseUrl}/api/academy/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "ada", password: "wrong password" }),
      });
      assert.equal(invalidCredentials.status, 401);
      assert.deepEqual(await invalidCredentials.json(), {
        ok: false,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid username or password." },
      });

      const loginResponse = await fetch(`${baseUrl}/api/academy/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "ada", password: "correct password" }),
      });
      const loginBody = await loginResponse.json() as { data: { token: string; expiresAt: string; user: Record<string, unknown> } };
      assert.equal(loginResponse.status, 200);
      assert.equal(typeof loginBody.data.token, "string");
      assert.equal(typeof loginBody.data.expiresAt, "string");
      assert.deepEqual(loginBody.data.user, { displayName: "ada", username: "ada", role: "parent", mustChangePassword: false });
      assert.equal("id" in loginBody.data.user, false);

      const sessionResponse = await fetch(`${baseUrl}/api/academy/session`, { headers: { authorization: `Bearer ${loginBody.data.token}` } });
      const sessionBody = await sessionResponse.json() as { data: { expiresAt: string; user: Record<string, unknown> } };
      assert.equal(sessionResponse.status, 200);
      assert.equal(Date.parse(sessionBody.data.expiresAt) >= Date.parse(loginBody.data.expiresAt), true);
      assert.deepEqual(sessionBody.data.user, { displayName: "ada", username: "ada", role: "parent", mustChangePassword: false });
      assert.equal("id" in sessionBody.data.user, false);

      const logout = await fetch(`${baseUrl}/api/academy/logout`, { method: "POST", headers: { authorization: `Bearer ${loginBody.data.token}` } });
      assert.equal(logout.status, 204);
      assert.equal(await logout.text(), "");
    });
  } finally {
    await fixture.close();
  }
});

test("academy password change keeps session identity internal and revokes expired or replaced sessions", async () => {
  const fixture = await setup([{ username: "ada", password: "correct password" }]);
  try {
    await withServer(createApp(), async (baseUrl) => {
      const signedIn = await login(baseUrl, "ada", "correct password");
      assert.equal(signedIn.response.status, 200);
      assert.equal(signedIn.response.headers.get("cache-control"), "no-store");
      assert.equal(typeof signedIn.body.token, "string");

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
      assert.deepEqual(await expiredSession.json(), {
        ok: false,
        error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication is required." },
      });

      const changed = await fetch(`${baseUrl}/api/academy/me/password`, {
        method: "POST",
        headers: { authorization: `Bearer ${signedIn.body.token}`, "content-type": "application/json" },
        body: JSON.stringify({ currentPassword: "correct password", newPassword: "new password" }),
      });
      assert.equal(changed.status, 204);
      assert.equal(changed.headers.get("cache-control"), "no-store");
      assert.equal(await changed.text(), "");

      const revoked = await fetch(`${baseUrl}/api/academy/session`, { headers: { authorization: `Bearer ${signedIn.body.token}` } });
      assert.equal(revoked.status, 401);
      assert.deepEqual(await revoked.json(), {
        ok: false,
        error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication is required." },
      });
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
      assert.deepEqual(await response.json(), academyError("INTERNAL_ERROR"));
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
      assert.deepEqual(await blocked.json(), academyError("PASSWORD_CHANGE_REQUIRED"));

      const parent = await login(baseUrl, "parent", "password");
      const denied = await fetch(`${baseUrl}/test/admin`, { headers: { authorization: `Bearer ${parent.body.token}` } });
      assert.equal(denied.status, 403);
      assert.deepEqual(await denied.json(), academyError("FORBIDDEN"));

      const admin = await login(baseUrl, "admin", "password");
      const allowed = await fetch(`${baseUrl}/test/admin`, { headers: { authorization: `Bearer ${admin.body.token}` } });
      assert.equal(allowed.status, 200);
    });
  } finally {
    await fixture.close();
  }
});

test("academy administrator user routes enforce lifecycle boundaries and keep passwords transient", async () => {
  const adminId = randomUUID();
  const fixture = await setup([
    { id: adminId, username: "admin", password: "password", role: "admin" },
    { username: "parent", password: "password" },
  ]);
  try {
    await withServer(createApp(), async (baseUrl) => {
      const unauthenticated = await fetch(`${baseUrl}/api/academy/admin/users`);
      assert.equal(unauthenticated.status, 401);
      assert.deepEqual(await unauthenticated.json(), academyError("AUTHENTICATION_REQUIRED"));

      const parent = await login(baseUrl, "parent", "password");
      const denied = await fetch(`${baseUrl}/api/academy/admin/users`, { headers: { authorization: `Bearer ${parent.body.token}` } });
      assert.equal(denied.status, 403);
      assert.deepEqual(await denied.json(), academyError("FORBIDDEN"));

      const admin = await login(baseUrl, "admin", "password");
      const headers = { authorization: `Bearer ${admin.body.token}`, "content-type": "application/json" };
      const listed = await fetch(`${baseUrl}/api/academy/admin/users?search=admin&role=admin&state=active&page=1&pageSize=1`, { headers });
      assert.equal(listed.status, 200);
      const listedBody = await listed.json() as { ok: boolean; data: { items: Array<{ id: string; passwordHash?: string; temporaryPassword?: string }>; pagination: { page: number; pageSize: number; total: number; pageCount: number } } };
      assert.equal(listedBody.data.items[0]?.id, adminId);
      assert.deepEqual(listedBody.data.pagination, { page: 1, pageSize: 1, total: 1, pageCount: 1 });
      assert.equal("passwordHash" in (listedBody.data.items[0] ?? {}), false);
      assert.equal("temporaryPassword" in (listedBody.data.items[0] ?? {}), false);

      const invalidQuery = await fetch(`${baseUrl}/api/academy/admin/users?state=unknown`, { headers });
      assert.equal(invalidQuery.status, 400);
      assert.deepEqual(await invalidQuery.json(), { ok: false, error: "VALIDATION_ERROR" });
      const invalidPagination = await fetch(`${baseUrl}/api/academy/admin/users?role=teacher&page=0&pageSize=101`, { headers });
      assert.equal(invalidPagination.status, 400);
      assert.deepEqual(await invalidPagination.json(), { ok: false, error: "VALIDATION_ERROR" });
      const invalidId = await fetch(`${baseUrl}/api/academy/admin/users/not-a-uuid`, { headers });
      assert.equal(invalidId.status, 400);
      assert.deepEqual(await invalidId.json(), { ok: false, error: "VALIDATION_ERROR" });
      const missing = await fetch(`${baseUrl}/api/academy/admin/users/${randomUUID()}`, { headers });
      assert.equal(missing.status, 404);
      assert.deepEqual(await missing.json(), { ok: false, error: "USER_NOT_FOUND" });

      const invalidCreate = await fetch(`${baseUrl}/api/academy/admin/users`, { method: "POST", headers, body: JSON.stringify({ displayName: "New", username: "admin", role: "admin" }) });
      assert.equal(invalidCreate.status, 400);
      assert.deepEqual(await invalidCreate.json(), { ok: false, error: "VALIDATION_ERROR" });

      const created = await fetch(`${baseUrl}/api/academy/admin/users`, { method: "POST", headers, body: JSON.stringify({ displayName: "New Parent", username: "new_parent" }) });
      assert.equal(created.status, 201);
      assert.equal(created.headers.get("cache-control"), "no-store");
      const createdBody = await created.json() as { ok: boolean; data: { user: { id: string; role: string; mustChangePassword: boolean }; temporaryPassword: string } };
      assert.equal(createdBody.data.user.role, "parent");
      assert.equal(createdBody.data.user.mustChangePassword, true);
      assert.equal(createdBody.data.temporaryPassword.length, 10);

      const duplicate = await fetch(`${baseUrl}/api/academy/admin/users`, { method: "POST", headers, body: JSON.stringify({ displayName: "Duplicate", username: "new_parent" }) });
      assert.equal(duplicate.status, 409);
      assert.deepEqual(await duplicate.json(), { ok: false, error: "USERNAME_TAKEN" });

      const detail = await fetch(`${baseUrl}/api/academy/admin/users/${createdBody.data.user.id}`, { headers });
      assert.equal(detail.status, 200);
      const detailBody = JSON.stringify(await detail.json());
      assert.equal(detailBody.includes(createdBody.data.temporaryPassword), false);
      assert.equal(detailBody.includes("passwordHash"), false);

      const reset = await fetch(`${baseUrl}/api/academy/admin/users/${createdBody.data.user.id}/reset-password`, { method: "POST", headers });
      assert.equal(reset.status, 200);
      assert.equal(reset.headers.get("cache-control"), "no-store");
      const resetBody = await reset.json() as { data: { temporaryPassword: string } };
      assert.equal(resetBody.data.temporaryPassword.length, 10);
      const afterReset = await fetch(`${baseUrl}/api/academy/admin/users/${createdBody.data.user.id}`, { headers });
      const afterResetBody = JSON.stringify(await afterReset.json());
      assert.equal(afterResetBody.includes(resetBody.data.temporaryPassword), false);
      assert.equal(afterResetBody.includes("passwordHash"), false);

      const invalidDisable = await fetch(`${baseUrl}/api/academy/admin/users/${createdBody.data.user.id}`, { method: "PATCH", headers, body: JSON.stringify({ disabled: false }) });
      assert.equal(invalidDisable.status, 400);
      assert.deepEqual(await invalidDisable.json(), { ok: false, error: "VALIDATION_ERROR" });
      const disabled = await fetch(`${baseUrl}/api/academy/admin/users/${createdBody.data.user.id}`, { method: "PATCH", headers, body: JSON.stringify({ disabled: true }) });
      assert.equal(disabled.status, 200);
      const disabledBody = await disabled.json() as { data: { state: string } };
      assert.equal(disabledBody.data.state, "disabled");
      assert.equal(JSON.stringify(disabledBody).includes("passwordHash"), false);
      assert.equal(JSON.stringify(disabledBody).includes("temporaryPassword"), false);
      const disabledList = await fetch(`${baseUrl}/api/academy/admin/users?state=disabled`, { headers });
      assert.equal((await disabledList.json() as { data: { items: Array<{ id: string }> } }).data.items[0]?.id, createdBody.data.user.id);

      const enabled = await fetch(`${baseUrl}/api/academy/admin/users/${createdBody.data.user.id}/enable`, { method: "POST", headers });
      assert.equal(enabled.status, 204);
      const removed = await fetch(`${baseUrl}/api/academy/admin/users/${createdBody.data.user.id}`, { method: "DELETE", headers });
      assert.equal(removed.status, 204);
      const deleted = await fetch(`${baseUrl}/api/academy/admin/users/${createdBody.data.user.id}/enable`, { method: "POST", headers });
      assert.equal(deleted.status, 404);
      assert.deepEqual(await deleted.json(), { ok: false, error: "USER_DELETED" });

      const lastAdmin = await fetch(`${baseUrl}/api/academy/admin/users/${adminId}`, { method: "PATCH", headers, body: JSON.stringify({ disabled: true }) });
      assert.equal(lastAdmin.status, 409);
      assert.deepEqual(await lastAdmin.json(), { ok: false, error: "LAST_ACTIVE_ADMIN" });
    });
  } finally {
    await fixture.close();
  }
});

test("academy publication routes enforce admin lifecycle and parent-safe reads", async () => {
  const fixture = await setup([
    { username: "admin", password: "password", role: "admin" },
    { username: "parent", password: "password" },
    { username: "forced", password: "password", role: "admin", mustChangePassword: true },
  ]);
  try {
    await withServer(createApp(), async (baseUrl) => {
      const admin = await login(baseUrl, "admin", "password");
      const parent = await login(baseUrl, "parent", "password");
      const forced = await login(baseUrl, "forced", "password");
      const headers = { authorization: `Bearer ${admin.body.token}`, "content-type": "application/json" };

      const denied = await fetch(`${baseUrl}/api/academy/admin/categories`, { headers: { authorization: `Bearer ${parent.body.token}` } });
      assert.equal(denied.status, 403);
      assert.deepEqual(await denied.json(), academyError("FORBIDDEN"));
      const forcedDenied = await fetch(`${baseUrl}/api/academy/admin/categories`, { headers: { authorization: `Bearer ${forced.body.token}` } });
      assert.equal(forcedDenied.status, 403);
      assert.deepEqual(await forcedDenied.json(), academyError("PASSWORD_CHANGE_REQUIRED"));

      const invalidCategory = await fetch(`${baseUrl}/api/academy/admin/categories`, { method: "POST", headers, body: JSON.stringify({ displayName: " " }) });
      assert.equal(invalidCategory.status, 400);
      const category = await fetch(`${baseUrl}/api/academy/admin/categories`, { method: "POST", headers, body: JSON.stringify({ displayName: " News " }) });
      assert.equal(category.status, 201);
      const categoryBody = await category.json() as { data: { id: string; displayName: string } };
      assert.equal(categoryBody.data.displayName, "News");
      const changedCategory = await fetch(`${baseUrl}/api/academy/admin/categories/${categoryBody.data.id}`, { method: "PATCH", headers, body: JSON.stringify({ displayName: "Updates" }) });
      assert.equal(changedCategory.status, 200);

      const invalidPost = await fetch(`${baseUrl}/api/academy/admin/posts`, { method: "POST", headers, body: JSON.stringify({ title: "Missing source" }) });
      assert.equal(invalidPost.status, 400);
      const created = await fetch(`${baseUrl}/api/academy/admin/posts`, { method: "POST", headers, body: JSON.stringify({ title: "100%_\\ story", markdownSource: "<img src=x onerror=1>", categoryId: categoryBody.data.id }) });
      assert.equal(created.status, 201);
      const post = await created.json() as { data: { id: string; visibility: string } };
      assert.equal(post.data.visibility, "visible");
      const adminDetail = await fetch(`${baseUrl}/api/academy/admin/posts/${post.data.id}`, { headers });
      assert.equal(adminDetail.status, 200);
      assert.match(JSON.stringify(await adminDetail.json()), /markdownSource/);

      const parentList = await fetch(`${baseUrl}/api/academy/posts?search=100%25_%5C&categoryId=${categoryBody.data.id}&page=1&pageSize=1`, { headers: { authorization: `Bearer ${parent.body.token}` } });
      assert.equal(parentList.status, 200);
      const parentListBody = await parentList.json() as { data: { items: Array<Record<string, unknown>>; pagination: { page: number; pageSize: number; total: number } } };
      assert.equal(parentListBody.data.pagination.page, 1);
      assert.deepEqual(parentListBody.data.pagination, { page: 1, pageSize: 1, total: 1, pageCount: 1 });
      assert.equal(parentListBody.data.items[0]?.id, post.data.id);
      assert.match(parentListBody.data.items[0]?.renderedMarkdown as string, /&lt;img/);
      assert.equal("markdownSource" in (parentListBody.data.items[0] ?? {}), false);
      assert.equal("visibility" in (parentListBody.data.items[0] ?? {}), false);
      assert.equal("deletedAt" in (parentListBody.data.items[0] ?? {}), false);
      assert.equal("attachments" in (parentListBody.data.items[0] ?? {}), false);
      const invalidParentQuery = await fetch(`${baseUrl}/api/academy/posts?page=0`, { headers: { authorization: `Bearer ${parent.body.token}` } });
      assert.equal(invalidParentQuery.status, 400);

      const hidden = await fetch(`${baseUrl}/api/academy/admin/posts/${post.data.id}/hide`, { method: "POST", headers });
      assert.equal(hidden.status, 200);
      const hiddenAdminList = await fetch(`${baseUrl}/api/academy/admin/posts?status=hidden`, { headers });
      assert.equal(hiddenAdminList.status, 200);
      assert.equal((await hiddenAdminList.json() as { data: { items: Array<{ id: string }> } }).data.items[0]?.id, post.data.id);
      const invalidStatus = await fetch(`${baseUrl}/api/academy/admin/posts?status=unknown`, { headers });
      assert.equal(invalidStatus.status, 400);
      const staleParentDetail = await fetch(`${baseUrl}/api/academy/posts/${post.data.id}`, { headers: { authorization: `Bearer ${parent.body.token}` } });
      assert.equal(staleParentDetail.status, 404);
      assert.deepEqual(await staleParentDetail.json(), { ok: false, error: "POST_NOT_FOUND" });

      const shown = await fetch(`${baseUrl}/api/academy/admin/posts/${post.data.id}/show`, { method: "POST", headers });
      assert.equal(shown.status, 200);
      const edited = await fetch(`${baseUrl}/api/academy/admin/posts/${post.data.id}`, { method: "PATCH", headers, body: JSON.stringify({ title: "Edited" }) });
      assert.equal(edited.status, 200);
      const removed = await fetch(`${baseUrl}/api/academy/admin/posts/${post.data.id}`, { method: "DELETE", headers });
      assert.equal(removed.status, 204);
      const restore = await fetch(`${baseUrl}/api/academy/admin/posts/${post.data.id}/show`, { method: "POST", headers });
      assert.equal(restore.status, 404);
      assert.deepEqual(await restore.json(), { ok: false, error: "POST_DELETED" });
      const categoryInUse = await fetch(`${baseUrl}/api/academy/admin/categories/${categoryBody.data.id}`, { method: "DELETE", headers });
      assert.equal(categoryInUse.status, 409);
      assert.deepEqual(await categoryInUse.json(), { ok: false, error: "CATEGORY_IN_USE" });
    });
  } finally {
    await fixture.close();
  }
});

test("academy attachment upload streams one valid file to opaque durable storage", async () => {
  const fixture = await setup([{ username: "admin", password: "password", role: "admin" }]);
  try {
    await withServer(createApp(), async (baseUrl) => {
      const admin = await login(baseUrl, "admin", "password");
      const headers = { authorization: `Bearer ${admin.body.token}`, "content-type": "application/json" };
      const post = await fetch(`${baseUrl}/api/academy/admin/posts`, { method: "POST", headers, body: JSON.stringify({ title: "Post", markdownSource: "" }) });
      const { data } = await post.json() as { data: { id: string } };
      const form = new FormData();
      form.append("file", new Blob(["%PDF-1.7"], { type: "application/pdf" }), "untrusted.pdf");
      form.append("title", "Material");
      const uploaded = await fetch(`${baseUrl}/api/academy/admin/posts/${data.id}/attachments`, { method: "POST", headers: { authorization: `Bearer ${admin.body.token}` }, body: form });
      assert.equal(uploaded.status, 201);
      const body = await uploaded.json() as { data: Record<string, unknown> };
      assert.equal(body.data.visibleTitle, "Material");
      assert.equal("storageId" in body.data, false);
      assert.equal(JSON.stringify(body).includes("untrusted.pdf"), false);
      assert.match((await readdir(fixture.fileStoragePath))[0]!, /^[0-9a-f-]+\.pdf$/);
    });
  } finally { await fixture.close(); }
});

test("academy attachment upload handles failed writes without unhandled rejections", async () => {
  const fixture = await setup([{ username: "admin", password: "password", role: "admin" }]);
  const errors: unknown[] = [], onUnhandled = (error: unknown) => errors.push(error), abort = new AbortController();
  const originalPath = process.env.FILE_STORAGE_PATH; process.env.FILE_STORAGE_PATH = "/proc"; process.on("unhandledRejection", onUnhandled);
  try {
    await withServer(createApp(), async (baseUrl) => {
      const admin = await login(baseUrl, "admin", "password");
      void fetch(`${baseUrl}/api/academy/admin/posts/${randomUUID()}/attachments`, { method: "POST", headers: { authorization: `Bearer ${admin.body.token}`, "content-type": "multipart/form-data; boundary=x" }, body: new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode("--x\r\nContent-Disposition: form-data; name=\"file\"; filename=\"x.pdf\"\r\nContent-Type: application/pdf\r\n\r\n%PDF-")); } }), duplex: "half", signal: abort.signal } as RequestInit & { duplex: "half" }).catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, 50)); abort.abort(); assert.equal(errors.length, 0);
    });
  } finally { process.off("unhandledRejection", onUnhandled); if (originalPath === undefined) delete process.env.FILE_STORAGE_PATH; else process.env.FILE_STORAGE_PATH = originalPath; await fixture.close(); }
});

test("academy attachment mutations are admin-only and deleted metadata remains administrator-only", async () => {
  const fixture = await setup([
    { username: "admin", password: "password", role: "admin" },
    { username: "parent", password: "password" },
  ]);
  try {
    await withServer(createApp(), async (baseUrl) => {
      const admin = await login(baseUrl, "admin", "password");
      const parent = await login(baseUrl, "parent", "password");
      const headers = { authorization: `Bearer ${admin.body.token}`, "content-type": "application/json" };
      const post = await fetch(`${baseUrl}/api/academy/admin/posts`, { method: "POST", headers, body: JSON.stringify({ title: "Post", markdownSource: "" }) });
      const { data: created } = await post.json() as { data: { id: string } };
      const form = new FormData();
      form.append("file", new Blob(["%PDF-1.7"], { type: "application/pdf" }), "client-name.pdf");
      form.append("title", "Original");
      const upload = await fetch(`${baseUrl}/api/academy/admin/posts/${created.id}/attachments`, { method: "POST", headers: { authorization: `Bearer ${admin.body.token}` }, body: form });
      const { data: attachment } = await upload.json() as { data: { id: string } };
      const denied = await fetch(`${baseUrl}/api/academy/admin/attachments/${attachment.id}`, { method: "PATCH", headers: { authorization: `Bearer ${parent.body.token}`, "content-type": "application/json" }, body: JSON.stringify({ title: "No" }) });
      assert.equal(denied.status, 403);
      const renamed = await fetch(`${baseUrl}/api/academy/admin/attachments/${attachment.id}`, { method: "PATCH", headers, body: JSON.stringify({ title: " Renamed " }) });
      assert.equal(renamed.status, 200);
      assert.equal((await renamed.json() as { data: { visibleTitle: string } }).data.visibleTitle, "Renamed");
      const removed = await fetch(`${baseUrl}/api/academy/admin/attachments/${attachment.id}`, { method: "DELETE", headers });
      assert.equal(removed.status, 204);
      assert.equal((await readdir(fixture.fileStoragePath)).length, 1);
      const adminDetail = await fetch(`${baseUrl}/api/academy/admin/posts/${created.id}`, { headers });
      const adminAttachments = (await adminDetail.json() as { data: { attachments: Array<{ deletedAt: string | null }> } }).data.attachments;
      assert.equal(adminAttachments[0]?.deletedAt !== null, true);
      const parentDetail = await fetch(`${baseUrl}/api/academy/posts/${created.id}`, { headers: { authorization: `Bearer ${parent.body.token}` } });
      assert.deepEqual((await parentDetail.json() as { data: { attachments: unknown[] } }).data.attachments, []);
    });
  } finally { await fixture.close(); }
});

test("academy attachment streams authenticate, recheck access, and hide storage details", async () => {
  const fixture = await setup([
    { username: "admin", password: "password", role: "admin" },
    { username: "parent", password: "password" },
    { username: "forced", password: "password", mustChangePassword: true },
  ]);
  try {
    await withServer(createApp(), async (baseUrl) => {
      const admin = await login(baseUrl, "admin", "password");
      const parent = await login(baseUrl, "parent", "password");
      const forced = await login(baseUrl, "forced", "password");
      const headers = { authorization: `Bearer ${admin.body.token}`, "content-type": "application/json" };
      const post = await fetch(`${baseUrl}/api/academy/admin/posts`, { method: "POST", headers, body: JSON.stringify({ title: "Post", markdownSource: "" }) });
      const { data: created } = await post.json() as { data: { id: string } };
      const form = new FormData();
      form.append("file", new Blob(["%PDF-1.7"], { type: "application/pdf" }), "client-name.pdf");
      form.append("title", "Study: one");
      const upload = await fetch(`${baseUrl}/api/academy/admin/posts/${created.id}/attachments`, { method: "POST", headers: { authorization: `Bearer ${admin.body.token}` }, body: form });
      const { data: attachment } = await upload.json() as { data: { id: string } };
      const previewUrl = `${baseUrl}/api/academy/attachments/${attachment.id}/preview`;

      assert.equal((await fetch(previewUrl)).status, 401);
      const ranged = await fetch(previewUrl, { headers: { authorization: `Bearer ${parent.body.token}`, range: "bytes=0-2" } });
      assert.equal(ranged.status, 200);
      assert.equal(ranged.headers.get("content-range"), null);
      assert.equal(await ranged.text(), "%PDF-1.7");
      const preview = await fetch(previewUrl, { headers: { authorization: `Bearer ${parent.body.token}` } });
      assert.equal(preview.status, 200);
      assert.equal(preview.headers.get("content-type"), "application/pdf");
      assert.equal(preview.headers.get("x-content-type-options"), "nosniff");
      assert.equal(preview.headers.get("cache-control"), "private, no-store");
      assert.equal(preview.headers.get("content-disposition"), "inline; filename=\"Study one.pdf\"");
      assert.equal(await preview.text(), "%PDF-1.7");
      assert.equal(JSON.stringify([...preview.headers]).includes("client-name"), false);

      const download = await fetch(`${baseUrl}/api/academy/attachments/${attachment.id}/download`, { headers: { authorization: `Bearer ${admin.body.token}` } });
      assert.equal(download.status, 200);
      assert.equal(download.headers.get("content-disposition"), "attachment; filename=\"Study one.pdf\"");
      await download.arrayBuffer();
      const forcedBlocked = await fetch(previewUrl, { headers: { authorization: `Bearer ${forced.body.token}` } });
      assert.equal(forcedBlocked.status, 403);

      await fetch(`${baseUrl}/api/academy/admin/posts/${created.id}/hide`, { method: "POST", headers });
      assert.equal((await fetch(previewUrl, { headers: { authorization: `Bearer ${parent.body.token}` } })).status, 404);
      assert.equal((await fetch(previewUrl, { headers: { authorization: `Bearer ${admin.body.token}` } })).status, 200);
      await fetch(`${baseUrl}/api/academy/admin/attachments/${attachment.id}`, { method: "DELETE", headers });
      assert.equal((await fetch(previewUrl, { headers: { authorization: `Bearer ${parent.body.token}` } })).status, 404);
      assert.equal((await fetch(previewUrl, { headers: { authorization: `Bearer ${admin.body.token}` } })).status, 200);
      await fetch(`${baseUrl}/api/academy/admin/posts/${created.id}`, { method: "DELETE", headers });
      assert.equal((await fetch(`${baseUrl}/api/academy/attachments/${attachment.id}/download`, { headers: { authorization: `Bearer ${admin.body.token}` } })).status, 200);

      await rm(join(fixture.fileStoragePath, (await readdir(fixture.fileStoragePath))[0]!), { force: true });
      const missing = await fetch(previewUrl, { headers: { authorization: `Bearer ${admin.body.token}` } });
      assert.equal(missing.status, 500);
      assert.equal((await missing.arrayBuffer()).byteLength, 0);
    });
  } finally { await fixture.close(); }
});

test("academy attachment metadata is ordered alphabetically by visible title or material fallback", async () => {
  const fixture = await setup([{ username: "admin", password: "password", role: "admin" }]);
  try {
    await withServer(createApp(), async (baseUrl) => {
      const admin = await login(baseUrl, "admin", "password");
      const headers = { authorization: `Bearer ${admin.body.token}`, "content-type": "application/json" };
      const post = await fetch(`${baseUrl}/api/academy/admin/posts`, { method: "POST", headers, body: JSON.stringify({ title: "Post", markdownSource: "" }) });
      const { data: created } = await post.json() as { data: { id: string } };
      for (const title of ["Zulu", "Alpha", ""]) {
        const form = new FormData();
        form.append("file", new Blob(["%PDF-1.7"], { type: "application/pdf" }), "untrusted.pdf");
        form.append("title", title);
        assert.equal((await fetch(`${baseUrl}/api/academy/admin/posts/${created.id}/attachments`, { method: "POST", headers: { authorization: `Bearer ${admin.body.token}` }, body: form })).status, 201);
      }
      const detail = await fetch(`${baseUrl}/api/academy/admin/posts/${created.id}`, { headers });
      assert.deepEqual((await detail.json() as { data: { attachments: Array<{ visibleTitle: string | null; materialOrdinal: number }> } }).data.attachments.map(({ visibleTitle, materialOrdinal }) => [visibleTitle, materialOrdinal]), [["Alpha", 2], [null, 3], ["Zulu", 1]]);
    });
  } finally { await fixture.close(); }
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
      assert.deepEqual(limited.body, academyError("RATE_LIMITED"));
    });
  } finally {
    await fixture.close();
  }
});
