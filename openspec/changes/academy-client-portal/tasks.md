# Tasks: Academy client portal

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 4,000–5,500 additions + deletions across backend, frontend, tests, dependency lockfile, and deployment docs |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 migration schema → PR 2 storage startup → PR 3 auth → PR 4 users/CLI → PR 5 publications → PR 6 attachments → PR 7 backend legacy retirement → PR 8 frontend session/routing → PR 9 parent portal → PR 10 admin users → PR 11 admin content → PR 12 public cleanup/deployment |
| Delivery strategy | chained delivery |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

Unchecked boxes are the native next-state. The user-approved feature-branch chain replaces the former delivery gate; this planning update does not authorize product-code apply.

## Feature-branch-chain delivery plan

At authorized apply, create `feat/academy-client-portal` from `main` and open its PR to `main` as the draft/no-merge tracker. No child targets `main`: child PR 1 targets the tracker branch, and each later child is created from and targets the immediately preceding child branch. Keep the tracker draft and do not merge it until all children are reviewed and integrated in order.

Each child PR is one work unit, includes its linked acceptance criteria, focused test/build evidence, rollback boundary, start/end state, prior dependency, follow-up work, and a Chain Context dependency diagram with the current PR marked `📍`. Its clean diff must stay at or below 400 additions + deletions; if a cohesive work unit cannot, perform one honest split pass and escalate a `size:exception` rather than compressing tests, docs, or code.

| Child PR | Work unit | Child branch | Base branch / prior chain dependency |
|---|---|---|---|
| 1 | 1A. Academy migration schema | `feat/academy-client-portal-01-migrations` | `feat/academy-client-portal` (tracker; no prior child) |
| 2 | 1B. Storage startup preparation | `feat/academy-client-portal-02-storage-startup` | `feat/academy-client-portal-01-migrations` (child 1) |
| 3 | 2. Academy authentication, sessions, and authorization middleware | `feat/academy-client-portal-03-auth` | `feat/academy-client-portal-02-storage-startup` (child 2) |
| 4 | 3. Administrator user lifecycle and recovery CLI | `feat/academy-client-portal-04-users-cli` | `feat/academy-client-portal-03-auth` (child 3) |
| 5 | 4. Categories, publications, Markdown, and role-aware reads | `feat/academy-client-portal-05-publications` | `feat/academy-client-portal-04-users-cli` (child 4) |
| 6 | 5. Attachment lifecycle, durable storage, and protected streams | `feat/academy-client-portal-06-attachments` | `feat/academy-client-portal-05-publications` (child 5) |
| 7 | 6. Retire active backend lead and shared-admin behavior | `feat/academy-client-portal-07-retire-backend` | `feat/academy-client-portal-06-attachments` (child 6) |
| 8 | 7. Frontend academy session core, routes, and access flow | `feat/academy-client-portal-08-frontend-core` | `feat/academy-client-portal-07-retire-backend` (child 7) |
| 9 | 8. Parent publication feed, detail, and attachment UX | `feat/academy-client-portal-09-parent-portal` | `feat/academy-client-portal-08-frontend-core` (child 8) |
| 10 | 9. Administrator user-management frontend | `feat/academy-client-portal-10-admin-users` | `feat/academy-client-portal-09-parent-portal` (child 9) |
| 11 | 10. Administrator content, category, and attachment frontend | `feat/academy-client-portal-11-admin-content` | `feat/academy-client-portal-10-admin-users` (child 10) |
| 12 | 11. Retire the legacy frontend and complete deployment/documentation migration | `feat/academy-client-portal-12-retire-frontend-deploy` | `feat/academy-client-portal-11-admin-content` (child 11) |

The work-unit **Depends on** fields below remain the product dependency and acceptance order; the child-branch bases add the required linear review/integration order. Retarget or rebase any polluted child diff before review.

## Implementation work units

### 1. Academy persistence foundation

**Depends on:** none. **Start → finish:** existing SQLite initialization → forward academy migration runner and durable-path preparation, with legacy behavior retained only until work unit 6 removes it. **Expected surfaces:** `backend/src/modules/storage/sqlite.ts`, `backend/src/modules/storage/academy-migrations.ts`, `backend/src/modules/storage/academy-migrations.test.ts`, `backend/src/config/env.ts`, `backend/src/server.ts`, `backend/src/app.test.ts`, `backend/package.json`. **Rollback:** deploy the prior build; leave additive academy tables and files untouched.

