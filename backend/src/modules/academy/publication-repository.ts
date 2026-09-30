import { DatabaseSync } from "node:sqlite";

import type { AcademyCategory, PublicationListOptions, PublicationVisibility, PostEditInput } from "./academy-types.ts";

export type StoredPost = {
  id: string; title: string; markdownSource: string; categoryId: string | null; categoryDisplayName: string | null;
  visibility: PublicationVisibility; publishedAt: string; updatedAt: string; deletedAt: string | null;
};

const selectPost = `SELECT p.id, p.title, p.markdownSource, p.categoryId, c.displayName AS categoryDisplayName,
  p.visibility, p.publishedAt, p.updatedAt, p.deletedAt FROM posts p LEFT JOIN categories c ON c.id = p.categoryId`;

export class PublicationRepository {
  private readonly database: DatabaseSync;
  constructor(database: DatabaseSync) { this.database = database; }

  transaction<T>(action: () => T) { this.database.exec("BEGIN IMMEDIATE"); try { const result = action(); this.database.exec("COMMIT"); return result; } catch (error) { this.database.exec("ROLLBACK"); throw error; } }
  listCategories() { return this.database.prepare("SELECT id, displayName, createdAt, updatedAt FROM categories ORDER BY displayName COLLATE NOCASE, id").all() as AcademyCategory[]; }
  listParentCategories() { return this.database.prepare("SELECT c.id, c.displayName, c.createdAt, c.updatedAt FROM categories c WHERE EXISTS (SELECT 1 FROM posts p WHERE p.categoryId = c.id AND p.visibility = 'visible' AND p.deletedAt IS NULL) ORDER BY c.displayName COLLATE NOCASE, c.id").all() as AcademyCategory[]; }
  category(id: string) { return this.database.prepare("SELECT id, displayName, createdAt, updatedAt FROM categories WHERE id = ?").get(id) as AcademyCategory | undefined; }
  categoryNameTaken(normalizedName: string, exceptId: string | null = null) { return !!this.database.prepare("SELECT 1 FROM categories WHERE normalizedName = ? AND (? IS NULL OR id != ?)").get(normalizedName, exceptId, exceptId); }
  createCategory(id: string, displayName: string, normalizedName: string, now: string) { this.database.prepare("INSERT INTO categories (id, displayName, normalizedName, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)").run(id, displayName, normalizedName, now, now); return this.category(id)!; }
  updateCategory(id: string, displayName: string, normalizedName: string, now: string) { this.database.prepare("UPDATE categories SET displayName = ?, normalizedName = ?, updatedAt = ? WHERE id = ?").run(displayName, normalizedName, now, id); return this.category(id)!; }
  deleteCategory(id: string) { this.database.prepare("DELETE FROM categories WHERE id = ?").run(id); }
  categoryHasPosts(id: string) { return !!this.database.prepare("SELECT 1 FROM posts WHERE categoryId = ?").get(id); }

  createPost(id: string, title: string, markdownSource: string, categoryId: string | null, now: string) { this.database.prepare("INSERT INTO posts (id, title, markdownSource, categoryId, visibility, publishedAt, updatedAt, deletedAt) VALUES (?, ?, ?, ?, 'visible', ?, ?, NULL)").run(id, title, markdownSource, categoryId, now, now); return this.post(id)!; }
  post(id: string) { return this.database.prepare(`${selectPost} WHERE p.id = ?`).get(id) as StoredPost | undefined; }
  updatePost(id: string, input: PostEditInput, now: string) {
    const fields: string[] = ["updatedAt = ?"]; const values: Array<string | null> = [now];
    if (input.title !== undefined) { fields.push("title = ?"); values.push(input.title); }
    if (input.markdownSource !== undefined) { fields.push("markdownSource = ?"); values.push(input.markdownSource); }
    if ("categoryId" in input) { fields.push("categoryId = ?"); values.push(input.categoryId ?? null); }
    values.push(id); this.database.prepare(`UPDATE posts SET ${fields.join(", ")} WHERE id = ?`).run(...values); return this.post(id)!;
  }
  setVisibility(id: string, visibility: PublicationVisibility, now: string) { this.database.prepare("UPDATE posts SET visibility = ?, deletedAt = ?, updatedAt = ? WHERE id = ?").run(visibility, visibility === "deleted" ? now : null, now, id); return this.post(id)!; }
  listAdminPosts() { return this.database.prepare(`${selectPost} ORDER BY p.publishedAt DESC, p.id DESC`).all() as StoredPost[]; }
  parentPost(id: string) { return this.database.prepare(`${selectPost} WHERE p.id = ? AND p.visibility = 'visible' AND p.deletedAt IS NULL`).get(id) as StoredPost | undefined; }
  listParentPosts(options: PublicationListOptions, page: number, pageSize: number) {
    const where = ["p.visibility = 'visible'", "p.deletedAt IS NULL"]; const values: string[] = [];
    if (options.categoryId) { where.push("p.categoryId = ?"); values.push(options.categoryId); }
    if (options.search?.trim()) { where.push("p.title LIKE ? ESCAPE '\\'"); values.push(`%${escapeLike(options.search.trim().normalize("NFC"))}%`); }
    const clause = `WHERE ${where.join(" AND ")}`;
    const total = (this.database.prepare(`SELECT COUNT(*) AS count FROM posts p ${clause}`).get(...values) as { count: number }).count;
    const items = this.database.prepare(`${selectPost} ${clause} ORDER BY p.publishedAt DESC, p.id DESC LIMIT ? OFFSET ?`).all(...values, pageSize, (page - 1) * pageSize) as StoredPost[];
    return { items, total };
  }
}

function escapeLike(value: string) { return value.replace(/[\\%_]/g, "\\$&"); }
