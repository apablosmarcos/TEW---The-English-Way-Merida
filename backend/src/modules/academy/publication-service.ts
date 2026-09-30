import { randomUUID } from "node:crypto";

import { AcademyPublicationError } from "./academy-errors.ts";
import { AttachmentRepository, type StoredAttachment } from "./attachment-repository.ts";
import { AuditRepository } from "./audit-repository.ts";
import { renderMarkdown } from "./markdown.ts";
import { PublicationRepository, type StoredPost } from "./publication-repository.ts";
import type { AcademyAttachment, AcademyCategory, AcademyPost, AdminPostDetail, CategoryInput, ParentPost, ParentPostDetail, PostEditInput, PostInput, PublicationList, PublicationListOptions, PublicationVisibility } from "./academy-types.ts";

export class PublicationService {
  private readonly publications: PublicationRepository;
  private readonly audit: AuditRepository;
  private readonly clock: () => string;
  private readonly attachments?: AttachmentRepository;
  constructor(publications: PublicationRepository, audit: AuditRepository, clock = () => new Date().toISOString(), attachments?: AttachmentRepository) { this.publications = publications; this.audit = audit; this.clock = clock; this.attachments = attachments; }

  listCategories() { return this.publications.listCategories(); }
  createCategory(actorUserId: string | null, input: CategoryInput) {
    const displayName = name(input.displayName), normalizedName = normalize(displayName), now = this.clock();
    return this.publications.transaction(() => { if (this.publications.categoryNameTaken(normalizedName)) throw publicationError("CATEGORY_NAME_TAKEN"); const category = this.publications.createCategory(randomUUID(), displayName, normalizedName, now); this.audit.append(actorUserId, "category.created", category.id, now, "category"); return category; });
  }
  updateCategory(actorUserId: string | null, id: string, input: CategoryInput) {
    const displayName = name(input.displayName), normalizedName = normalize(displayName), now = this.clock();
    return this.publications.transaction(() => { if (!this.publications.category(id)) throw publicationError("CATEGORY_NOT_FOUND"); if (this.publications.categoryNameTaken(normalizedName, id)) throw publicationError("CATEGORY_NAME_TAKEN"); const category = this.publications.updateCategory(id, displayName, normalizedName, now); this.audit.append(actorUserId, "category.updated", id, now, "category"); return category; });
  }
  deleteCategory(actorUserId: string | null, id: string) {
    this.publications.transaction(() => { if (!this.publications.category(id)) throw publicationError("CATEGORY_NOT_FOUND"); if (this.publications.categoryHasPosts(id)) throw publicationError("CATEGORY_IN_USE"); const now = this.clock(); this.publications.deleteCategory(id); this.audit.append(actorUserId, "category.deleted", id, now, "category"); });
  }

  createPost(actorUserId: string | null, input: PostInput) {
    const now = this.clock();
    return this.publications.transaction(() => { this.assertCategory(input.categoryId); const post = this.publications.createPost(randomUUID(), input.title.trim(), input.markdownSource, input.categoryId ?? null, now); this.audit.append(actorUserId, "post.created", post.id, now, "post"); return admin(post); });
  }
  editPost(actorUserId: string | null, id: string, input: PostEditInput) {
    const now = this.clock();
    return this.publications.transaction(() => { this.mutable(id); if ("categoryId" in input) this.assertCategory(input.categoryId); const post = this.publications.updatePost(id, { ...input, ...(input.title === undefined ? {} : { title: input.title.trim() }) }, now); this.audit.append(actorUserId, "post.updated", id, now, "post"); return admin(post); });
  }
  showPost(actorUserId: string | null, id: string) { return this.visibility(actorUserId, id, "visible", "post.shown"); }
  hidePost(actorUserId: string | null, id: string) { return this.visibility(actorUserId, id, "hidden", "post.hidden"); }
  deletePost(actorUserId: string | null, id: string) { return this.visibility(actorUserId, id, "deleted", "post.deleted"); }
  getAdminPost(id: string): AdminPostDetail | undefined { const post = this.publications.post(id); return post && { ...admin(post), attachments: this.attachmentMetadata(id, true) }; }
  listAdminPosts() { return this.publications.listAdminPosts().map(admin); }
  getParentPost(id: string): ParentPostDetail | undefined { const post = this.publications.parentPost(id); return post && { ...parent(post), attachments: this.attachmentMetadata(id, false).map(parentAttachment) }; }
  listParentPosts(options: PublicationListOptions = {}): PublicationList {
    const pageSize = Math.min(50, positive(options.pageSize, 20));
    const page = Math.min(Math.floor(Number.MAX_SAFE_INTEGER / pageSize) + 1, positive(options.page, 1));
    const result = this.publications.listParentPosts(options, page, pageSize);
    return { categories: this.publications.listParentCategories(), items: result.items.map(parent), total: result.total, page, pageSize };
  }

  private visibility(actorUserId: string | null, id: string, visibility: PublicationVisibility, action: string) { const now = this.clock(); return this.publications.transaction(() => { this.mutable(id); const post = this.publications.setVisibility(id, visibility, now); this.audit.append(actorUserId, action, id, now, "post"); return admin(post); }); }
  private attachmentMetadata(postId: string, includeDeleted: boolean) { return this.attachments?.list(postId, includeDeleted).map(attachment) ?? []; }
  private mutable(id: string) { const post = this.publications.post(id); if (!post) throw publicationError("POST_NOT_FOUND"); if (post.deletedAt) throw publicationError("POST_DELETED"); return post; }
  private assertCategory(id: string | null | undefined) { if (id && !this.publications.category(id)) throw publicationError("CATEGORY_NOT_FOUND"); }
}

function name(value: string) { return value.trim().normalize("NFC"); }
function normalize(value: string) { return value.toLowerCase(); }
function publicationError(code: AcademyPublicationError["code"]): never { throw new AcademyPublicationError(code); }
function positive(value: number | undefined, fallback: number) { return Number.isFinite(value) ? Math.max(1, Math.floor(value!)) : fallback; }
function category(post: StoredPost) { return post.categoryId ? { id: post.categoryId, displayName: post.categoryDisplayName! } : null; }
function admin(post: StoredPost): AcademyPost { return { id: post.id, title: post.title, markdownSource: post.markdownSource, categoryId: post.categoryId, category: category(post), visibility: post.visibility, publishedAt: post.publishedAt, updatedAt: post.updatedAt, deletedAt: post.deletedAt }; }
function parent(post: StoredPost): ParentPost { return { id: post.id, title: post.title, category: category(post), publishedAt: post.publishedAt, updatedAt: post.updatedAt, renderedMarkdown: renderMarkdown(post.markdownSource) }; }
function attachment(stored: StoredAttachment): AcademyAttachment { const { storageId: _storageId, ...metadata } = stored; return metadata; }
function parentAttachment(stored: AcademyAttachment) { const { deletedAt: _deletedAt, ...metadata } = stored; return metadata; }
