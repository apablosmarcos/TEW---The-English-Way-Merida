# Design: Academy client portal

## Phase outcome

This design replaces the active lead/admin application with one academy portal while preserving historic `leads` and `admin_sessions` tables as inert data. It keeps the existing Angular 20 standalone, Express 5, strict TypeScript, `node:sqlite`, site-config, and built-in Node test patterns. It introduces no ORM, state library, editor framework, object store, refresh-token flow, or generic repository abstraction.

This is a planning artifact only. Product code is not changed in this phase. The implementation is expected to exceed the 400-line review budget, so the configured `ask-on-risk` delivery decision remains a gate before apply.

## Architecture at a glance

```text
Angular standalone routes
  -> SiteConfigService resolves apiBaseUrl
  -> AcademyApiService + functional bearer interceptor
  -> /api/academy Express routers
  -> authentication / password-change / role middleware
  -> feature service (business rule + transaction orchestration)
  -> repository functions (parameterized SQL only)
  -> node:sqlite database

Attachment upload
  -> authenticated admin route
  -> busboy stream to storage-local temporary file
  -> signature/type/size validation
  -> one SQLite write transaction + atomic same-filesystem rename
  -> attachment metadata + audit commit

Attachment read
  -> authenticated route
  -> repository resolves current user/post/attachment access
  -> trusted opaque storage path
  -> exact headers + local file stream
```

The backend remains a single-process application backed by one SQLite database and one local durable upload directory. That is the smallest architecture matching the approved deployment and consistency requirements.

## Decisions summary

| Area | Decision |
| --- | --- |
| Runtime | Keep Angular 20 standalone components, Express 5, Node 22, strict TypeScript, and synchronous `node:sqlite`. |
| Database access | Open a configured database per operation, enable connection pragmas, and compose mutations through synchronous `BEGIN IMMEDIATE` transactions. Keep the existing single in-process write queue pattern. |
| Migrations | Use SQLite's native `PRAGMA user_version` and ordered forward migrations. Migration 1 adds the academy schema only; it never alters or drops legacy tables. |
| Authentication | Keep opaque 32-byte bearer tokens, persist only SHA-256 token hashes, and replace environment credentials with scrypt-hashed users. |
| Browser session | Persist only the bearer token in `sessionStorage`; keep current-user data in memory and restore it from `GET /session`. |
| Authorization | Express middleware and role-aware repository queries are authoritative. Angular guards are navigation helpers only. |
| Markdown | Use `micromark` in backend and frontend with dangerous HTML/protocols disabled; bind generated HTML through Angular's normal sanitizer and never call a trust-bypass API. |
| Multipart | Use `busboy` to stream one file to disk with explicit limits; do not buffer a 20 MiB upload or write a multipart parser. |
| File storage | Store `${storageId}.${validatedExtension}` under `FILE_STORAGE_PATH`; client filenames never enter storage, responses, or audit. |
| Frontend state | Use a small session signal store and component-local list/editor state. Put filters/page in route query parameters. No NgRx or cross-feature cache. |
| CLI | Use Node `readline/promises` plus a small TTY raw-mode password reader; no prompt dependency. |
| Tests | Keep explicit `node:test` files and temp SQLite/upload directories. Do not add an E2E framework. |

## Backend structure and boundaries

### Runtime composition

`backend/src/app.ts` keeps `helmet`, `cors`, `morgan`, and JSON parsing, but registers only health and academy routers. `express.json({ limit: '1mb' })` applies to JSON requests; multipart is parsed only on the upload route. Express 5 propagates rejected async handlers to a final error middleware, so no async-handler wrapper is needed.

`createApp(env = process.env)` passes the environment object to router factories. This is intentionally the only dependency seam: route tests can use isolated paths without mutating shared process state, while production still calls `createApp()`.

`backend/src/server.ts` performs startup preparation before listening:

1. Create the SQLite parent and upload directories.
2. Open SQLite, configure the connection, and run pending migrations.
3. Verify the upload directory can be accessed for writing.
4. Start Express only if preparation succeeds.

The CLI performs database preparation independently because it does not start the server.

### Layer responsibilities

| Layer | Owns | Must not own |
| --- | --- | --- |
| Route | HTTP method/path, body/query/UUID parsing, multipart invocation, response status/headers | SQL, password hashing, lifecycle decisions, parent visibility decisions |
| Middleware | Bearer extraction, session resolution, rolling expiry, forced-password-change gate, admin-role gate | Feature mutations or frontend redirects |
| Service | Validation that spans fields, password/file work, business rules, transaction boundaries, audit orchestration | Express request/response objects |
| Repository | Prepared SQL, row mapping, role-specific read predicates, counts and writes using a supplied `DatabaseSync` | Filesystem calls, HTTP concerns, plaintext password generation |
| Storage | Path resolution, database open/close, pragmas, migration runner, write queue, transaction helper | Feature-specific queries |

Repository functions receive a `DatabaseSync`; they do not open nested connections. Services call `withDatabase` for reads or `withWriteTransaction` for mutations, allowing the mutation and audit insert to commit together. No `BaseRepository`, interfaces with one implementation, dependency container, or ORM is introduced.

### Planned backend files

The exact split stays feature-sized rather than one file per endpoint:

```text
backend/src/
├── app.ts
├── server.ts
├── cli/
│   ├── create-admin.ts
│   └── tty-password.ts
├── modules/
│   ├── storage/
│   │   ├── sqlite.ts
│   │   └── academy-migrations.ts
│   └── academy/
│       ├── academy-errors.ts
│       ├── academy-types.ts
│       ├── password.ts
│       ├── login-limiter.ts
│       ├── auth-repository.ts
│       ├── auth-service.ts
│       ├── user-repository.ts
│       ├── user-service.ts
│       ├── publication-repository.ts
│       ├── publication-service.ts
│       ├── attachment-repository.ts
│       ├── attachment-service.ts
│       ├── file-storage.ts
│       ├── markdown.ts
│       └── audit-repository.ts
└── routes/
    ├── academy-router.ts
    ├── academy-middleware.ts
    ├── academy-auth.ts
    ├── academy-posts.ts
    ├── academy-admin-users.ts
    ├── academy-admin-content.ts
    └── academy-attachments.ts
```

Categories share the publication repository/service because they are part of one content lifecycle. Audit has one append function rather than an audit service. Common errors use one typed `AcademyError` carrying HTTP status, stable code, safe message, and optional field errors.

## SQLite schema and migrations

### Connection behavior

Every opened connection executes:

```sql
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
PRAGMA journal_mode = WAL;
```

Foreign-key enforcement is connection-local and therefore cannot be enabled only during migration. Writes use the existing promise queue at process level and a synchronous `BEGIN IMMEDIATE`/`COMMIT` block. `ROLLBACK` runs on any thrown error. The queue is deliberately global: the expected academy workload is small, and serial writes avoid avoidable `SQLITE_BUSY` behavior. If measured write contention becomes material, the upgrade is a long-lived connection/worker, not parallel application-level queues.

All timestamps are UTC ISO-8601 text generated by the server. UUIDs use `crypto.randomUUID()`. Queries are parameterized; title and user searches escape `%` and `_` before `LIKE ... ESCAPE '\\'` so search terms are literal.

### Migration sequencing

`academy-migrations.ts` exports an ordered array keyed by integer version. Initialization reads `PRAGMA user_version`, refuses to start if the database version is newer than the code understands, and applies each missing migration in ascending order. Each migration and its `PRAGMA user_version = N` update run in one transaction; a failure leaves the prior version intact and startup fails.

Version 1 creates the academy tables and indexes with `IF NOT EXISTS`. It does not call the old lead-column helper, import legacy JSON, query legacy rows, create `leads`, create `admin_sessions`, or convert data. On an existing database those tables remain untouched. On a clean database they are not created.

A separate `schema_migrations` table is rejected: `user_version` already provides the only sequencing value this embedded database needs. Future schema changes append migration 2, 3, and so on; an applied migration is never edited.

### Academy tables

#### `users`

| Column | Contract |
| --- | --- |
| `id TEXT PRIMARY KEY` | UUID |
| `displayName TEXT NOT NULL` | Trimmed, non-empty, bounded display text |
| `username TEXT NOT NULL` | Trimmed display form |
| `normalizedUsername TEXT NOT NULL` | `trim -> NFKC -> lowercase`; must match `^[a-z0-9._-]{4,30}$` |
| `role TEXT NOT NULL` | `CHECK role IN ('parent','admin')` |
| `passwordHash TEXT NOT NULL` | Versioned scrypt encoding only |
| `mustChangePassword INTEGER NOT NULL` | `0/1` check |
| `disabledAt TEXT` | Null means not disabled |
| `deletedAt TEXT` | Null means not soft-deleted |
| `createdAt`, `updatedAt TEXT NOT NULL` | UTC timestamps |

A partial unique index on `normalizedUsername WHERE deletedAt IS NULL` permits reuse only after soft deletion. Active means both lifecycle timestamps are null. Portal creation always inserts `role='parent'`; only the CLI inserts administrators. Portal PATCH cannot change role or forced-password state.

#### `sessions`

| Column | Contract |
| --- | --- |
| `tokenHash TEXT PRIMARY KEY` | 64-character lowercase SHA-256 hex |
| `userId TEXT NOT NULL` | FK to `users(id)` with cascade if a developer physically removes a user |
| `createdAt`, `lastSeenAt`, `expiresAt TEXT NOT NULL` | UTC timestamps |

Indexes cover `userId` for revocation and `expiresAt` for cleanup. This table is intentionally distinct from `admin_sessions`.

#### `categories`

`id`, `displayName`, `normalizedName`, `createdAt`, and `updatedAt` are required. Category normalization is `trim -> NFKC -> collapse internal whitespace -> lowercase`. `normalizedName` is unique. `posts.categoryId` uses the default restrictive foreign key; a category cannot be deleted while any visible, hidden, or deleted post references it.

#### `posts`

| Column | Contract |
| --- | --- |
| `id TEXT PRIMARY KEY` | UUID |
| `title TEXT NOT NULL` | Trimmed, bounded title |
| `markdownSource TEXT NOT NULL` | Source of truth |
| `categoryId TEXT` | Nullable restrictive FK |
| `visibility TEXT NOT NULL` | `visible`, `hidden`, or `deleted` check |
| `publishedAt TEXT NOT NULL` | Set once at creation |
| `updatedAt TEXT NOT NULL` | Advanced by title/content/category/visibility changes |
| `deletedAt TEXT` | Set only with deleted visibility |

