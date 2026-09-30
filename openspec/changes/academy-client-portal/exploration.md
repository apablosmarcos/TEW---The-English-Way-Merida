# Exploration: academy-client-portal

## Phase result

- **Status:** explored; ready for proposal/design planning.
- **Mode:** planning only; no product code changed.
- **Artifact store:** OpenSpec.
- **Skill resolution:** none (no executor skill path was injected).
- **Research:** unselected by request; this exploration uses repository evidence only.
- **Delivery assessment:** this is a cross-cutting replacement (storage, auth, uploads, routes, Angular screens, tests, and deployment documentation) and will substantially exceed the 400-line review budget. The configured `ask-on-risk` strategy therefore requires a delivery decision before implementation; no chain strategy or size exception is inferred.

## Repository baseline

- Angular 20 standalone frontend and Express 5 TypeScript backend; SQLite is accessed through `node:sqlite`.
- The backend currently exposes only health, public lead intake, environment-variable admin login, and authenticated lead-management routes. The current admin identity is `ADMIN_USERNAME`/`ADMIN_PASSWORD`, not a database user.
- Current session tokens are 32-byte random values, SHA-256 hashed before insertion into `admin_sessions`, and stored in browser `sessionStorage`. Their expiry is fixed at creation, not refreshed on activity.
- `backend/src/modules/storage/sqlite.ts` creates `leads`, `admin_sessions`, and `app_meta`; it also imports optional legacy lead JSON. Existing databases may therefore contain historic lead and old-session data.
- The public site already links its enrolment call-to-action to Google Forms. The stale Angular lead form code and the whole lead API/admin area still exist but are no longer needed.
- The frontend has no route guards, HTTP auth interceptor, multipart upload handling, Markdown renderer/sanitizer, or private portal feature. Its backend API base is supplied by `assets/config/site.config.json`.
- There is no interactive CLI and no persistent uploaded-file directory. Docker currently copies backend build output only; a deployed portal needs a durable directory for both SQLite and uploads.

## Required replacement boundary

Remove all active lead/request functionality rather than adapting it:

- Backend: remove `routes/leads.ts`, `routes/admin-auth.ts`, `routes/admin-leads.ts`, `modules/leads/**`, `modules/auth/admin-auth.ts`, `modules/auth/admin-session-repository.ts`, and their route/module tests. Remove their registrations from `backend/src/app.ts`, old environment variables, and legacy-lead import/creation from SQLite initialization.
- Frontend: remove `pages/admin/**`, `core/services/admin-*`, `core/services/leads-*`, `pages/home/home-form.ts`, and their tests; replace `/admin` and `/admin/leads` routes. Remove the unused reactive lead-form state, API service injection, and submission code from `HomeComponent` while retaining the existing Google Forms enrolment section.
- Database migration must **not** drop existing `leads` or `admin_sessions` tables. They can contain historic data and cannot authenticate into the new model. New initialization stops creating/using them; existing rows remain inert. The recovery CLI creates the first new admin.

## Target architecture

### Authentication and authorization

Use a shared database-backed identity and session service, preserving the existing opaque bearer-token pattern as the smallest compatible change:

- A successful `POST /api/academy/login` resolves a case-insensitive active user, verifies a salted Node `crypto.scrypt` password hash with timing-safe comparison, creates a fresh random opaque token, and returns the current user, token, `expiresAt`, and `mustChangePassword` flag.
- Persist only a SHA-256 token hash in `sessions`. Every authenticated API request loads the session joined to an active, non-deleted user, deletes expired rows, updates `lastSeenAt`, and rolls `expiresAt` forward to eight hours from that request. This supports simultaneous devices without a refresh-token system.
- Password change/reset, disable, and soft delete delete every session for the affected user in the same database transaction. A stale browser token then fails server-side even if its original expiry has not elapsed.
- A central Express authentication middleware yields the current user; a second middleware requires `role = 'admin'`. Parent reads must never depend only on an Angular guard: post and attachment visibility is rechecked on every server request.
- Before a first-login password change, allow only session inspection, password change, and logout. Other private operations return a consistent password-change-required response.
- Keep browser storage limited to the opaque session token, replacing the admin-specific key with a shared academy-session service. A functional Angular HTTP interceptor adds `Authorization: Bearer <token>` to academy requests; a central handler clears the token and redirects on authentication failure.
- Apply a bounded in-memory login limiter to `POST /api/academy/login` keyed by the request IP (not the forgeable `Origin` header), for example 10 attempts per 15 minutes and `429` after the limit. It is deliberately minimal and resets on process restart. Production proxy configuration must only enable Express `trust proxy` when the proxy topology is known.
- Use generic login errors so a username cannot be enumerated. No email recovery, self-registration, notification, or token-refresh workflow is introduced.

### Users and recovery CLI

Use UUIDs for all user identifiers. A `users` record requires `id`, `displayName` (needed by the confirmed name search), `username`, normalized username, `role`, password hash, `mustChangePassword`, disabled/deleted timestamps, and timestamps.