**Acceptance:** [additive, idempotent, foreign-key-enforced academy schema](specs/legacy-administration/spec.md#requirement-academy-schema-migration-is-additive-and-referentially-enforced). Legacy retirement acceptance is completed in work unit 6.

- [x] RED — add `backend/src/modules/storage/academy-migrations.test.ts` cases for direct academy-schema creation, idempotent rerun, `user_version` ordering/newer-version refusal, foreign keys, partial username reuse, and unchanged pre-existing `leads`/`admin_sessions` rows. <!-- sdd-owner: implementation -->
- [x] GREEN — add the ordered `PRAGMA user_version` migration and per-connection pragmas in `backend/src/modules/storage/academy-migrations.ts` and `backend/src/modules/storage/sqlite.ts`; run the academy migration alongside the temporarily retained legacy initializer, and prepare configured SQLite and `FILE_STORAGE_PATH` directories before `backend/src/server.ts` listens. <!-- sdd-owner: implementation -->
- [x] TRIANGULATE — extend `backend/src/modules/storage/academy-migrations.test.ts` and `backend/src/app.test.ts` for migration rollback on failure, a database version newer than the binary, and coexistence with unchanged pre-existing legacy tables until work unit 6 retires their active initialization. <!-- sdd-owner: implementation -->
- [x] REFACTOR — keep migration SQL and transaction/write-queue ownership limited to `backend/src/modules/storage/{academy-migrations,sqlite}.ts`, update `backend/package.json`’s explicit test list, and run `pnpm --filter tew-backend exec node --test --experimental-strip-types src/modules/storage/academy-migrations.test.ts src/app.test.ts`. <!-- sdd-owner: implementation -->
- [x] CORRECTION — update `backend/src/modules/storage/sqlite.ts` to verify the configured upload directory is writable before startup, add the regression in `backend/src/modules/storage/academy-migrations.test.ts`, record evidence in `openspec/changes/academy-client-portal/apply-progress.md`, and rerun the migration/app test command plus the backend build. <!-- sdd-owner: implementation -->

### 2. Academy authentication, sessions, and authorization middleware

**Depends on:** 1. **Start → finish:** academy tables exist → `/api/academy` login/session/logout/password endpoints authenticate only new database sessions and middleware enforces role/forced-change boundaries. **Expected surfaces:** `backend/src/modules/academy/{academy-errors,academy-types,password,login-limiter,auth-repository,auth-service,audit-repository}.ts`, `backend/src/modules/academy/{auth-service,login-limiter}.test.ts`, `backend/src/routes/{academy-router,academy-auth,academy-middleware}.ts`, `backend/src/routes/academy-routes.test.ts`, `backend/src/app.ts`. **Rollback:** remove academy router registration and redeploy the preceding persistence build; do not delete session rows.

**Acceptance:** [secure individual authentication](specs/academy-authentication/spec.md#requirement-secure-individual-authentication), [session contract](specs/academy-authentication/spec.md#requirement-session-endpoint-contract), [rolling authorization and revocation](specs/academy-authentication/spec.md#requirement-rolling-session-authorization-and-revocation), [forced password boundary](specs/academy-authentication/spec.md#requirement-forced-password-change-boundary), [bounded login protection](specs/academy-authentication/spec.md#requirement-bounded-login-abuse-protection).

- [ ] RED — create `backend/src/modules/academy/{auth-service,login-limiter}.test.ts` and `backend/src/routes/academy-routes.test.ts` for normalized generic login failure, scrypt/token-hash secrecy, eight-hour rolling expiry, logout, simultaneous sessions, forced-change denial, parent/admin denial, and ten-attempt IP limiting. <!-- sdd-owner: implementation -->
- [ ] GREEN — implement the minimal password/token, limiter, repository, service, error-shape, and Express middleware/route code in `backend/src/modules/academy/*.ts` and `backend/src/routes/{academy-router,academy-auth,academy-middleware}.ts`; register only the academy router path in `backend/src/app.ts`. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — add focused cases in the same backend tests for malformed stored hash, expired-session removal, disabled/deleted dummy verification, eleventh-attempt `Retry-After`, all-session revocation after own-password change, and no-store login/password responses. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — centralize shared safe errors and bearer/session resolution without an auth abstraction beyond the planned modules, update `backend/package.json`, and run `pnpm --filter tew-backend exec node --test --experimental-strip-types src/modules/academy/auth-service.test.ts src/modules/academy/login-limiter.test.ts src/routes/academy-routes.test.ts`. <!-- sdd-owner: implementation -->

### 3. Administrator user lifecycle and recovery CLI

**Depends on:** 1–2. **Start → finish:** authenticated admin boundary → parent account lifecycle APIs plus a non-interactive-safe administrator bootstrap/recovery CLI. **Expected surfaces:** `backend/src/modules/academy/{user-repository,user-service,audit-repository,password}.ts`, `backend/src/modules/academy/user-service.test.ts`, `backend/src/routes/academy-admin-users.ts`, `backend/src/routes/academy-routes.test.ts`, `backend/src/cli/{create-admin,tty-password}.ts`, `backend/src/cli/create-admin.test.ts`, `backend/package.json`. **Rollback:** remove user-route and CLI script exposure; retain additive user/audit records for recovery.

**Acceptance:** [account creation lifecycle](specs/academy-user-administration/spec.md#requirement-account-identity-and-creation-lifecycle), [user discovery/lifecycle](specs/academy-user-administration/spec.md#requirement-administrator-user-discovery-and-lifecycle-controls), [last-admin protection](specs/academy-user-administration/spec.md#requirement-last-active-administrator-protection), [reset secrecy](specs/academy-user-administration/spec.md#requirement-password-reset-secrecy), [TTY bootstrap](specs/academy-user-administration/spec.md#requirement-tty-only-administrator-bootstrap-and-recovery), [append-only audit](specs/auditability/spec.md#requirement-append-only-academy-mutation-audit).

- [ ] RED — add `backend/src/modules/academy/user-service.test.ts`, `backend/src/cli/create-admin.test.ts`, and route cases for parent-only creation, one-time temporary passwords, literal search/filter/page behavior, reset/disable/delete revocation, username reuse, sole-admin conflict, system audit actor, and non-TTY rejection. <!-- sdd-owner: implementation -->
- [ ] GREEN — implement user repository/service operations, admin user routes, and the `backend/src/cli/create-admin.ts`/`tty-password.ts` TTY flow with password generation outside persistence and account/audit writes in one transaction. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — cover duplicate normalized live usernames, target admin enablement, disabled/deleted listing states, invalid UUID/query input, CLI password mismatch, and assertions that responses/audits never contain password hashes or plaintext after the one success response. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — keep account mutation, session revocation, and audit insertion transactional in `backend/src/modules/academy/user-service.ts`; add the compiled `academy:create-admin` script and explicit tests in `backend/package.json`, then run `pnpm --filter tew-backend exec node --test --experimental-strip-types src/modules/academy/user-service.test.ts src/cli/create-admin.test.ts src/routes/academy-routes.test.ts`. <!-- sdd-owner: implementation -->

### 4. Categories, publications, Markdown, and role-aware reads

**Depends on:** 1–2. **Start → finish:** authenticated role boundary → administrators manage category/publication lifecycle while parent/admin reads apply distinct visibility contracts. **Expected surfaces:** `backend/src/modules/academy/{publication-repository,publication-service,markdown,audit-repository}.ts`, `backend/src/modules/academy/publication-service.test.ts`, `backend/src/routes/{academy-posts,academy-admin-content}.ts`, `backend/src/routes/academy-routes.test.ts`, `backend/package.json`, `frontend/package.json`, `pnpm-lock.yaml`. **Rollback:** remove content routes; preserve posts/categories/audit rows with no down migration.

**Acceptance:** [category integrity](specs/publication-administration/spec.md#requirement-category-lifecycle-integrity), [publication lifecycle](specs/publication-administration/spec.md#requirement-publication-lifecycle-and-administration-visibility), [safe Markdown](specs/publication-administration/spec.md#requirement-safe-markdown-source-editing-and-rendering), [parent feed](specs/parent-publication-access/spec.md#requirement-parent-publication-feed-and-discovery), [protected detail](specs/parent-publication-access/spec.md#requirement-protected-publication-detail).

- [ ] RED — add `backend/src/modules/academy/publication-service.test.ts` and route cases for category uniqueness/in-use including deleted posts, visible-by-default creation, update timestamps, no restore, parent-only visible list/detail/search/category/page, admin status inspection, and raw-HTML/unsafe-URL Markdown fixtures. <!-- sdd-owner: implementation -->
- [ ] GREEN — add the pinned shared `micromark` dependency in `backend/package.json`, `frontend/package.json`, and `pnpm-lock.yaml`, then implement category/post repository/service/query/route behavior and safe Markdown rendering in the planned backend files. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — prove parent list and stale detail requests return no hidden/deleted metadata, escaped `%`/`_` title searches remain literal, deleted posts reject further mutation, and audit rows omit Markdown payloads. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — keep category operations within the publication lifecycle modules, update `backend/package.json`’s explicit test list, and run `pnpm --filter tew-backend exec node --test --experimental-strip-types src/modules/academy/publication-service.test.ts src/routes/academy-routes.test.ts`. <!-- sdd-owner: implementation -->

### 5. Attachment lifecycle, durable storage, and protected streams

**Depends on:** 1–2 and 4. **Start → finish:** administrator-managed posts → streamed, validated materials with current-access stream checks. **Expected surfaces:** `backend/src/modules/academy/{attachment-repository,attachment-service,file-storage,audit-repository}.ts`, `backend/src/modules/academy/attachment-service.test.ts`, `backend/src/routes/academy-attachments.ts`, `backend/src/routes/academy-routes.test.ts`, `backend/package.json`, `pnpm-lock.yaml`. **Rollback:** unregister attachment mutation/stream routes; retain validated physical files and metadata for recovery, never delete files automatically.

**Acceptance:** [upload limits](specs/attachment-management/spec.md#requirement-validated-attachment-upload-limits), [opaque storage/lifecycle](specs/attachment-management/spec.md#requirement-opaque-durable-file-storage-and-metadata-lifecycle), [safe streams](specs/attachment-management/spec.md#requirement-safe-authenticated-preview-and-download), [attachment audit](specs/attachment-management/spec.md#requirement-attachment-mutation-audit-coverage), [parent derived access](specs/parent-publication-access/spec.md#requirement-parent-attachment-access-is-derived-from-current-publication-access).

- [ ] RED — add `backend/src/modules/academy/attachment-service.test.ts` and multipart route cases for MIME/signature pairs, 10-total limit including soft-deleted rows, 20 MiB limit, ignored client names, stable ordinals/sort, temp cleanup, rename compensation, and parent/admin stream access. <!-- sdd-owner: implementation -->
- [ ] GREEN — add the selected `busboy` runtime dependency (and declarations only if needed) in `backend/package.json`/`pnpm-lock.yaml`, then implement bounded multipart streaming, trusted storage-path handling, metadata/audit transactions, rename/soft-delete, and preview/download routes. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — add checks for missing/extra/truncated files, MIME-signature mismatch, database failure after rename, soft-delete file retention, hidden/deleted stale URLs, exact content headers, `nosniff`, safe fallback/title disposition names, and no client/storage identifiers in responses/audit. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — constrain filesystem work to `backend/src/modules/academy/file-storage.ts` and SQL to attachment repositories, update `backend/package.json`’s explicit test list, and run `pnpm --filter tew-backend exec node --test --experimental-strip-types src/modules/academy/attachment-service.test.ts src/routes/academy-routes.test.ts`. <!-- sdd-owner: implementation -->

### 6. Retire active backend lead and shared-admin behavior

**Depends on:** 1–5. **Start → finish:** academy API covers replacement backend behavior → legacy route/module/config/test registration is gone while historic tables remain untouched. **Expected surfaces:** `backend/src/app.ts`, `backend/src/config/env.ts`, `backend/src/modules/storage/sqlite.ts`, `backend/src/routes/{leads,admin-auth,admin-leads}.ts`, `backend/src/modules/leads/**`, `backend/src/modules/auth/{admin-auth,admin-session-repository}.ts`, related `*.test.ts`, `backend/package.json`, `backend/src/routes/academy-routes.test.ts`. **Rollback:** revert only legacy-removal commit and restore prior runtime configuration; do not drop legacy or academy tables.

**Acceptance:** [legacy administration removal](specs/legacy-administration/spec.md#requirement-legacy-administration-removal), [legacy tables remain preserved and unauthenticated](specs/legacy-administration/spec.md#requirement-legacy-tables-remain-physically-preserved-and-unauthenticated), [inert legacy leads](specs/public-enrolment/spec.md#requirement-inert-legacy-lead-preservation).

- [ ] RED — add obsolete-route `404` and legacy-token-denial cases to `backend/src/routes/academy-routes.test.ts`, and adjust `backend/src/modules/storage/academy-migrations.test.ts` to prove clean initialization no longer creates/imports/queries legacy data while pre-existing legacy rows remain unchanged. <!-- sdd-owner: implementation -->
- [ ] GREEN — remove the listed legacy lead/admin route and module files, their registrations in `backend/src/app.ts`, deprecated environment parsing in `backend/src/config/env.ts`, and legacy creation/import behavior from `backend/src/modules/storage/sqlite.ts`; retain no code path that drops historic tables. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — verify a database containing legacy rows keeps them byte-for-byte while academy authentication rejects old `admin_sessions` material and health plus `/api/academy` remain the only active backend surface. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — remove only orphaned backend test-script entries from `backend/package.json`, retain academy coverage, and run `pnpm --filter tew-backend test` followed by `pnpm --filter tew-backend run build`. <!-- sdd-owner: implementation -->

### 7. Frontend academy session core, routes, and access flow

**Depends on:** 2 and 6. **Start → finish:** backend academy session API → lazy academy routes, token-only client session, interceptor, guards, and shared access/password-change experiences. **Expected surfaces:** `frontend/src/main.ts`, `frontend/src/app/app.routes.ts`, `frontend/src/app/core/academy/{academy-types,academy-endpoint,academy-api.service,academy-session.store,academy-auth.interceptor,academy-guards}.ts`, associated `*.test.ts`, `frontend/src/app/pages/academy/{access,password-change,academy-shell}.component.ts`, `frontend/package.json`. **Rollback:** remove academy route/provider registration and redeploy the prior public frontend; backend data remains idle.

**Acceptance:** [academy session client behavior](specs/academy-frontend/spec.md#requirement-academy-session-client-behavior), [login, forced change, and role routes](specs/academy-frontend/spec.md#requirement-login-forced-password-change-and-role-routes).

- [ ] RED — add focused tests beside `frontend/src/app/core/academy/` for endpoint base resolution, sessionStorage token-only lifecycle, academy-only bearer attachment, 401 clear/redirect, and anonymous/forced-change/parent/admin guard decisions. <!-- sdd-owner: implementation -->
- [ ] GREEN — implement the smallest typed API/session/interceptor/guard layer and lazy `/academia/**` route tree in the listed core files, `frontend/src/main.ts`, `frontend/src/app/app.routes.ts`, and access/password-change/shell components. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — prove empty/relative/absolute API bases, logout, `PASSWORD_CHANGE_REQUIRED` without logout, admin landing, parent admin-route redirect, and unavailable API handling without blocking the public home. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — keep HTTP in `academy-api.service.ts`, token/current-user state in `academy-session.store.ts`, and navigation-only logic in guards; update `frontend/package.json` and run `pnpm --filter tew-frontend test && pnpm --filter tew-frontend run build`. <!-- sdd-owner: implementation -->

### 8. Parent publication feed, detail, and attachment UX

**Depends on:** 4–5 and 7. **Start → finish:** authenticated academy shell → responsive parent discovery/detail routes with blob-based protected material actions. **Expected surfaces:** `frontend/src/app/pages/academy/{parent-post-list,post-detail,academy-list-state}.ts`, associated `*.test.ts`, `frontend/src/app/core/academy/{academy-api.service,academy-markdown,academy-types}.ts`. **Rollback:** remove parent child routes/components; session core and backend content remain unchanged.

**Acceptance:** [parent portal experience](specs/academy-frontend/spec.md#requirement-parent-portal-experience), [parent feed/discovery](specs/parent-publication-access/spec.md#requirement-parent-publication-feed-and-discovery), [protected detail](specs/parent-publication-access/spec.md#requirement-protected-publication-detail), [safe streams](specs/attachment-management/spec.md#requirement-safe-authenticated-preview-and-download).

- [ ] RED — add `frontend/src/app/pages/academy/{academy-list-state,parent-post-list,post-detail}.test.ts` coverage for query parsing/filter page reset/pagination, newest-first parent cards, category All, no author/deleted fields, safe rendered fixtures, narrow-width semantics, and blob preview/download URL cleanup hooks. <!-- sdd-owner: implementation -->
- [ ] GREEN — implement parent list/detail components and query-parameter state, typed list/detail/blob API calls, Angular-sanitized generated Markdown binding, and authenticated attachment actions without token-bearing URLs. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — cover browser back/forward filter restoration, empty/out-of-range pages, inaccessible detail errors, `Material N` filename fallback, and object-URL revocation on download/component teardown. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — retain local component state rather than a publication cache, preserve existing responsive tokens/alerts, and run `pnpm --filter tew-frontend test && pnpm --filter tew-frontend run build`. <!-- sdd-owner: implementation -->

### 9. Administrator user-management frontend

**Depends on:** 3 and 7. **Start → finish:** academy admin navigation → responsive user management with transient temporary-password display and lifecycle conflict messaging. **Expected surfaces:** `frontend/src/app/pages/academy/admin-users.component.ts`, `frontend/src/app/pages/academy/academy-list-state.ts`, associated `*.test.ts`, `frontend/src/app/core/academy/{academy-api.service,academy-types}.ts`. **Rollback:** remove the admin-users route/component; no user records or sessions are modified by rollback alone.

**Acceptance:** [administrator portal experience](specs/academy-frontend/spec.md#requirement-administrator-portal-experience), [user discovery/lifecycle](specs/academy-user-administration/spec.md#requirement-administrator-user-discovery-and-lifecycle-controls), [last-admin protection](specs/academy-user-administration/spec.md#requirement-last-active-administrator-protection), [reset secrecy](specs/academy-user-administration/spec.md#requirement-password-reset-secrecy).

- [ ] RED — add `frontend/src/app/pages/academy/admin-users.test.ts` cases for name/username/UUID search, role/status filters, page reset, create/reset one-time-password panels, disabled/deleted actions, and focused `LAST_ACTIVE_ADMIN` messaging. <!-- sdd-owner: implementation -->
- [ ] GREEN — add typed user API methods and implement `admin-users.component.ts` with query-backed filters, pagination, lifecycle controls, subtle UUID display, and response-scoped temporary-password state. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — prove closing/navigating clears temporary passwords, route guards block parents, validation/conflict errors retain form state, and narrow layouts preserve keyboard-accessible actions. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — keep list/editor state component-local and reuse `academy-list-state.ts` only for shared query behavior; run `pnpm --filter tew-frontend test && pnpm --filter tew-frontend run build`. <!-- sdd-owner: implementation -->

### 10. Administrator content, category, and attachment frontend

**Depends on:** 4–5 and 7. **Start → finish:** academy admin publications route → one focused content workspace for status inspection, category lifecycle, Markdown modes/preview, and attachment mutations. **Expected surfaces:** `frontend/src/app/pages/academy/{admin-post-list,admin-post-editor}.component.ts`, associated `*.test.ts`, `frontend/src/app/core/academy/{academy-api.service,academy-markdown,academy-types}.ts`. **Rollback:** remove admin content child routes/components while preserving server-side records/files.

**Acceptance:** [administrator portal experience](specs/academy-frontend/spec.md#requirement-administrator-portal-experience), [category integrity](specs/publication-administration/spec.md#requirement-category-lifecycle-integrity), [publication lifecycle](specs/publication-administration/spec.md#requirement-publication-lifecycle-and-administration-visibility), [safe Markdown](specs/publication-administration/spec.md#requirement-safe-markdown-source-editing-and-rendering), [attachment lifecycle](specs/attachment-management/spec.md#requirement-opaque-durable-file-storage-and-metadata-lifecycle).

- [ ] RED — add `frontend/src/app/pages/academy/{admin-post-list,admin-post-editor}.test.ts` coverage for visible/hidden/deleted inspection, category conflict presentation, create/edit/hide/delete controls, visual/source mode hooks using one Markdown source, safe preview fixtures, upload/rename/delete controls, and responsive shell navigation. <!-- sdd-owner: implementation -->
- [ ] GREEN — implement the two planned admin content components and typed API calls, using native textarea selection controls/local generated preview, category controls within the content workspace, and `FormData` upload without a new editor/state dependency. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — cover mode-switch source preservation, no trust-bypass use, deleted-post mutation rejection display, attachment limit/type/size failures, retained deleted-material inspection, and keyboard/narrow-width behavior. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — retain component-local editor state and the existing design tokens rather than adding component families or a rich-text editor; run `pnpm --filter tew-frontend test && pnpm --filter tew-frontend run build`. <!-- sdd-owner: implementation -->

### 11. Retire the legacy frontend and complete deployment/documentation migration

**Depends on:** 6–10. **Start → finish:** academy portal replaces legacy UI → obsolete frontend code, proxy behavior, runtime guidance, and test entries are removed while Google Forms remains public. **Expected surfaces:** `frontend/src/app/{app.routes.ts,pages/admin/**,core/services/admin-*,core/services/leads-*,pages/home/home-form.ts}`, `frontend/src/app/pages/home/{home.component.ts,home.component.html,home-form.test.ts,home-template.test.ts}`, `frontend/package.json`, `.gitignore`, `Dockerfile`, `docker-compose.yml`, `docker/nginx/local.conf`, `README.md`, `pnpm-lock.yaml`. **Rollback:** redeploy the prior frontend/proxy/runtime configuration; preserve academy database/upload data and do not run a down migration.

**Acceptance:** [public academy navigation and enrolment continuity](specs/academy-frontend/spec.md#requirement-public-academy-navigation-and-enrolment-continuity), [Google Forms continuity](specs/public-enrolment/spec.md#requirement-google-forms-enrolment-continuity), [persistent runtime configuration](specs/deployment/spec.md#requirement-persistent-academy-runtime-configuration), [private API/static-host limit](specs/deployment/spec.md#requirement-private-api-routing-and-static-host-limitation), [proxy/operational validation](specs/deployment/spec.md#requirement-proxy-trust-boundary-and-operational-validation).

- [ ] RED — update `frontend/src/app/pages/home/{home-template,home-form}.test.ts` and route/template tests to expect Google Forms plus anonymous/authenticated academy navigation, no lead form/API state, no `/admin` compatibility route, and GitHub Pages academy-unavailable behavior. <!-- sdd-owner: implementation -->
- [ ] GREEN — remove `frontend/src/app/pages/admin/**`, legacy `core/services/admin-*`/`leads-*`, `pages/home/home-form.ts`, and their registrations; update `HomeComponent`, routes, menus, proxy configuration, durable Docker Compose volume/configuration, `.gitignore`, and `README.md` for CLI bootstrap, `/api`, uploads/SQLite, proxy trust, static hosting, and rollback. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — verify the public Google Forms call-to-action still works without academy authentication, `/admin` and `/admin/leads` have no redirect, deprecated credential guidance is absent, uploads are ignored/persisted in deployment configuration, and non-TTY CLI smoke creates no account. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — remove only stale frontend test-script entries while retaining all academy tests, then run `pnpm --recursive test`, `pnpm --recursive run build`, and the documented clean-data-path admin → parent → forced-password-change → publication → attachment → hide/delete stale-URL smoke flow. <!-- sdd-owner: implementation -->

## Parent-owned lifecycle gates

- [ ] At authorized apply, create the draft/no-merge `feat/academy-client-portal` tracker PR to `main`, then maintain the listed child base order and clean-diff boundaries; merge the tracker only after all 11 child PRs are reviewed and integrated. <!-- sdd-owner: parent -->
- [ ] After an authorized apply, start or reuse bounded review for each child work unit against its linked acceptance criteria, focused command evidence, rollback boundary, dependency diagram, and 400-line changed-line budget. <!-- sdd-owner: parent -->
