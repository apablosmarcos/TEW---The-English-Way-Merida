# Apply progress: Academy persistence foundation

**Status:** parent-authorized `proceed`; isolated repo-local root `/home/alvaro_pablos/mis_cosas/juanfran-academy-client-portal`; child 1 → `feat/academy-client-portal`; `feature-branch-chain`, 400-line budget. The older harness status named the original worktree, but the explicit parent status selected this root; it was not edited.

**Correction attempt 3 (01-persistence-writability-correction):** `ensureStorageDirectories` now checks the configured upload directory with `W_OK` before `server.ts` starts listening.
**Files:** `backend/src/modules/storage/{sqlite.ts,academy-migrations.test.ts}` and this progress record; no deviation from the design.
**TDD Cycle Evidence:**

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Writability correction | `academy-migrations.test.ts` | Integration | 8/8 | expected missing rejection | 9/9 | existing writable-path case + unwritable-path regression | none needed |
**Verification:** exact migration/app command RED 8 pass, 1 fail (missing rejection); GREEN 9/9; `pnpm --filter tew-backend run build` passed.
**Workload / PR boundary:** correction only, within child 1 and the 400-line budget.
**Remaining / reconciliation:** `- [ ] CORRECTION — update`backend/src/modules/storage/sqlite.ts` to verify the configured upload directory is writable before startup, add the regression in `backend/src/modules/storage/academy-migrations.test.ts`, record evidence in`openspec/changes/academy-client-portal/apply-progress.md`, and rerun the migration/app test command plus the backend build. <!-- sdd-owner: implementation -->`; completed but intentionally unmarked because `tasks.md` is outside the authoritative edit roots. Parent must reconcile the checkbox.

**Completed:** persisted all four work-unit-1 implementation checkboxes. Migration 1 adds academy tables/indexes, foreign-key/busy/WAL connection configuration, version rollback/refusal, and startup directory preparation while retaining legacy initialization to work unit 6.

**Files:** `backend/src/modules/storage/{academy-migrations.ts,academy-migrations.test.ts,sqlite.ts}`, `backend/src/server.ts`, `backend/package.json`, and this change's `tasks.md`/`apply-progress.md`. `env.ts` and `app.test.ts` needed no change because environment-object configuration already accepts `FILE_STORAGE_PATH` and storage integration covers migration behavior.

**Verification:** `pnpm --filter tew-backend exec node --test --experimental-strip-types src/modules/storage/academy-migrations.test.ts src/app.test.ts` — 8/8; `pnpm --filter tew-backend exec node --test --experimental-strip-types src/modules/storage/sqlite.test.ts` — 4/4; `pnpm --filter tew-backend run build` — passed. Product code: 316 additions + deletions, within 400.

## TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1.1–1.4 | `academy-migrations.test.ts` | Integration | Migration/app 8/8 + legacy storage 4/4 | `ERR_MODULE_NOT_FOUND` | 5/5 | rollback/newer/legacy/open-connection: 8/8 | Centralized pragmas; legacy startup separated: 8/8 |

**Remaining:** work unit 1 is checked; exact remaining unchecked rows follow. Parent lifecycle rows are deferred unchanged.

