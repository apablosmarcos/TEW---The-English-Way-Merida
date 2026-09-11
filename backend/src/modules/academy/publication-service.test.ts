import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { AcademyPublicationError } from "./academy-errors.ts";
import { AuditRepository } from "./audit-repository.ts";
import { PublicationRepository } from "./publication-repository.ts";
import { PublicationService } from "./publication-service.ts";
import { applyAcademyMigrations } from "../storage/academy-migrations.ts";

function setup() {
  const database = new DatabaseSync(":memory:");
  applyAcademyMigrations(database);
  database.prepare("INSERT INTO users (id, displayName, username, normalizedUsername, role, passwordHash, mustChangePassword, createdAt, updatedAt) VALUES ('admin', 'Admin', 'admin', 'admin', 'admin', 'hash', 0, 'now', 'now')").run();
  let time = 0;
  const clock = () => new Date(Date.UTC(2026, 0, 1, 0, 0, time++)).toISOString();
  return { database, service: new PublicationService(new PublicationRepository(database), new AuditRepository(database), clock) };
}

test("manages normalized categories and retains every referenced category", () => {
  const { database, service } = setup();
  const category = service.createCategory("admin", { displayName: "  News  " });
  assert.equal(category.displayName, "News");
  assert.deepEqual(service.listCategories().map(({ id }) => id), [category.id]);
  assert.throws(() => service.createCategory("admin", { displayName: "news" }), { code: "CATEGORY_NAME_TAKEN" });
  const updated = service.updateCategory("admin", category.id, { displayName: "Updates" });
  assert.notEqual(updated.updatedAt, category.updatedAt);
  const hidden = service.createPost("admin", { title: "Hidden", markdownSource: "secret", categoryId: category.id });
  service.hidePost("admin", hidden.id);
  const deleted = service.createPost("admin", { title: "Deleted", markdownSource: "secret", categoryId: category.id });
  service.deletePost("admin", deleted.id);
  assert.throws(() => service.deleteCategory("admin", category.id), { code: "CATEGORY_IN_USE" });
  assert.equal(service.listCategories()[0]?.id, category.id);
  assert.equal(JSON.stringify(database.prepare("SELECT * FROM audit_log").all()).includes("secret"), false);
});

test("creates visible posts, advances timestamps, blocks deleted mutations, and rolls back failed audits", () => {
  const { database, service } = setup();
  const post = service.createPost("admin", { title: "First", markdownSource: "# One" });
  assert.equal(post.visibility, "visible");
  const edited = service.editPost("admin", post.id, { title: "Second" });
  assert.notEqual(edited.updatedAt, post.updatedAt);
  assert.equal(service.showPost("admin", post.id).visibility, "visible");
  assert.equal(service.hidePost("admin", post.id).visibility, "hidden");
  service.deletePost("admin", post.id);
  assert.throws(() => service.showPost("admin", post.id), { code: "POST_DELETED" });
  assert.throws(() => service.editPost("admin", post.id, { title: "No restore" }), { code: "POST_DELETED" });
  database.exec("CREATE TRIGGER abort_post BEFORE INSERT ON audit_log WHEN NEW.action = 'post.created' BEGIN SELECT RAISE(ABORT, 'audit failed'); END;");
  assert.throws(() => service.createPost("admin", { title: "Rolled back", markdownSource: "body" }), /audit failed/);
  assert.equal(service.listAdminPosts().some((item) => item.title === "Rolled back"), false);
});

test("keeps parent reads visible, literal, paginated, and metadata-safe while admins inspect all states", () => {
  const { service } = setup();
  const category = service.createCategory("admin", { displayName: "General" });
  const literal = service.createPost("admin", { title: "100%_\\ match", markdownSource: "<img src=x onerror=1>", categoryId: category.id });
  service.createPost("admin", { title: "100AZ match", markdownSource: "wildcard", categoryId: category.id });
  const old = service.createPost("admin", { title: "Older", markdownSource: "old" });
  const hidden = service.createPost("admin", { title: "100%_\\ hidden", markdownSource: "hidden", categoryId: category.id });
  service.hidePost("admin", hidden.id);
  const deleted = service.createPost("admin", { title: "Deleted", markdownSource: "deleted" });
  service.deletePost("admin", deleted.id);
  const parent = service.listParentPosts({ search: "100%_\\", categoryId: category.id, pageSize: 1 });
  assert.deepEqual(parent.items.map((item) => item.id), [literal.id]);
  assert.equal(parent.total, 1);
  assert.equal("visibility" in parent.items[0]!, false);
  assert.equal("deletedAt" in parent.items[0]!, false);
  assert.equal("markdownSource" in parent.items[0]!, false);
  assert.match(parent.items[0]!.renderedMarkdown, /&lt;img/);
  assert.equal("attachments" in parent.items[0]!, false);
  assert.deepEqual(service.listParentPosts({ pageSize: 1 }).items.map((item) => item.id), [old.id]);
  assert.equal(service.getParentPost(hidden.id), undefined);
  assert.equal(service.getParentPost(deleted.id), undefined);
  assert.equal(service.getParentPost(old.id)?.id, old.id);
  assert.deepEqual(service.listAdminPosts().map((item) => item.visibility), ["deleted", "hidden", "visible", "visible", "visible"]);
  assert.equal(service.getAdminPost(deleted.id)?.deletedAt !== null, true);
});