A check keeps `visibility='deleted'` equivalent to `deletedAt IS NOT NULL`. There is no author column and no restore operation. Indexes cover `(visibility, publishedAt DESC)`, category, and updated time. Feed order is stable: `publishedAt DESC, id DESC`. SQLite `LIKE` is sufficient for this bounded title search; FTS is not introduced.

#### `attachments`

| Column | Contract |
| --- | --- |
| `id TEXT PRIMARY KEY` | Public metadata UUID |
| `postId TEXT NOT NULL` | Restrictive FK to post |
| `storageId TEXT NOT NULL UNIQUE` | Server-generated opaque UUID |
| `extension TEXT NOT NULL` | `pdf`, `jpg`, `png`, or `webp` check |
| `mimeType TEXT NOT NULL` | Exact validated MIME check |
| `byteSize INTEGER NOT NULL` | `0..20 MiB` check |
| `visibleTitle TEXT` | Optional trimmed display title |
| `materialOrdinal INTEGER NOT NULL` | Positive, stable within the post |
| `createdAt`, `updatedAt TEXT NOT NULL` | UTC timestamps |
| `deletedAt TEXT` | Null means parent-visible if the post is visible |

`UNIQUE(postId, materialOrdinal)` makes fallback names stable. The limit counts every attachment row for the post, including soft-deleted rows, because the approved specification says 10 total and administrators retain deleted material. Therefore soft deletion does not free a slot. Display sorting uses the visible title or `Material N` fallback, case-insensitively, with ordinal as the tie-breaker.

#### `audit_log`

`id INTEGER PRIMARY KEY`, nullable `actorUserId`, `action`, `entityType`, `entityId`, and `createdAt` are stored. A null actor means the `system` actor used by the CLI. Indexes cover creation time and `(entityType, entityId)`. There is no details/payload column and no read route, which structurally prevents passwords, tokens, filenames, storage IDs, or Markdown bodies from entering audit data.

## Authentication and authorization

### Passwords and temporary credentials

Passwords are not trimmed or Unicode-normalized. New and changed passwords must contain 10–128 characters. `password.ts` uses asynchronous `crypto.scrypt` with a random 16-byte salt, 64-byte output, and explicit `N=16384`, `r=8`, `p=1`, `maxmem=64 MiB`. The stored format is versioned and self-describing:

```text
scrypt$16384$8$1$<base64url-salt>$<base64url-digest>
```

Verification parses bounded parameters, derives the candidate hash, checks equal lengths, and uses `timingSafeEqual`. Unknown, disabled, and deleted users are verified against one fixed valid dummy encoding before returning the same `INVALID_CREDENTIALS` response, reducing username-state timing differences.

Temporary passwords use `crypto.randomInt` over a fixed alphabet without `0`, `O`, `1`, `I`, or `l`. Creation and reset produce exactly 10 characters, hash before opening the write transaction, return plaintext only in that successful response, and set `Cache-Control: no-store`. No logger, audit call, repository input, or later response receives the plaintext.

### Login and sessions

`POST /login` applies the IP limiter before credential work. The limiter is one in-memory `Map` keyed by `req.ip`, counts every login request, permits 10 in a rolling 15-minute bucket, and rejects the eleventh with `429` and `Retry-After`. Expired entries are removed opportunistically and the map has a fixed maximum entry count with oldest-entry eviction, so the limiter itself cannot grow without bound. Restart reset is accepted. `Origin` is never used as identity.

A successful login:

1. Normalizes and looks up an active user.
2. Verifies the password.
3. Generates a random 32-byte token encoded as hex.
4. Hashes the token with SHA-256.
5. Inserts a new session expiring exactly eight hours from the request time.
6. Returns the opaque token once with the safe current-user view.

Authentication middleware hashes the presented bearer token, then in one queued write transaction:

1. Loads the session joined to its user.
2. Deletes and rejects an expired session.
3. Rejects sessions whose user is disabled or deleted.
4. Updates `lastSeenAt` and `expiresAt` to the current request time and exactly eight hours later.
5. Attaches the internal user identity to `res.locals.academyUser`.

Multiple session rows per user are allowed. Logout removes only the presented token. Self password change verifies the current password, hashes the new password, clears `mustChangePassword`, deletes all sessions, and appends an audit row in one transaction; it returns `204`, and the browser returns to login. Reset, disable, and soft delete likewise update the user, revoke all sessions, and audit within one transaction.

### Middleware order

```text
/login                     -> limiter only
/session, /logout,
/me/password               -> authenticate
all other private routes   -> authenticate -> requirePasswordChanged
/admin/**                  -> authenticate -> requirePasswordChanged -> requireAdmin
```

The forced-password middleware returns `PASSWORD_CHANGE_REQUIRED` consistently. Session inspection, logout, and own-password change remain reachable. Parent content repositories always include visibility/deletion predicates; a route guard or successful earlier read never grants future access.

### Last active administrator