- [ ] RED — create `backend/src/modules/academy/{auth-service,login-limiter}.test.ts` and `backend/src/routes/academy-routes.test.ts` for normalized generic login failure, scrypt/token-hash secrecy, eight-hour rolling expiry, logout, simultaneous sessions, forced-change denial, parent/admin denial, and ten-attempt IP limiting. <!-- sdd-owner: implementation -->
- [ ] GREEN — implement the minimal password/token, limiter, repository, service, error-shape, and Express middleware/route code in `backend/src/modules/academy/*.ts` and `backend/src/routes/{academy-router,academy-auth,academy-middleware}.ts`; register only the academy router path in `backend/src/app.ts`. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — add focused cases in the same backend tests for malformed stored hash, expired-session removal, disabled/deleted dummy verification, eleventh-attempt `Retry-After`, all-session revocation after own-password change, and no-store login/password responses. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — centralize shared safe errors and bearer/session resolution without an auth abstraction beyond the planned modules, update `backend/package.json`, and run `pnpm --filter tew-backend exec node --test --experimental-strip-types src/modules/academy/auth-service.test.ts src/modules/academy/login-limiter.test.ts src/routes/academy-routes.test.ts`. <!-- sdd-owner: implementation -->
- [ ] RED — add `backend/src/modules/academy/user-service.test.ts`, `backend/src/cli/create-admin.test.ts`, and route cases for parent-only creation, one-time temporary passwords, literal search/filter/page behavior, reset/disable/delete revocation, username reuse, sole-admin conflict, system audit actor, and non-TTY rejection. <!-- sdd-owner: implementation -->
- [ ] GREEN — implement user repository/service operations, admin user routes, and the `backend/src/cli/create-admin.ts`/`tty-password.ts` TTY flow with password generation outside persistence and account/audit writes in one transaction. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — cover duplicate normalized live usernames, target admin enablement, disabled/deleted listing states, invalid UUID/query input, CLI password mismatch, and assertions that responses/audits never contain password hashes or plaintext after the one success response. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — keep account mutation, session revocation, and audit insertion transactional in `backend/src/modules/academy/user-service.ts`; add the compiled `academy:create-admin` script and explicit tests in `backend/package.json`, then run `pnpm --filter tew-backend exec node --test --experimental-strip-types src/modules/academy/user-service.test.ts src/cli/create-admin.test.ts src/routes/academy-routes.test.ts`. <!-- sdd-owner: implementation -->
- [ ] RED — add `backend/src/modules/academy/publication-service.test.ts` and route cases for category uniqueness/in-use including deleted posts, visible-by-default creation, update timestamps, no restore, parent-only visible list/detail/search/category/page, admin status inspection, and raw-HTML/unsafe-URL Markdown fixtures. <!-- sdd-owner: implementation -->
- [ ] GREEN — add the pinned shared `micromark` dependency in `backend/package.json`, `frontend/package.json`, and `pnpm-lock.yaml`, then implement category/post repository/service/query/route behavior and safe Markdown rendering in the planned backend files. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — prove parent list and stale detail requests return no hidden/deleted metadata, escaped `%`/`_` title searches remain literal, deleted posts reject further mutation, and audit rows omit Markdown payloads. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — keep category operations within the publication lifecycle modules, update `backend/package.json`’s explicit test list, and run `pnpm --filter tew-backend exec node --test --experimental-strip-types src/modules/academy/publication-service.test.ts src/routes/academy-routes.test.ts`. <!-- sdd-owner: implementation -->
- [ ] RED — add `backend/src/modules/academy/attachment-service.test.ts` and multipart route cases for MIME/signature pairs, 10-total limit including soft-deleted rows, 20 MiB limit, ignored client names, stable ordinals/sort, temp cleanup, rename compensation, and parent/admin stream access. <!-- sdd-owner: implementation -->
- [ ] GREEN — add the selected `busboy` runtime dependency (and declarations only if needed) in `backend/package.json`/`pnpm-lock.yaml`, then implement bounded multipart streaming, trusted storage-path handling, metadata/audit transactions, rename/soft-delete, and preview/download routes. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — add checks for missing/extra/truncated files, MIME-signature mismatch, database failure after rename, soft-delete file retention, hidden/deleted stale URLs, exact content headers, `nosniff`, safe fallback/title disposition names, and no client/storage identifiers in responses/audit. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — constrain filesystem work to `backend/src/modules/academy/file-storage.ts` and SQL to attachment repositories, update `backend/package.json`’s explicit test list, and run `pnpm --filter tew-backend exec node --test --experimental-strip-types src/modules/academy/attachment-service.test.ts src/routes/academy-routes.test.ts`. <!-- sdd-owner: implementation -->
- [ ] RED — add obsolete-route `404` and legacy-token-denial cases to `backend/src/routes/academy-routes.test.ts`, and adjust `backend/src/modules/storage/academy-migrations.test.ts` to prove clean initialization no longer creates/imports/queries legacy data while pre-existing legacy rows remain unchanged. <!-- sdd-owner: implementation -->
- [ ] GREEN — remove the listed legacy lead/admin route and module files, their registrations in `backend/src/app.ts`, deprecated environment parsing in `backend/src/config/env.ts`, and legacy creation/import behavior from `backend/src/modules/storage/sqlite.ts`; retain no code path that drops historic tables. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — verify a database containing legacy rows keeps them byte-for-byte while academy authentication rejects old `admin_sessions` material and health plus `/api/academy` remain the only active backend surface. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — remove only orphaned backend test-script entries from `backend/package.json`, retain academy coverage, and run `pnpm --filter tew-backend test` followed by `pnpm --filter tew-backend run build`. <!-- sdd-owner: implementation -->
- [ ] RED — add focused tests beside `frontend/src/app/core/academy/` for endpoint base resolution, sessionStorage token-only lifecycle, academy-only bearer attachment, 401 clear/redirect, and anonymous/forced-change/parent/admin guard decisions. <!-- sdd-owner: implementation -->
- [ ] GREEN — implement the smallest typed API/session/interceptor/guard layer and lazy `/academia/**` route tree in the listed core files, `frontend/src/main.ts`, `frontend/src/app/app.routes.ts`, and access/password-change/shell components. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — prove empty/relative/absolute API bases, logout, `PASSWORD_CHANGE_REQUIRED` without logout, admin landing, parent admin-route redirect, and unavailable API handling without blocking the public home. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — keep HTTP in `academy-api.service.ts`, token/current-user state in `academy-session.store.ts`, and navigation-only logic in guards; update `frontend/package.json` and run `pnpm --filter tew-frontend test && pnpm --filter tew-frontend run build`. <!-- sdd-owner: implementation -->
- [ ] RED — add `frontend/src/app/pages/academy/{academy-list-state,parent-post-list,post-detail}.test.ts` coverage for query parsing/filter page reset/pagination, newest-first parent cards, category All, no author/deleted fields, safe rendered fixtures, narrow-width semantics, and blob preview/download URL cleanup hooks. <!-- sdd-owner: implementation -->
- [ ] GREEN — implement parent list/detail components and query-parameter state, typed list/detail/blob API calls, Angular-sanitized generated Markdown binding, and authenticated attachment actions without token-bearing URLs. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — cover browser back/forward filter restoration, empty/out-of-range pages, inaccessible detail errors, `Material N` filename fallback, and object-URL revocation on download/component teardown. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — retain local component state rather than a publication cache, preserve existing responsive tokens/alerts, and run `pnpm --filter tew-frontend test && pnpm --filter tew-frontend run build`. <!-- sdd-owner: implementation -->
- [ ] RED — add `frontend/src/app/pages/academy/admin-users.test.ts` cases for name/username/UUID search, role/status filters, page reset, create/reset one-time-password panels, disabled/deleted actions, and focused `LAST_ACTIVE_ADMIN` messaging. <!-- sdd-owner: implementation -->
- [ ] GREEN — add typed user API methods and implement `admin-users.component.ts` with query-backed filters, pagination, lifecycle controls, subtle UUID display, and response-scoped temporary-password state. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — prove closing/navigating clears temporary passwords, route guards block parents, validation/conflict errors retain form state, and narrow layouts preserve keyboard-accessible actions. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — keep list/editor state component-local and reuse `academy-list-state.ts` only for shared query behavior; run `pnpm --filter tew-frontend test && pnpm --filter tew-frontend run build`. <!-- sdd-owner: implementation -->
- [ ] RED — add `frontend/src/app/pages/academy/{admin-post-list,admin-post-editor}.test.ts` coverage for visible/hidden/deleted inspection, category conflict presentation, create/edit/hide/delete controls, visual/source mode hooks using one Markdown source, safe preview fixtures, upload/rename/delete controls, and responsive shell navigation. <!-- sdd-owner: implementation -->
- [ ] GREEN — implement the two planned admin content components and typed API calls, using native textarea selection controls/local generated preview, category controls within the content workspace, and `FormData` upload without a new editor/state dependency. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — cover mode-switch source preservation, no trust-bypass use, deleted-post mutation rejection display, attachment limit/type/size failures, retained deleted-material inspection, and keyboard/narrow-width behavior. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — retain component-local editor state and the existing design tokens rather than adding component families or a rich-text editor; run `pnpm --filter tew-frontend test && pnpm --filter tew-frontend run build`. <!-- sdd-owner: implementation -->
- [ ] RED — update `frontend/src/app/pages/home/{home-template,home-form}.test.ts` and route/template tests to expect Google Forms plus anonymous/authenticated academy navigation, no lead form/API state, no `/admin` compatibility route, and GitHub Pages academy-unavailable behavior. <!-- sdd-owner: implementation -->
- [ ] GREEN — remove `frontend/src/app/pages/admin/**`, legacy `core/services/admin-*`/`leads-*`, `pages/home/home-form.ts`, and their registrations; update `HomeComponent`, routes, menus, proxy configuration, durable Docker Compose volume/configuration, `.gitignore`, and `README.md` for CLI bootstrap, `/api`, uploads/SQLite, proxy trust, static hosting, and rollback. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — verify the public Google Forms call-to-action still works without academy authentication, `/admin` and `/admin/leads` have no redirect, deprecated credential guidance is absent, uploads are ignored/persisted in deployment configuration, and non-TTY CLI smoke creates no account. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — remove only stale frontend test-script entries while retaining all academy tests, then run `pnpm --recursive test`, `pnpm --recursive run build`, and the documented clean-data-path admin → parent → forced-password-change → publication → attachment → hide/delete stale-URL smoke flow. <!-- sdd-owner: implementation -->

