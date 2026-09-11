import { createAcademyRouter as createAcademyAuthRouter } from "./academy-auth.ts";
import { createAcademyAdminUsersRouter } from "./academy-admin-users.ts";
import { createAcademyAdminCategoriesRouter, createAcademyAdminPostsRouter } from "./academy-admin-content.ts";
import { academyAuthMiddleware, requireAcademyAdmin, requirePasswordChange } from "./academy-middleware.ts";
import { createAcademyPostsRouter } from "./academy-posts.ts";
import { createAcademyAttachmentsRouter } from "./academy-attachments.ts";

export function createAcademyRouter() {
  const router = createAcademyAuthRouter();
  router.use("/admin/users", academyAuthMiddleware, requirePasswordChange, requireAcademyAdmin, createAcademyAdminUsersRouter());
  router.use("/admin/categories", academyAuthMiddleware, requirePasswordChange, requireAcademyAdmin, createAcademyAdminCategoriesRouter());
  router.use("/admin/posts", academyAuthMiddleware, requirePasswordChange, requireAcademyAdmin, createAcademyAttachmentsRouter());
  router.use("/admin/posts", academyAuthMiddleware, requirePasswordChange, requireAcademyAdmin, createAcademyAdminPostsRouter());
  router.use("/posts", academyAuthMiddleware, requirePasswordChange, createAcademyPostsRouter());
  return router;
}