Disable and soft delete execute under `BEGIN IMMEDIATE`. After loading the target, the service counts active, non-deleted administrators in the same transaction. If the target is an active admin and the count is one, it throws `LAST_ACTIVE_ADMIN`; no user/session/audit write occurs. Re-enable is allowed. Deleted users have no restore endpoint.

## Publication, Markdown, and attachment flows

### Publication reads and writes

Parents and administrators use the same read routes but different repository queries and response mappers:

- Parent list/detail SQL always requires `posts.visibility='visible'` and returns only active attachments.
- Admin list accepts `visibility=all|visible|hidden|deleted`, defaults to `all`, and may inspect deleted attachments.
- A parent-supplied visibility filter is rejected rather than interpreted.
- Parent detail for a hidden/deleted/missing UUID returns the same `404 NOT_FOUND` response.
- Parent responses omit Markdown source, deleted metadata, user UUIDs, and author data. Admin detail includes Markdown source for editing.

The post list response also includes category filter options. For parents these are only categories associated with currently visible posts; the `All` option is frontend-only. This avoids adding another parent endpoint. Admin category maintenance uses `/admin/categories`.

Post creation sets `visible`, `publishedAt`, and `updatedAt` to the same timestamp. PATCH permits title, Markdown source, nullable category, and `visible|hidden`; it cannot set `deleted`. DELETE is the sole portal transition to `deleted`. Deleted posts remain readable by admins but reject further content/attachment mutation and cannot be restored.

Every successful user, password, category, post, and attachment mutation inserts its audit row in the same SQLite transaction as the domain write.

### Safe Markdown

`micromark` is the only Markdown dependency and is installed in both runtime packages so server rendering and local preview use the same parser. Both wrappers explicitly set dangerous HTML and dangerous protocols off. No extension/plugin enables raw HTML. Test fixtures cover script tags, event attributes, `javascript:`, and unsafe data URLs.

The backend stores only Markdown source and renders on detail response; rendered HTML is not duplicated in SQLite. Parent responses contain rendered HTML but not source. Admin responses contain source and rendered HTML. Angular binds only this generated output through `[innerHTML]`, allowing Angular's built-in sanitizer to run; code must not use `bypassSecurityTrustHtml`.

The admin editor has two explicit modes without a rich-text dependency:

- **Visual:** a native textarea with small Markdown formatting controls using `selectionStart`/`setRangeText`, beside or above a live rendered preview.
- **Source:** the same canonical Markdown source in an unadorned full-width textarea.

Both edit one source value, so mode switching cannot require HTML-to-Markdown conversion. A WYSIWYG `contenteditable` editor is rejected because it would require conversion/sanitization behavior outside the approved scope.

### Upload validation

The multipart field is named `file`; an optional `title` field supplies the visible title. `busboy` is configured for one file, bounded fields/parts, and `fileSize=20 * 1024 * 1024`. It streams to a random `.tmp` file inside `FILE_STORAGE_PATH`, ensuring the final rename stays on the same filesystem. The service retains only the leading bytes needed for signature validation, not the full upload.

Accepted mappings are exact:

| Declared MIME | Required signature | Stored extension |
| --- | --- | --- |
| `application/pdf` | Starts `%PDF-` | `pdf` |
| `image/jpeg` | Starts `FF D8 FF` | `jpg` |
| `image/png` | Eight-byte PNG signature | `png` |
| `image/webp` | `RIFF` and `WEBP` at bytes 8–11 | `webp` |

A missing file, extra file, exceeded limit, unknown MIME, empty/truncated signature, or MIME/signature mismatch removes the temp file and returns a safe 4xx error. The client filename is ignored as soon as Busboy emits it.

### Database/file consistency

SQLite and the filesystem cannot share a transaction, so upload uses ordering that never commits metadata before durable content exists:

1. Stream to a storage-local temporary path and close it.
2. Validate size, MIME, signature, post UUID, and optional visible title.
3. Enter the global write queue and `BEGIN IMMEDIATE`.
4. Recheck that the post exists, is not deleted, and has fewer than 10 total attachment rows.
5. Allocate `MAX(materialOrdinal)+1` and a fresh attachment/storage UUID.
6. Atomically rename the temp file to `${storageId}.${extension}`.
7. Insert attachment metadata and audit row.
8. Commit, then return metadata.

If rename or SQL fails before commit, SQLite rolls back and the service removes any final file it moved. Failure to remove an unreferenced file is logged as an operational orphan without exposing its storage ID to the client. A process/power loss in the narrow interval after rename and before commit can likewise leave an unreferenced file, but cannot leave parent-accessible metadata pointing to missing content. Automatic orphan deletion is intentionally not added because a mistaken cleanup policy risks data loss; operators can compare generated files with `attachments.storageId` during maintenance if this rare case occurs.

If commit succeeds but the HTTP response is lost, the attachment remains valid; no idempotency-key mechanism is added. Rename and soft delete never touch physical content. Soft delete updates metadata and audit only, immediately removing parent access while preserving admin streaming.

### Protected streaming

Preview/download routes first resolve current user, attachment, and post access in one query. Only then do they derive a path from trusted database values. The path is constrained under the resolved storage root, and neither route accepts a filename/path parameter.

Before streaming, responses set:

- the exact stored `Content-Type`;
- `X-Content-Type-Options: nosniff`;
- `Content-Disposition: inline` for preview or `attachment` for download;
- a safe ASCII filename derived from visible title or `Material N`, with controls/path separators/header metacharacters replaced, whitespace collapsed, length capped, and the validated extension appended;
- `Cache-Control: private, no-store`.

Missing physical content produces a generic server error and no bytes. Range support is not added; the 20 MiB cap keeps full authenticated streams acceptable. Admins may stream retained attachments from hidden/deleted posts; parents must have an active attachment on a currently visible post at every request.

## API and error contracts

All endpoints are rooted at `/api/academy`. JSON success uses `{ "ok": true, "data": ... }`; a successful bodyless mutation uses `204`. Lists use:

```json
{
  "ok": true,
  "data": {
    "items": [],
    "pagination": { "page": 1, "pageSize": 20, "total": 0, "pageCount": 0 }
  }
}
```

Dates are UTC ISO strings and entity IDs are UUIDs. Parent session views contain `displayName`, `username`, `role`, and `mustChangePassword`, but no user UUID; administrator user-management responses include UUIDs. Password hashes, token hashes, storage IDs, original filenames, and audit data are never serialized.

Errors use one shape:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request is invalid.",
    "fields": { "username": "Use 4-30 lowercase letters, numbers, dot, underscore, or hyphen." }
  }
}
```

`fields` is optional. Messages are safe for display; clients branch on `code`, not English text.

| HTTP | Code | Use |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Invalid JSON, query, UUID, or field payload |
| 401 | `INVALID_CREDENTIALS` | Generic login failure only |
| 401 | `AUTHENTICATION_REQUIRED` | Missing, invalid, expired, or revoked bearer token |
| 403 | `PASSWORD_CHANGE_REQUIRED` | Temporary-password session outside allowed endpoints |
| 403 | `FORBIDDEN` | Authenticated role cannot perform the operation |
| 404 | `NOT_FOUND` | Missing resource, including parent-hidden/deleted resources |
| 409 | `USERNAME_TAKEN`, `CATEGORY_IN_USE`, `LAST_ACTIVE_ADMIN`, `ATTACHMENT_LIMIT`, `RESOURCE_STATE_CONFLICT` | Mutation conflicts |
| 413 | `UPLOAD_TOO_LARGE` | Multipart file exceeded 20 MiB |
| 415 | `UNSUPPORTED_FILE_TYPE` | Unsupported/mismatched MIME or signature |
| 429 | `RATE_LIMITED` | Eleventh login attempt in the active window |
| 500 | `INTERNAL_ERROR` | Unexpected database/filesystem/server failure |

Unexpected errors are logged server-side without request bodies or secret values and return only `INTERNAL_ERROR`.

### Endpoint details

| Endpoint | Access and contract |
| --- | --- |
| `POST /login` | Public/rate-limited. Body `{username,password}`. Returns token, expiry, and safe current user. `no-store`. |
| `GET /session` | Authenticated. Rolls expiry and returns safe current user plus new expiry. |
| `POST /logout` | Authenticated; deletes presented session; `204`. |
| `POST /me/password` | Authenticated, including forced-change users. Body `{currentPassword,newPassword}`; revokes all sessions; `204`. |
| `GET /posts` | Authenticated. `page` default 1, `pageSize` default 20/max 50, optional literal title `search`, optional category UUID. Admin may add `visibility`. Returns items, pagination, category options. |
| `GET /posts/:id` | Authenticated role-aware detail. Parent gets rendered content and active attachments; admin also gets source/status/deleted attachments. |
| `GET /admin/users` | Admin. `page` default 1, `pageSize` default 25/max 100; optional literal search, role, and `active|disabled|deleted` status. |
| `POST /admin/users` | Admin. Body `{displayName,username}`; creates parent and returns user plus one-time `temporaryPassword`. `no-store`. |
| `GET /admin/users/:id` | Admin-safe detail without password material. |
| `PATCH /admin/users/:id` | Admin. Changes display name/username and may set `disabled:true`; cannot enable, change role, or restore. |
| `DELETE /admin/users/:id` | Admin. Soft delete plus session revocation; `204`. |
| `POST /admin/users/:id/enable` | Admin. Clears `disabledAt`; `204`. |
| `POST /admin/users/:id/reset-password` | Admin. Returns one-time `temporaryPassword`; `no-store`. |
| `GET /admin/categories` | Admin list. |
| `POST /admin/categories` | Admin create from `{displayName}`. |
| `PATCH /admin/categories/:id` | Admin rename. |
| `DELETE /admin/categories/:id` | Admin physical delete; `409 CATEGORY_IN_USE` when any post references it. |
| `POST /admin/posts` | Admin. `{title,markdownSource,categoryId?}`; creates visible post. |
| `PATCH /admin/posts/:id` | Admin. Partial title/source/category/visible-hidden update; never restore/delete. |
| `DELETE /admin/posts/:id` | Admin soft delete; `204`. |
| `POST /admin/posts/:id/attachments` | Admin multipart; returns attachment metadata. |
| `PATCH /admin/attachments/:id` | Admin rename via `{title}`; null/blank clears visible title. |
| `DELETE /admin/attachments/:id` | Admin soft delete; `204`. |
| `GET /attachments/:id/preview` | Authenticated role-aware stream with inline disposition. |
| `GET /attachments/:id/download` | Authenticated role-aware stream with attachment disposition. |

Pagination rejects non-integers/out-of-range sizes; a page beyond the result returns an empty page, not an error. Concurrent ordinary edits are last-write-wins. ETags/version fields are rejected as unnecessary for the current single-admin-scale workflow.

## Angular route, state, and component design

### Core client files

```text
frontend/src/app/
├── core/academy/
│   ├── academy-types.ts
│   ├── academy-endpoint.ts
│   ├── academy-api.service.ts
│   ├── academy-session.store.ts
│   ├── academy-auth.interceptor.ts
│   ├── academy-guards.ts
│   └── academy-markdown.ts
└── pages/academy/
    ├── academy-shell.component.ts
    ├── access.component.ts
    ├── password-change.component.ts
    ├── parent-post-list.component.ts
    ├── post-detail.component.ts
    ├── admin-post-list.component.ts
    ├── admin-post-editor.component.ts
    ├── admin-users.component.ts
    └── academy-list-state.ts