Deferred parent lifecycle actions remain unchanged in `tasks.md`:

- [ ] At authorized apply, create the draft/no-merge `feat/academy-client-portal` tracker PR to `main`, then maintain the listed child base order and clean-diff boundaries; merge the tracker only after all 11 child PRs are reviewed and integrated. <!-- sdd-owner: parent -->
- [ ] After an authorized apply, start or reuse bounded review for each child work unit against its linked acceptance criteria, focused command evidence, rollback boundary, dependency diagram, and 400-line changed-line budget. <!-- sdd-owner: parent -->

## Reconciliation and administrator-user discovery slice

**Status consumed:** native `applyState: ready`, `nextRecommended: apply`, `artifactStore: openspec`; `actionContext.mode: repo-local` permits this workspace. The active bounded attempt `sha256:52ac29f7fa952852409e49768c44eff1cde315ce88d7aab41214c6c9534115e2` was resumed with acquire state `proceed`.

**Reconciliation:** marked 24 stale implementation rows complete from current source/tests and their prior commits: authentication (`dd9c3c7`, `a08bd11`, `15db1ad`), user backend/CLI (`a6b95f2`, `26c4f6d`, `9db6261`), publications (`a35eecb`, `58c5666`, `f8cd1f8`), attachments (`d097bb5`, `98d089a`, `c1dd78c`), frontend session/routing (`9143aec`, `de91b82`, `9959627`), and parent feed/detail (`a592d58`, `146ea77`, `4895fe5`). Parent-owned rows were not altered.