- Normalize usernames with trim + Unicode normalization + lowercase, require 4--30 characters, and restrict the persisted login form to an unambiguous ASCII username character set (`a-z`, `0-9`, `.`, `_`, `-`). The database keeps a partial unique index on normalized usernames where `deletedAt IS NULL`, allowing a soft-deleted username to be reused while preventing duplicates among live accounts.
- The admin web UI creates parent accounts. It proposes an editable normalized username, creates a 10-character temporary password from an alphabet excluding ambiguous glyphs, returns it once in the creation/reset response, and sets `mustChangePassword = 1`. The plaintext is never stored, logged, or returned again.
- The server-side CLI is the only administrator bootstrap/recovery creation path. Add a backend package script and compiled `cli/create-admin.ts`; it prompts for display name and username, reads a hidden password twice from a TTY, validates a >=10-character match, stores a normal admin account, and may run again to create a recovery admin. It must fail safely when stdin is not an interactive TTY.
- Account list/search is server-side paginated, searches display name, normalized username, and UUID, and filters role and active/disabled/deleted status. The UUID is returned to administrators only and rendered as subtle read-only metadata.
- The active-admin guard is transactional: before disabling or soft-deleting an active admin, count active non-deleted admin rows. Refuse the mutation if it would leave zero. Re-enabling is permitted; restoration of a soft-deleted user is not exposed in the portal.
- Passwords are never included in responses or audit details. Admin reset produces a new temporary password and revokes sessions; a parent may change only their own password.

### Publications, categories, attachments, and audit

Add SQLite tables and foreign keys (enable `PRAGMA foreign_keys = ON` during initialization):

- `categories`: UUID, unique normalized name, display name, timestamps. A category is physically deletable only when no `posts` row references it, including hidden or soft-deleted posts.
- `posts`: UUID, title, Markdown source, optional category UUID, `visibility` (`visible`, `hidden`, `deleted`), automatic `publishedAt`, `updatedAt`, and soft-delete metadata. A new post starts `visible`; any title/content/category/visibility update advances `updatedAt`. There is intentionally no restore endpoint for deleted posts.
- `attachments`: UUID, post UUID, opaque storage identifier, validated extension/MIME type, byte size, optional visible title, stable per-post material ordinal, timestamps, and soft-delete metadata. The physical filename derives only from an opaque generated identifier plus the validated extension; original client filenames are neither used as storage names nor exposed.
- `sessions`: token hash, user UUID, creation/last-seen/expiry timestamps, and an index by user UUID for revocation.
- `audit_log`: append-only technical records with nullable actor user UUID (the CLI uses `system`), action, entity type/UUID, and timestamp. Record account, password-reset, category, post, and attachment mutations, but do not create an audit UI or a password-bearing audit payload.

Publication rules:

- Parent list/detail queries include only visible posts and non-deleted attachments. The list is newest-first, title-only search, optional category filter plus All, and server-side pagination. Detail exposes publication and updated dates, category where assigned, safe rendered Markdown, and attachment preview/download links; it never exposes an author.
- Admin list/detail queries can include visible, hidden, and deleted records. The administration landing route is the publications list. Admins create, edit, hide/show, and soft-delete posts; only direct database intervention by a developer can restore a deleted record.
- Store Markdown source, edit it in separate visual and source modes in the Angular admin screen, and show a local preview. Rendering must use a renderer configured to reject raw HTML plus explicit safe URL handling/sanitization; Angular must not bind unsanitized source to `innerHTML`.
- Attachment create validates count (10 total per post), file size (20 MiB each), declared MIME type, and file signature before durable write. Only PDF, JPEG, PNG, and WebP map to a server-chosen extension. A multipart parser is not currently installed, so implementation needs one small maintained multipart dependency rather than a bespoke parser; Markdown rendering likewise needs a small safe renderer. No other infrastructure dependency is justified.
- Serve preview and download through authenticated routes that resolve metadata and post access first. Send exact validated `Content-Type`, `X-Content-Type-Options: nosniff`, safe `Content-Disposition` (`inline` for preview, `attachment` for download), and a sanitized filename made from visible title or `Material N` plus the validated extension. Alphabetize attachment display by that same visible/fallback title. Soft deletion removes only metadata from parent access and retains physical files; admins retain access.
- Add a configurable persistent `FILE_STORAGE_PATH` with a default under `backend/data/uploads`. It must be ignored by Git and deployment documentation must require a durable mounted/server directory shared with the SQLite lifecycle. No quota view, backup service, cloud storage, or download tracking is added.

## API surface to plan/specify

All academy routes are rooted at `/api/academy` and use JSON except attachment uploads/downloads.