```

Components remain standalone and keep local templates/styles as the repository does today. Category and attachment controls live inside the post list/editor rather than becoming speculative sub-features. `academy-endpoint.ts` extends the existing pure endpoint-builder pattern and uses `SiteConfigService`'s `apiBaseUrl`.

`AcademySessionStore` has no `HttpClient` dependency. It initializes a token signal from `sessionStorage`, keeps the current user/expiry only in memory, and exposes set/clear operations. Keeping HTTP outside the store avoids an interceptor/service dependency cycle. `AcademyApiService` owns typed HTTP calls; access, guards, and the public home restore the current session through it.

`main.ts` registers `provideHttpClient(withInterceptors([academyAuthInterceptor]))`. The functional interceptor adds the token only to URLs under the resolved `/academy` API path. On `AUTHENTICATION_REQUIRED`, it clears session state and returns to `/academia/acceso`; it does not convert `FORBIDDEN` or `PASSWORD_CHANGE_REQUIRED` into logout.

### Routes

Academy components use `loadComponent` so the public home bundle does not eagerly load the portal.

| Route | Component/guard behavior |
| --- | --- |
| `/academia/acceso` | Shared access component. Valid current sessions redirect by role; forced-change sessions go to password change. |
| `/academia/cambiar-contrasena` | Auth guard only; displays own-password change and logout. |
| `/academia` | Portal shell + auth + password-changed guards. Empty child is parent feed; admins redirect to their landing. |
| `/academia/publicaciones/:id` | Parent post detail; parent role guard. |
| `/academia/admin/publicaciones` | Admin list/landing; admin role guard. |
| `/academia/admin/publicaciones/nueva` | Admin post editor create mode. |
| `/academia/admin/publicaciones/:id` | Admin post editor/inspection mode. |
| `/academia/admin/usuarios` | Admin user administration. |

`/admin` and `/admin/leads` are removed with no redirects. Unknown academy routes return to the correct role landing only after session resolution.

### State and UI behavior

- Session is the only global state.
- Parent/admin list search, category/status filters, and page live in URL query parameters. A filter change resets page to 1; browser back/forward restores list state.
- RxJS `debounceTime`/`distinctUntilChanged` handles title/user search; no custom debounce helper is needed.
- Components hold loading/error/current item/editor state locally and reload after mutations. There is no optimistic cache to reconcile.
- The responsive shell uses existing TEW CSS variables, cards, typography, and native controls. Below the existing 820 px breakpoint navigation and list/editor columns stack; actions remain keyboard reachable and alerts retain `role=alert/status` patterns.
- One-time temporary passwords exist only in the creation/reset success panel. Closing or navigating away discards them; the frontend never stores them.
- Conflict codes map to focused Spanish UI messages for category-in-use and last-admin cases, while API contracts remain English/stable.

The public `HomeComponent` removes reactive lead form/API state but retains the Google Forms section. Its menu performs a non-blocking session restore when a token exists: anonymous visitors see **Acceso academia**; a validated user sees username, role destination, and logout. Backend unavailability does not block rendering the public site.

### Attachment client behavior

A normal `<a href>` cannot add a bearer header, so the frontend never puts tokens in attachment query strings. Preview/download buttons call `AcademyApiService` with `responseType:'blob'`, create a short-lived object URL, and open or download that blob. Object URLs are revoked after use or component destruction. The filename is derived from returned metadata for the browser action; the server still sends the required safe disposition header.

## Administrator CLI

`backend/package.json` adds a production script such as:

```json
"academy:create-admin": "node dist/cli/create-admin.js"
```

The documented flow builds first, then runs that script with the same `SQLITE_DB_PATH` as the server. `create-admin.ts`:

1. Requires both stdin and stdout to be TTYs before opening the database.
2. Reads display name and username with `node:readline/promises`.
3. Closes readline, then reads password twice through `tty-password.ts`, which temporarily enables raw mode, handles newline/backspace/Ctrl-C, echoes no characters, and restores terminal state in `finally`.
4. Validates matching 10–128 character passwords and the normal username rules.
5. Hashes before entering a database transaction.
6. Inserts a normal active admin with `mustChangePassword=0` and a system audit row atomically.
7. Prints only a success/failure message and username, never the password/hash.

The command may run repeatedly for recovery administrators. Non-TTY, mismatch, duplicate username, migration, or database failure exits non-zero without a user row. Pure username/password validation is unit tested; hidden terminal behavior receives a documented manual TTY smoke check rather than a pseudo-terminal dependency.

## Dependencies

Implementation may change manifests/lockfile only for these choices:

| Package | Location | Reason |
| --- | --- | --- |
| `busboy` | backend runtime | Maintained streaming multipart parser with byte/file/part limits; avoids buffering and bespoke parsing. |
| `@types/busboy` | backend development | Strict TypeScript declarations if the selected Busboy release does not ship them. |
| `micromark` | backend and frontend runtime | Small Markdown-to-HTML compiler that defaults to safe HTML/protocol handling and works in Node and browser. |

The same compatible `micromark` version is pinned in both workspace packages. No Multer, DOMPurify, bcrypt, JWT, ORM, migration framework, NgRx, WYSIWYG editor, prompt library, or upload SDK is added. If the selected Busboy version ships adequate declarations, `@types/busboy` is omitted.

## Deployment, rollout, and migration

### Durable layout

Production config uses one durable mounted directory, for example:

```text
/app/backend/data/
├── tew.sqlite
├── tew.sqlite-wal
├── tew.sqlite-shm
└── uploads/
```

`SQLITE_DB_PATH=/app/backend/data/tew.sqlite` and `FILE_STORAGE_PATH=/app/backend/data/uploads` share that lifecycle. `FILE_STORAGE_PATH` defaults to `backend/data/uploads` for local use. `.gitignore` adds the upload tree. Docker Compose mounts a named volume at `/app/backend/data`; direct-server guidance requires an equivalent persistent directory owned by the backend process.

The reverse proxy continues routing `/api` to Express and all other paths to Angular. The old `/admin` proxy special case is removed. `trust proxy` remains disabled unless the operator documents the exact proxy hop/topology; when enabled it must be a specific trusted setting, not unconditional `true` for an unknown chain.

GitHub Pages remains public-site-only. An empty/unreachable `apiBaseUrl` must present academy access as unavailable; documentation must not claim login or private materials work there.

### Release sequence

1. Stop or place the functional deployment in a short maintenance window; old and new private APIs are not kept compatible.
2. Back up the SQLite database, including WAL state through a safe SQLite backup/checkpoint procedure, and the entire upload directory if it already exists.
3. Provision durable database/upload paths and permissions.
4. Deploy the backend. Startup applies academy migration 1 and fails closed on error.
5. Run the TTY CLI against the production database to create the first admin if none exists.
6. Deploy the Angular build and updated `/api` proxy configuration.
7. Run the clean/admin/parent/post/attachment smoke path, then verify stale hidden/deleted URLs.
8. Retire legacy environment credentials from active configuration after the rollback window. They are ignored by the academy release.

There is no automatic user, lead, session, or file conversion. Legacy rows remain byte-for-byte under their existing tables, and old admin tokens cannot match the new `sessions` table.

### Rollback

Rollback is code/deployment rollback, not a reverse migration:

1. Stop academy writes and preserve a fresh SQLite/upload backup.
2. Redeploy the prior release and restore its required environment values if emergency access to the prior lead/admin behavior is needed.
3. Leave `user_version`, academy tables, and upload files in place; the current prior release does not inspect them, and destructive down migrations are forbidden.
4. Keep `leads` and `admin_sessions` untouched, so the prior application can still read historic data.
5. Before re-enabling an academy release, verify its migration version is compatible and reuse the preserved data.

If migration 1 fails, its transaction rolls back and the backend never starts. If frontend deployment must be rolled back while the academy backend remains, the API can stay idle; no data reversal is required.

## Focused test strategy

Strict TDD applies: write the smallest failing test for each behavior before implementation, then keep only tests that protect a contract or non-trivial branch.

### Backend `node:test`

| Focused file | Evidence |
| --- | --- |
| `storage/academy-migrations.test.ts` | Clean schema, idempotent rerun, foreign keys, partial username reuse, newer-version refusal, and preservation/non-use of pre-existing legacy tables/rows. |
| `academy/auth-service.test.ts` | scrypt round trip and malformed encoding, normalization, generic failures, dummy verification path, 32-byte opaque token hashing, rolling eight-hour expiry, simultaneous sessions, forced-change gate, logout, and all-session revocation. |
| `academy/login-limiter.test.ts` | Ten allowed/eleventh rejected, IP key, expiry, and bounded-map eviction using injected timestamps. |
| `academy/user-service.test.ts` | Parent-only portal creation, temporary-password shape without hardcoded plaintext assertions, search/filter/page, disable/delete revocation, username reuse, reset, and last-active-admin transaction. |
| `academy/publication-service.test.ts` | Category uniqueness/in-use including deleted posts, visible-default lifecycle, updated timestamp, no restore, parent filtering/search/category/page, and malicious Markdown output. |
| `academy/attachment-service.test.ts` | Count, size, exact MIME/signatures, ignored filename, stable ordinal/name/sort, temp cleanup, rename-before-commit compensation, soft-delete retention, and admin/parent access decisions using temp directories. |
| `routes/academy-routes.test.ts` | Real Express server with temp DB/storage: error shape/status, role denial, forced password change, stale hidden/deleted post and file URLs, multipart rejection/success, safe stream headers, and obsolete route 404s. |
| `cli/create-admin.test.ts` | Pure validation and transactional user/system-audit creation; non-TTY fails before persistence. Hidden input is manually smoked. |

Tests pass explicit env/path objects and clocks where needed; no general mocking framework is added. Security tests may use a generated temporary password to authenticate but never log it or compare it to a checked-in literal.

### Frontend `node:test`

Keep the repository's lightweight pure/helper/template test approach:

- endpoint building against empty, relative, and absolute `apiBaseUrl`;
- token-only session storage and clear behavior;
- interceptor academy-only header attachment and 401 clearing;
- guard decision helpers for anonymous, forced-change, parent, and admin routes;
- list-state query parsing, filter reset, pagination, and role destination;
- malicious Markdown fixtures and absence of trust-bypass calls;
- forced-password template behavior and one-time password panel hooks;
- source/visual editor mode hooks and responsive academy shell/menu semantics;
- public home retains the Google Forms link, removes lead plumbing, and exposes anonymous/authenticated academy navigation.

No browser E2E/TestBed expansion is required unless pure tests cannot protect an Angular-specific behavior discovered during implementation.

### Gates and smoke flow

Automated gates remain:

```bash
pnpm --recursive test
pnpm --recursive run build
```

Manual validation uses clean temporary durable paths: run the CLI, log in as admin, create a parent, use the temporary password, prove forced change, re-login, publish a post with each supported attachment type, verify preview/download headers, then hide/delete the post/attachment and prove the parent's copied direct URLs fail immediately. Also run the CLI from non-TTY input and confirm no admin is created.

## Rejected alternatives and tradeoffs

| Alternative | Why rejected / accepted tradeoff |
| --- | --- |
| Adapt the lead admin | Preserves two incompatible identity/content models; approved scope requires replacement. |
| Drop or convert legacy tables | Risks historic data loss and creates no value for the academy model. |
| JWT/refresh tokens or cookies | Opaque hashed sessions already fit the codebase and permit immediate revocation. Session storage avoids cookie/CSRF machinery, accepting that any same-origin XSS can access the tab token. |
| bcrypt/Argon dependency | Node's built-in scrypt meets the password requirement and avoids another native/runtime package. |
| ORM/migration framework | `node:sqlite`, prepared SQL, and one forward migration are simpler and already match the project. |
| Long-lived DB abstraction/pool | `DatabaseSync` plus per-operation connections and the current write queue are enough at this scale. Auth requests perform writes for rolling expiry, so throughput is intentionally bounded to one process. |
| Multer/in-memory upload | Adds higher-level storage behavior and encourages buffering; Busboy exposes the required streaming limits directly. |
| Store files in SQLite | Inflates database backups/WAL and complicates streaming; approved deployment already requires durable local files. |
| Cloud/object storage | Explicitly out of scope; add only when multi-instance deployment or independent storage durability is required. |
| Metadata-first file commit | Can expose metadata whose content was never durably moved. File-first plus rollback compensation prefers harmless orphans over broken accessible records. |
| Automatic orphan cleanup | A cleanup mistake can delete retained content. Add reconciliation only if operational evidence justifies it. |
| Store rendered HTML | Duplicates source/output and complicates renderer upgrades. Render on detail reads at current expected volume. |
| Marked plus sanitizer or custom regex sanitizer | More moving parts or unsafe parsing. Micromark safe options plus Angular sanitization cover the two execution boundaries. |
| Rich-text/WYSIWYG editor | Requires HTML-to-Markdown conversion and more sanitization. Native Markdown controls plus preview satisfy visual/source modes. |
| NgRx/global publication cache | Server authorization and current visibility must be rechecked; local state and query params are smaller and safer. |
| Signed/public file URLs | Copied links could outlive current authorization. Blob requests preserve bearer authentication on every read. |
| Audit UI/details JSON | Not required and increases secret leakage risk. Minimal append-only rows provide technical mutation evidence. |
| Compatibility redirects/routes | The specification explicitly removes old behavior; a maintenance-window deployment is clearer than maintaining a second API. |
| Automatic reverse migrations | Additive academy data has no meaningful lead representation. Backups and code rollback preserve recovery options without destructive conversion. |

## Planned removals and repository-wide changes

Implementation removes the legacy backend route/module/test files and frontend admin/lead service/form files named in exploration, then updates their explicit package test lists. It modifies only these cross-cutting existing areas beyond new academy files:

- `backend/src/app.ts`, `backend/src/server.ts`, `backend/src/config/env.ts`, `backend/src/modules/storage/sqlite.ts`, and `backend/package.json`;
- `frontend/src/main.ts`, `frontend/src/app/app.routes.ts`, `frontend/src/app/pages/home/home.component.ts`, its template/styles/tests, and `frontend/package.json`;
- `pnpm-lock.yaml`, `.gitignore`, `Dockerfile`, `docker-compose.yml`, `docker/nginx/local.conf`, and `README.md`.

Existing public design tokens, standalone component style, `SiteConfigService`, strict compiler settings, health route, Google Forms enrolment link, and explicit Node test runner remain. No product code is implemented by this design phase.