**Completed work-unit slice:** administrator-user discovery only: protected `GET /admin/users` typing, URL-backed name/username/UUID search with role/state filters and pagination, a guarded `/academia/admin/usuarios` listing route, responsive read-only UUID/status cards, and focused tests. Create/reset temporary-password panels and lifecycle mutation controls remain deliberately unimplemented for the next slice; no password is stored by this slice.

**Files changed:** `frontend/src/app/{app.routes.ts,core/academy/{academy-api.service.ts,academy-types.ts},pages/academy/{academy-list-state.ts,admin-users.component.ts,admin-users.test.ts}}`, `frontend/package.json`, and this change's `tasks.md`/`apply-progress.md`.

### TDD Cycle Evidence

| Slice | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- |
| Admin-user discovery | `pnpm --filter tew-frontend exec node --test --experimental-strip-types src/app/pages/academy/admin-users.test.ts` failed: `academy-list-state.ts` did not export `adminUserQuery`. | Same command: 2/2 passed after URL-state/types/API list method. | Same command: 2/3 passed, 1 failed because `admin-users.component.ts` did not exist. | Same command: 3/3 passed after guarded responsive component/route; local component state and existing list-state helper retained. |

**Verification:** `pnpm --recursive test` passed (frontend 48/48; backend 50/50). `pnpm --recursive run build` passed (backend TypeScript and Angular production build). `git diff --check` is recorded below.

**Workload / PR boundary:** feature-branch-chain work unit `21-admin-users-discovery`, the first independently GREEN admin-users slice. It is intentionally bounded below 400 changed lines; follow-up is create/reset transient-password UX plus disable/enable/delete and conflict handling. No commit, push, PR, sync, or archive action was taken.

**Design deviations:** none. The backend contract names the lifecycle query key `state`; the UI labels it Estado and serializes that contract key.

**Remaining exact unchecked task rows:**

