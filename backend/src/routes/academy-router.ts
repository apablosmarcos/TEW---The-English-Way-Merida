import { createAcademyRouter as createAcademyAuthRouter } from "./academy-auth.ts";
import { createAcademyAdminUsersRouter } from "./academy-admin-users.ts";
import { academyAuthMiddleware, requireAcademyAdmin, requirePasswordChange } from "./academy-middleware.ts";

export function createAcademyRouter() {
  const router = createAcademyAuthRouter();
  router.use("/admin/users", academyAuthMiddleware, requirePasswordChange, requireAcademyAdmin, createAcademyAdminUsersRouter());
  return router;
}