| Area | Endpoints and access |
| --- | --- |
| Session | `POST /login` public/rate-limited; `GET /session`, `POST /logout`, and `POST /me/password` authenticated. |
| Parent publications | `GET /posts` and `GET /posts/:id` authenticated; parents receive only visible posts and active attachments, admins can request status-filtered records. |
| Admin users | `GET/POST /admin/users`, `GET/PATCH/DELETE /admin/users/:id`, `POST /admin/users/:id/enable`, `POST /admin/users/:id/reset-password`; admin only. Creation/reset return the temporary password only in that response. |
| Admin categories | `GET/POST /admin/categories`, `PATCH/DELETE /admin/categories/:id`; admin only, with conflict response when used. |
| Admin posts | `POST /admin/posts`, `PATCH/DELETE /admin/posts/:id`; `GET /posts` and `GET /posts/:id` provide admin visibility inspection rather than a separate duplicate read API. |
| Attachments | `POST /admin/posts/:id/attachments` multipart, `PATCH/DELETE /admin/attachments/:id`, `GET /attachments/:id/preview`, `GET /attachments/:id/download`; authenticated and visibility/role checked on every stream. |

Response payloads must use UUIDs for entities, omit password hashes and physical storage identifiers, report validation/conflict/not-found/unauthorized errors consistently, and keep parent-only responses free of deleted/hidden resource metadata.

## Angular impact

Create a feature-oriented `frontend/src/app/pages/academy/` area (or equivalent narrowly scoped components) with:

1. Shared academy session/auth service, endpoint builder/API service, interceptor, route guards, and focused tests.
2. Public `/academia/acceso` login page used by both roles, including forced-password-change flow.
3. Authenticated parent `/academia` publication feed: newest cards, title search, category selector/All, pagination, detail navigation, dates, sanitized rendered content, and attachment preview/download.
4. Admin `/academia/admin/publicaciones` landing/list and publication editor with explicitly separate visual/source Markdown modes and adequate preview; category management; attachment management; and hidden/deleted inspection.
5. Admin `/academia/admin/usuarios` with name/username/UUID search, role/status filters, pagination, creation/reset one-time-password presentation, and disable/delete guard messaging.
6. A responsive portal shell/menu. Every private screen must work at narrow widths without relying on the desktop lead-panel layout.

Update `frontend/src/app/app.routes.ts` to remove `/admin` and `/admin/leads`; add academy routes and role guards. Update the public top menu in `HomeComponent` to add **Acceso academia** while anonymous and an authenticated username menu (portal destination and logout) when a session is active. Retain the Google Forms enrolment link; remove only obsolete lead-form plumbing and styling that becomes unused.

## Backend, configuration, and deployment impact

Expected changes include:

- Rewrite `backend/src/modules/storage/sqlite.ts` around idempotent academy schema initialization and indexes; preserve old physical tables without using or importing them.
- Add focused modules for academy auth, users, sessions, categories, posts, attachments/storage, Markdown rendering, audit, and request authorization; add academy routers and register only them plus health in `backend/src/app.ts`.
- Add `FILE_STORAGE_PATH`; retire `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_TTL_HOURS`, and `LEGACY_LEADS_FILE_PATH` from runtime documentation because authentication now requires the CLI-created database account.
- Update `backend/package.json` scripts for the recovery CLI and the new explicit Node-test files. Update `frontend/package.json` test list after removing old admin/lead tests and adding academy tests. The workspace lockfile changes only for the required multipart and safe Markdown-rendering dependencies.
- Update `.gitignore`, `README.md`, and Docker/deployment notes to describe persistent SQLite and upload paths, `/api` routing, initial administrator creation, and the fact that GitHub Pages remains a visual-only public site where login cannot function without an API.

## Test impact and acceptance evidence

Keep the repository's built-in Node test runner; no E2E framework is required. Planned tests must cover at least:

- Idempotent schema creation, partial username reuse after soft delete, category-in-use rejection, post/attachment lifecycle, and physical file metadata behavior.
- Password hashing/verification, normalized username login, first-login enforcement, rolling eight-hour expiry, multiple sessions, all-session revocation, login limiter, disabled/deleted denial, and last-active-admin protection.
- Route-level role authorization, parent filtering of hidden/deleted posts/files including direct stale URLs, title search/category/pagination, upload count/size/type/signature rejection, and safe preview/download headers/names.
- CLI validation through testable helpers plus a manual TTY smoke check for hidden confirmation; no plaintext password assertions or logs.
- Angular endpoint/session/interceptor/guard helpers, role redirects, parent list/filter/pagination state, forced password-change UI, and source/visual editor template hooks. Remove stale lead/admin-template tests from scripts.
- Run `pnpm --recursive test` and `pnpm --recursive run build` as the repository gates. Manual smoke: run the CLI against a clean data path, log in as its admin, create a parent, consume its temporary password and change it, publish/hide/delete a post with supported attachments, and verify a parent loses direct access immediately.

## Scope boundaries held

Not planned: email recovery, notifications, self-registration, groups/family segmentation, author display, cover images, drafts/scheduling, comments, cloud storage, storage metrics/quotas/backups, download tracking, deleted-record restoration UI/API, audit UI, or an E2E framework.

## Planning handoff

The next proposal/spec should preserve the endpoint and lifecycle contracts above, explicitly state the safe Markdown and multipart dependency choices, and split implementation into reviewable work units before apply because the 400-line review budget is at risk.