- [ ] RED — add obsolete-route `404` and legacy-token-denial cases to `backend/src/routes/academy-routes.test.ts`, and adjust `backend/src/modules/storage/academy-migrations.test.ts` to prove clean initialization no longer creates/imports/queries legacy data while pre-existing legacy rows remain unchanged. <!-- sdd-owner: implementation -->
- [ ] GREEN — remove the listed legacy lead/admin route and module files, their registrations in `backend/src/app.ts`, deprecated environment parsing in `backend/src/config/env.ts`, and legacy creation/import behavior from `backend/src/modules/storage/sqlite.ts`; retain no code path that drops historic tables. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — verify a database containing legacy rows keeps them byte-for-byte while academy authentication rejects old `admin_sessions` material and health plus `/api/academy` remain the only active backend surface. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — remove only orphaned backend test-script entries from `backend/package.json`, retain academy coverage, and run `pnpm --filter tew-backend test` followed by `pnpm --filter tew-backend run build`. <!-- sdd-owner: implementation -->
- [ ] RED — add `frontend/src/app/pages/academy/admin-users.test.ts` cases for name/username/UUID search, role/status filters, page reset, create/reset one-time-password panels, disabled/deleted actions, and focused `LAST_ACTIVE_ADMIN` messaging. <!-- sdd-owner: implementation -->
- [ ] GREEN — add typed user API methods and implement `admin-users.component.ts` with query-backed filters, pagination, lifecycle controls, subtle UUID display, and response-scoped temporary-password state. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — prove closing/navigating clears temporary passwords, route guards block parents, validation/conflict errors retain form state, and narrow layouts preserve keyboard-accessible actions. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — keep list/editor state component-local and reuse `academy-list-state.ts` only for shared query behavior; run `pnpm --filter tew-frontend test && pnpm --filter tew-frontend run build`. <!-- sdd-owner: implementation -->
- [ ] RED — add `frontend/src/app/pages/academy/{admin-post-list,admin-post-editor}.test.ts` coverage for visible/hidden/deleted inspection, category conflict presentation, create/edit/hide/delete controls, visual/source mode hooks using one Markdown source, safe preview fixtures, upload/rename/delete controls, and responsive shell navigation. <!-- sdd-owner: implementation -->
- [ ] GREEN — implement the two planned admin content components and typed API calls, using native textarea selection controls/local generated preview, category controls within the content workspace, and `FormData` upload without a new editor/state dependency. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — cover mode-switch source preservation, no trust-bypass use, deleted-post mutation rejection display, attachment limit/type/size failures, retained deleted-material inspection, and keyboard/narrow-width behavior. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — retain component-local editor state and the existing design tokens rather than adding component families or a rich-text editor; run `pnpm --filter tew-frontend test && pnpm --filter tew-frontend run build`. <!-- sdd-owner: implementation -->
- [ ] RED — update `frontend/src/app/pages/home/{home-template,home-form}.test.ts` and route/template tests to expect Google Forms plus anonymous/authenticated academy navigation, no lead form/API state, no `/admin` compatibility route, and GitHub Pages academy-unavailable behavior. <!-- sdd-owner: implementation -->
- [ ] GREEN — remove `frontend/src/app/pages/admin/**`, legacy `core/services/admin-*`/`leads-*`, `pages/home/home-form.ts`, and their registrations; update `HomeComponent`, routes, menus, proxy configuration, durable Docker Compose volume/configuration, `.gitignore`, and `README.md` for CLI bootstrap, `/api`, uploads/SQLite, proxy trust, static hosting, and rollback. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — verify the public Google Forms call-to-action still works without academy authentication, `/admin` and `/admin/leads` have no redirect, deprecated credential guidance is absent, uploads are ignored/persisted in deployment configuration, and non-TTY CLI smoke creates no account. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — remove only stale frontend test-script entries while retaining all academy tests, then run `pnpm --recursive test`, `pnpm --recursive run build`, and the documented clean-data-path admin → parent → forced-password-change → publication → attachment → hide/delete stale-URL smoke flow. <!-- sdd-owner: implementation -->
- [ ] At authorized apply, create the draft/no-merge `feat/academy-client-portal` tracker PR to `main`, then maintain the listed child base order and clean-diff boundaries; merge the tracker only after all 11 child PRs are reviewed and integrated. <!-- sdd-owner: parent -->
- [ ] After an authorized apply, start or reuse bounded review for each child work unit against its linked acceptance criteria, focused command evidence, rollback boundary, dependency diagram, and 400-line changed-line budget. <!-- sdd-owner: parent -->

## Gatekeeper retry: administrator-user diff normalization

**Status consumed:** native `applyState: ready`; repo-local edit root is authorized. Active attempt `sha256:f5e64336e03034e52aa4d70ae12ee0080e815ae37f6ff1fe076e25f4bd12d0b5` resumed with acquire state `proceed`.

**Correction:** restored `app.routes.ts`, `academy-api.service.ts`, `academy-types.ts`, and `academy-list-state.ts` to `4895fe5` formatting, retaining only the administrator-user route, typed list contract, and URL query helpers. The discovery component/test and the prior task reconciliation remain unchanged. No lifecycle or password controls were added.

| TDD cycle | Safety net / RED | GREEN / triangulation / refactor |
| --- | --- | --- |
| Normalization | Focused test initially failed 1/3 because automatic formatting broke source-contract assertions. | Restored `4895fe5` style; focused test 3/3 passed, then recursive tests (frontend 48/48, backend 50/50), builds, and `git diff --check` passed. |

**Workload / PR boundary:** `21-admin-users`, feature-branch-chain discovery slice. Full working-tree diff is within the 400-line budget; no commit, push, PR, sync, archive, or lifecycle action occurred.

**Task reconciliation:** no administrator-user task checkbox was marked: its four rows also require the explicitly deferred create/reset password and lifecycle controls. Existing checked reconciliation rows remain visibly checked; parent-owned rows are unchanged.

## 22-admin-users-lifecycle

**Status consumed:** native `applyState: ready`, `nextRecommended: apply`, `artifactStore: openspec`; `actionContext.mode: repo-local` permits this workspace. The active bounded attempt `sha256:116c99c944302e513f28b4f94108987e7bc3cc4202a81ff7e29e30435235fedc` was resumed with acquire state `proceed` using the installed v2.9.0 binary because `gentle-ai` was not on `PATH`.

**Completed / persisted:** marked all four administrator-user frontend rows (RED, GREEN, TRIANGULATE, REFACTOR) `[x]` in `tasks.md`. Added parent creation, reset, disable, enable, and soft-delete calls against the existing backend contract. The component retains create fields after errors, maps `LAST_ACTIVE_ADMIN` to a focused Spanish message, and keeps each generated password only in a dismissible response-scoped panel. The panel clears on dismissal, query navigation, and destruction.

**Files:** `frontend/src/app/core/academy/{academy-api.service.ts,academy-types.ts}`, `frontend/src/app/pages/academy/{admin-users.component.ts,admin-users.test.ts}`, plus this change's `tasks.md` and `apply-progress.md`. No design deviations or dependencies.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 22 admin user lifecycle | `frontend/src/app/pages/academy/admin-users.test.ts` | Lightweight component-contract | 3/3 focused | 3/4 failed: missing lifecycle API contract; 4/5 failed: missing panel/conflict contract; 5/6 failed: navigation cleanup | 5/5 focused passed after typed API and component controls | 6/6 focused passed for create-error retention, reset/dismiss/destroy cleanup, and navigation cleanup | No behavioral refactor needed; 51/51 frontend tests and build passed |

**Verification:** `pnpm --filter tew-frontend exec node --test --experimental-strip-types src/app/pages/academy/admin-users.test.ts` (final 6/6); `pnpm --filter tew-frontend test` (51/51); `pnpm --filter tew-frontend run build` (passed); `git diff --check` (passed).

**Workload / PR boundary:** feature-branch-chain work unit `22-admin-users-lifecycle`; 120 product/test changed lines before OpenSpec records, below 400. No commit, push, PR, sync, review, archive, deployment, or other work unit was started.

## 23-admin-content-list

**Status consumed:** native `applyState: ready`, `nextRecommended: apply`, `artifactStore: openspec`; `actionContext.mode: repo-local` permits this root with no warnings. Active attempt `sha256:d381500abf5c06bd9bdbbbbc9a7394540bf32eb4c9c5dde24de01bd5ebc20dc5` resumed with acquire state `proceed`.

**Completed slice:** guarded `/academia/admin/publicaciones` now renders an administrator list of all, visible, hidden, or deleted publications. The category workspace lists, creates, renames, and deletes categories, mapping `CATEGORY_IN_USE` to a clear Spanish conflict. The administrator users route now shares the academy shell so both administrator destinations retain navigation.

**Files:** `frontend/src/app/{app.routes.ts,core/academy/{academy-api.service.ts,academy-types.ts},pages/academy/admin-post-list.{component,test}.ts}`, `frontend/package.json`, and this apply-progress record.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 23 content discovery/categories | `frontend/src/app/pages/academy/admin-post-list.test.ts` | Lightweight source-contract | API/shell 2/2 | 0/1: component absent | 1/1 after typed list/category API and component | 1/2: guarded route absent; 2/2 after nested guarded route | Registered focused test in frontend script; 53/53 frontend tests and build passed |

**Verification:** focused `admin-post-list.test.ts` 2/2; `pnpm --filter tew-frontend test` 53/53; `pnpm --filter tew-frontend run build` passed; `git diff --check` passed (also checked both new files with `--no-index`).

**Workload / PR boundary:** feature-branch-chain work unit `23-admin-content-list`; 175 product/test additions + deletions before this 22-line OpenSpec record, 197 total, below 400. No commit, push, PR, deploy, sync, review, archive, editor, Markdown mode/preview, or attachment mutation was started.

**Task reconciliation:** no broad administrator-content checkbox is marked because each of its four exact unchecked rows also requires the intentionally deferred publication editor, Markdown mode/preview, or attachment mutations. The exact remaining rows, including deferred parent lifecycle rows, remain visibly listed unchanged below.

**Design deviations:** none.

## 24-admin-post-editor

**Status consumed:** native `applyState: ready`, `nextRecommended: apply`, `artifactStore: openspec`; `actionContext.mode: repo-local` authorizes this workspace. Resumed attempt `sha256:c303b3d32b90dec2069b2f40d17670698cba8ca17e650ba481aaad12859ad613` with acquire state `proceed`.

**Completed slice:** added guarded create/edit publication routes and list links. The editor uses one Markdown source for visual/source textareas, native `selectionStart`/`setRangeText` formatting controls, local `micromark` preview with dangerous HTML/protocols disabled, and Angular's normal `[innerHTML]` sanitizer boundary—without a rich-text or state dependency. It creates through the existing visible-by-default API, edits title/source/category, exposes show/hide and soft-delete actions, and maps post-deletion mutation conflicts to a clear display message.

**Files:** `frontend/src/app/{app.routes.ts,core/academy/{academy-api.service.ts,academy-markdown.ts,academy-types.ts},pages/academy/{admin-post-list.component.ts,admin-post-editor.{component,test}.ts}}`, `frontend/package.json`, and this progress record.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 24 admin post editor | `frontend/src/app/pages/academy/admin-post-editor.test.ts` | Lightweight source-contract + Markdown unit | `admin-post-list.test.ts` 2/2 | 0/1: editor absent | 1/1 after routes/API/editor | 2/2: safe escaped HTML/unsafe URL fixtures, single-source modes, native selection controls, visibility/delete APIs, and conflict message | Registered focused test; no behavioral refactor needed |

**Verification:** focused `admin-post-editor.test.ts` 2/2; `pnpm --filter tew-frontend test` 55/55; `pnpm --filter tew-frontend run build` passed; `git diff --check` passed (including untracked files with `--no-index`).

**Workload / PR boundary:** feature-branch-chain work unit `24-admin-post-editor`; 170 additions + deletions before this OpenSpec record, below the 400-line review budget. No commit, push, PR, deploy, sync, review, archive, formatter, or attachment mutation work was performed.

**Task reconciliation:** the four broad work-unit-10 rows remain `[ ]` because their combined contracts still include deferred attachment upload/rename/delete and related failures. No task checkbox was updated in this slice; parent-owned lifecycle rows remain byte-for-byte unchanged.

**Remaining exact work-unit-10 rows:**

- [ ] RED — add `frontend/src/app/pages/academy/{admin-post-list,admin-post-editor}.test.ts` coverage for visible/hidden/deleted inspection, category conflict presentation, create/edit/hide/delete controls, visual/source mode hooks using one Markdown source, safe preview fixtures, upload/rename/delete controls, and responsive shell navigation. <!-- sdd-owner: implementation -->
- [ ] GREEN — implement the two planned admin content components and typed API calls, using native textarea selection controls/local generated preview, category controls within the content workspace, and `FormData` upload without a new editor/state dependency. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — cover mode-switch source preservation, no trust-bypass use, deleted-post mutation rejection display, attachment limit/type/size failures, retained deleted-material inspection, and keyboard/narrow-width behavior. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — retain component-local editor state and the existing design tokens rather than adding component families or a rich-text editor; run `pnpm --filter tew-frontend test && pnpm --filter tew-frontend run build`. <!-- sdd-owner: implementation -->

**Design deviations:** none.

## 25-admin-attachments

**Status consumed:** native `applyState: ready`, `nextRecommended: apply`, `artifactStore: openspec`; repo-local action context permits this workspace. Delivery path is parent-approved `auto-chain` / `feature-branch-chain`; the managed attempt was resumed as `proceed` with token `sha256:1134feaa8db8dead5acaa6d82e616728bb3f09bb18f4b9e55f5611175694fe7a`.

**Reconciled blocker:** the earlier PATH-only blocker was incorrect. Gatekeeper supplied the managed v2.9.1 executable and confirmed the active attempt was `proceed`; all runtime commands in this retry ran only after that authorization.

**Completed / persisted:** marked all four work-unit-10 implementation rows `[x]`. The existing editor now lists active and retained deleted materials, uploads exactly one file with `FormData`, renames or soft-deletes only active materials, and maps attachment limit, size, type, and state failures to clear Spanish messages. Preview/download reuse the authenticated Blob API methods and short-lived object URLs; no token enters a URL. Native controls, labels, focus styles, wrapping actions, and the existing narrow-width button layout remain intact.

**Files:** `frontend/src/app/core/academy/{academy-api.service.ts,academy-types.ts}`, `frontend/src/app/pages/academy/admin-post-editor.{component,test}.ts`, and this change's `tasks.md`/`apply-progress.md`. No dependency or abstraction was added; no design deviation.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 25 admin attachments | `frontend/src/app/pages/academy/admin-post-editor.test.ts` | Lightweight source-contract | 2/2 focused passed | 2/3 passed: upload lifecycle API absent | 3/3 passed after typed API, `FormData`, editor controls, active/deleted lists, and Blob actions | 3/4 passed: test range initially included component methods after the retained template; corrected to isolate rendered retained controls, then 4/4 passed for retained read-only actions, Blob URL cleanup, and limit/type/size/state messaging | No behavioral refactor needed; retained existing component-local state and tokens |

**Verification:** focused editor test 4/4; `pnpm --filter tew-frontend test` 57/57; `pnpm --filter tew-frontend run build` passed; `git diff --check` passed before OpenSpec reconciliation.

**Workload / PR boundary:** feature-branch-chain work unit `25-admin-attachments`; candidate diff before task reconciliation was 120 additions + deletions, below the 400-line budget. No commit, push, PR, deploy, sync, review, archive, or formatter action was taken.

**Remaining exact unchecked rows:**

- [ ] RED — add obsolete-route `404` and legacy-token-denial cases to `backend/src/routes/academy-routes.test.ts`, and adjust `backend/src/modules/storage/academy-migrations.test.ts` to prove clean initialization no longer creates/imports/queries legacy data while pre-existing legacy rows remain unchanged. <!-- sdd-owner: implementation -->
- [ ] GREEN — remove the listed legacy lead/admin route and module files, their registrations in `backend/src/app.ts`, deprecated environment parsing in `backend/src/config/env.ts`, and legacy creation/import behavior from `backend/src/modules/storage/sqlite.ts`; retain no code path that drops historic tables. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — verify a database containing legacy rows keeps them byte-for-byte while academy authentication rejects old `admin_sessions` material and health plus `/api/academy` remain the only active backend surface. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — remove only orphaned backend test-script entries from `backend/package.json`, retain academy coverage, and run `pnpm --filter tew-backend test` followed by `pnpm --filter tew-backend run build`. <!-- sdd-owner: implementation -->
- [ ] RED — add `frontend/src/app/pages/academy/{admin-post-list,admin-post-editor}.test.ts` coverage for visible/hidden/deleted inspection, category conflict presentation, create/edit/hide/delete controls, visual/source mode hooks using one Markdown source, safe preview fixtures, upload/rename/delete controls, and responsive shell navigation. <!-- sdd-owner: implementation -->
- [ ] GREEN — implement the two planned admin content components and typed API calls, using native textarea selection controls/local generated preview, category controls within the content workspace, and `FormData` upload without a new editor/state dependency. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — cover mode-switch source preservation, no trust-bypass use, deleted-post mutation rejection display, attachment limit/type/size failures, retained deleted-material inspection, and keyboard/narrow-width behavior. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — retain component-local editor state and the existing design tokens rather than adding component families or a rich-text editor; run `pnpm --filter tew-frontend test && pnpm --filter tew-frontend run build`. <!-- sdd-owner: implementation -->
- [ ] RED — update `frontend/src/app/pages/home/{home-template,home-form}.test.ts` and route/template tests to expect Google Forms plus anonymous/authenticated academy navigation, no lead form/API state, no `/admin` compatibility route, and GitHub Pages academy-unavailable behavior. <!-- sdd-owner: implementation -->
- [ ] GREEN — remove `frontend/src/app/pages/admin/**`, legacy `core/services/admin-*`/`leads-*`, `pages/home/home-form.ts`, and their registrations; update `HomeComponent`, routes, menus, proxy configuration, durable Docker Compose volume/configuration, `.gitignore`, and `README.md` for CLI bootstrap, `/api`, uploads/SQLite, proxy trust, static hosting, and rollback. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — verify the public Google Forms call-to-action still works without academy authentication, `/admin` and `/admin/leads` have no redirect, deprecated credential guidance is absent, uploads are ignored/persisted in deployment configuration, and non-TTY CLI smoke creates no account. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — remove only stale frontend test-script entries while retaining all academy tests, then run `pnpm --recursive test`, `pnpm --recursive run build`, and the documented clean-data-path admin → parent → forced-password-change → publication → attachment → hide/delete stale-URL smoke flow. <!-- sdd-owner: implementation -->
- [ ] At authorized apply, create the draft/no-merge `feat/academy-client-portal` tracker PR to `main`, then maintain the listed child base order and clean-diff boundaries; merge the tracker only after all 11 child PRs are reviewed and integrated. <!-- sdd-owner: parent -->
- [ ] After an authorized apply, start or reuse bounded review for each child work unit against its linked acceptance criteria, focused command evidence, rollback boundary, dependency diagram, and 400-line changed-line budget. <!-- sdd-owner: parent -->
