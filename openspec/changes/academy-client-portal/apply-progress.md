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

## 26-retire-backend-runtime

**Status consumed:** native `applyState: ready`, `nextRecommended: apply`, `artifactStore: openspec`; `actionContext.mode: repo-local` permits this workspace. Managed attempt `sha256:46887ab75c84aaf629924ba6d5d1be0cf7b3e2c5cc6c53568001dec2858a1e8c` was resumed as `proceed`.

**Completed slice:** unregistered legacy lead/shared-admin routers, removed deprecated legacy initialization/import parsing from active storage, server, and CLI setup, while retaining the historical route/module/test files and all historic tables. Health and academy login remain active. No task checkbox changed: the four work-unit-6 rows intentionally remain unchecked until the next branch removes orphan files and stale test scripts.

**Files:** `backend/src/{app.ts,server.ts,cli/create-admin.ts,modules/storage/{sqlite.ts,academy-migrations.test.ts},routes/academy-routes.test.ts}` and this progress record. No historical table or row was mutated.

### TDD Cycle Evidence

| Task | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- |
| Backend legacy runtime retirement | Focused suite: 21/23; clean initialization still created legacy tables and `POST /api/leads` returned 400. | 23/23 after unregistering routes and making legacy initialization/import inert. | The focused test snapshots legacy schemas/rows, rejects an old session token, and confirms health plus academy login. | No behavioral refactor needed; retained orphan files and stale test entries for the next slice. |

**Verification:** focused command passed 23/23; `pnpm --filter tew-backend run build` passed; `pnpm --filter tew-backend test` and `pnpm --recursive test` both fail only in 21 retained backend legacy tests/scripts while frontend remains 57/57; `git diff --check` passed before this record.

**Workload / PR boundary:** feature-branch-chain work unit `26-retire-backend-runtime`; product/test diff is 287 additions + deletions before this record, and the complete diff remains within 400. No commit, push, PR, deploy, sync, review, archive, or formatter was run.

**Remaining exact work-unit-6 rows (intentionally unchecked):**

- [ ] RED — add obsolete-route `404` and legacy-token-denial cases to `backend/src/routes/academy-routes.test.ts`, and adjust `backend/src/modules/storage/academy-migrations.test.ts` to prove clean initialization no longer creates/imports/queries legacy data while pre-existing legacy rows remain unchanged. <!-- sdd-owner: implementation -->
- [ ] GREEN — remove the listed legacy lead/admin route and module files, their registrations in `backend/src/app.ts`, deprecated environment parsing in `backend/src/config/env.ts`, and legacy creation/import behavior from `backend/src/modules/storage/sqlite.ts`; retain no code path that drops historic tables. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — verify a database containing legacy rows keeps them byte-for-byte while academy authentication rejects old `admin_sessions` material and health plus `/api/academy` remain the only active backend surface. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — remove only orphaned backend test-script entries from `backend/package.json`, retain academy coverage, and run `pnpm --filter tew-backend test` followed by `pnpm --filter tew-backend run build`. <!-- sdd-owner: implementation -->

## 28-remove-legacy-auth normalization correction

**Status / attempt:** authoritative `applyState: ready`; resumed supplied token `sha256:20b40c49a0b8edbb7a27e1481e4208b613eb86de15e10fc333e4c24d6fef2b9c` as `proceed` for `28-remove-legacy-auth-normalization`.

**Correction:** restored `backend/src/routes/admin.test.ts` byte-for-byte from `27e5a7c`, then deleted only the `storeAdminSession` import and its expired-token test. The four intended legacy-auth files remain deleted; `tasks.md` was not changed.

### TDD Cycle Evidence

| Slice | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- |
| Diff normalization | Academy route test 14/14 | Gatekeeper caught the prior 506-line formatting regression | Exact restore-and-delete check passed | Structural deletion; byte comparison against `27e5a7c` proves no other file byte changed | None; no formatter |

**Verification:** academy routes 14/14; backend suite 28/28; backend build; `git diff --check`; deleted-module import scan; exact `admin.test.ts` byte comparison; allowed-only scope/count: 201/400 against `27e5a7c`. No commit, push, PR, review, sync, archive, deployment, package, task, lead/storage/frontend, or additional test change.

**Settlement:** attempted `passed` with evidence `sha256:61dbe9706bf9773e5fc5c6c7055105eb4e4a19ebb23a6a5dd7a2e22db7bf6df7`; native state returned `blocked` for maintainer decision because cumulative attempt accounting is 482/400, despite the verified current candidate being 215/400. No reset, rescope, or new acquire was performed.

## 28-remove-legacy-auth

**Status consumed:** authoritative OpenSpec `applyState: ready`, `nextRecommended: apply`; repo-local action context authorized this workspace with no warning. Parent supplied the exact active attempt token `sha256:59e5d394bab1833e20a2169043d2cb11f9f7b5cb3470d8f9f9b494701b8710ed`.

**Completed slice:** deleted the four inactive shared-admin auth/session module and test files. In `backend/src/routes/admin.test.ts`, removed only the `storeAdminSession` import and its expired-token test; all other legacy-route tests remain byte-for-byte unchanged. No task checkbox changed: all four broad work-unit-6 rows remain unchecked by scope.

### TDD Cycle Evidence

| Slice | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- |
| 28 legacy auth deletion | `academy-routes.test.ts` 14/14 before deletion | Established prior deletion RED: stale callers prevented legacy-auth removal; this slice deletes precisely those orphan callers, with no replacement behavior test by explicit scope | academy routes 14/14; backend suite 28/28; build passed | independent import scan found no caller of any deleted module | None; deletion-only |

**Verification:** `pnpm --filter tew-backend exec node --test --experimental-strip-types src/routes/academy-routes.test.ts` 14/14; `pnpm --filter tew-backend test` 28/28; `pnpm --filter tew-backend run build`; `git diff --check`; deleted-module import scan — all passed.

**Workload / PR boundary:** feature-branch-chain work unit `28-remove-legacy-auth`, against `27e5a7c`; scope is only the four deleted files, the one `admin.test.ts` import/test removal, and this record. No design deviation, package-script change, task change, commit, push, PR, review, sync, archive, or deployment. The four exact unchecked work-unit-6 rows above remain deferred.

## 27-remove-legacy-routes-only — final settlement

**Status consumed:** authoritative repo-local `applyState: ready`; allowed root was this workspace. Exact active token `sha256:4ccc840c77f6988b52f4cc3fb1e0f21102208b0ef3c194b854afda1bf72d3404` was reacquired as `proceed` and settled as `complete`. No action-context warning.

**Scope confirmation:** product source diff remains exactly the deletions of `backend/src/routes/{leads,admin-auth,admin-leads}.ts`; shared-auth `admin-auth.ts`, `admin-auth.test.ts`, and `admin-session-repository.ts` are byte-for-byte equal to `acf9398`. No lead-domain module/test, `admin-session-repository.test.ts`, `routes/admin.test.ts`, or task checkbox changed.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 27 route-only finalization | Existing backend suite/build | Integration/typecheck | Fresh backend suite 28/28 | Established in prior route-only correction; no new product code | Fresh suite/build passed | Fresh exact-base and two route-import checks passed | None; deletion-only finalization |

**Fresh verification:** `pnpm --filter tew-backend test` 28/28; `pnpm --filter tew-backend run build`; `git diff --check`; shared-auth exact-base check; absolute and route-local import scans for the three deleted modules — all passed. Evidence SHA-256: `sha256:16854a8485584c32090f0fac8658512adeb7ce237d54996c26a07c20f8ec5da8` (`/tmp/27-remove-legacy-routes-only-verification-final.log`). Candidate accounting against `acf9398`: 225 additions + deletions, within the 400-line budget.

**Native settlement:** request `routes-finalize-settlement-20260912`; outcome `passed`; token `sha256:4ccc840c77f6988b52f4cc3fb1e0f21102208b0ef3c194b854afda1bf72d3404`; remediation binding `sha256:4057b3ab73023a3b099e29aad94b7ef7a1a6ee66155ea04d9f046764ad42cdf7`; harness `reused`; returned state `complete`.

**Workload / PR boundary:** finalization only for feature-branch-chain work unit `27-remove-legacy-routes-only`; no commit, push, PR, review, sync, archive, formatting, reset, or follow-on work. Remaining broader work-unit-6 checkbox rows above remain unchecked and deferred.

## 26b-disable-legacy-tests

**Status consumed:** `applyState: ready`; repo-local action context; parent-selected `auto-chain` / `feature-branch-chain`. The bounded retry acquired `proceed` with token `sha256:668fa65e2e473c0c634298f53939c5cf8f0a7b4f57065a3805816fdf8e61afd9`.

**Completed slice:** removed only obsolete legacy test-script entries from `backend/package.json`. `sqlite.test.ts` remains in the tree but is no longer invoked because all four of its retained assertions require the deactivated legacy initializer/importer; current app, academy-migration storage, publication, and academy-route coverage remain explicit.

| TDD cycle | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- |
| 26b legacy scripts | Retained prior 21 legacy failures; first script-only pass isolated the final 4 to `sqlite.test.ts`. | Backend suite: 28/28 after removing that obsolete entry. | N/A: no behavior changed. | No refactor; no source/test file was deleted. |

**Verification:** `pnpm --filter tew-backend test` 28/28; `pnpm --filter tew-backend run build` passed; `git diff --check` passed. Branch diff against `47a789d`: 328 changed lines; objective diff against `8f84e7e948b125b45b6be08d88b5785409051bc5`: 16 changed lines.

**Task reconciliation:** no checkbox changed. All four broad work-unit-6 rows remain unchecked by explicit scope; the prior full-suite-failure wording is superseded for this candidate. No commit, push, PR, formatting, deployment, sync, review, archive, or source/test-file deletion occurred.

## 27-remove-legacy-routes — blocked

**Status consumed:** native `applyState: ready`, repo-local action context, parent-approved `auto-chain` / `feature-branch-chain`; resumed managed attempt `sha256:9d8d70072fa728cdd553efef22a036810ca1001f5cca13b4cd21527c2ee81a1b` as `proceed`.

**Attempted deletion:** removed only the six requested orphan route/shared-admin files: `backend/src/routes/{leads,admin-auth,admin-leads}.ts` and `backend/src/modules/auth/{admin-auth,admin-auth.test,admin-session-repository}.ts`. No Academy, lead-domain, database, or route-integration file was changed.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 27 deletion safety | Existing backend suite | Integration | Baseline `pnpm --filter tew-backend test`: 28/28 | Deletion-safety baseline replaces new behavior tests by explicit scope | Backend suite remains 28/28 | Build exposed two retained callers outside the deletion set | None; blocked before a scope-expanding change |

**Blocker:** `pnpm --filter tew-backend run build` fails because retained `backend/src/modules/auth/admin-session-repository.test.ts` and protected `backend/src/routes/admin.test.ts` import the deleted session repository. Deleting or changing either conflicts with the explicit deletion-only scope and instruction to leave route integration tests for a later slice. The textual post-delete import scan confirms exactly those two inactive-but-TypeScript-included callers; no active runtime caller exists.

**Verification:** backend test 28/28 passed after deletion; backend build failed with `TS2307` for those two retained test callers; pre/post `git diff --check` passed. Current deletion diff is 295 lines before this progress record and within the 400-line budget.

**Task reconciliation:** no broad work-unit-6 row was marked complete. All four remain unchecked; parent-owned rows are unchanged. A maintainer must authorize a bounded follow-up that removes or updates the two stale tests, or explicitly allow a TypeScript build exclusion, before this deletion can be completed.

## 27-remove-legacy-routes-only

**Status consumed:** native `applyState: ready`, `nextRecommended: apply`, `artifactStore: openspec`; `actionContext.mode: repo-local` authorizes this workspace. The maintainer-authorized narrower rescope was acquired as `proceed`.

**Completed slice:** restored exactly from clean base `acf9398` the three shared-auth files mistakenly deleted by the earlier six-file attempt: `backend/src/modules/auth/{admin-auth.ts,admin-auth.test.ts,admin-session-repository.ts}`. Only `backend/src/routes/{leads.ts,admin-auth.ts,admin-leads.ts}` remain deleted. No lead module/test, `admin-session-repository.test.ts`, or `routes/admin.test.ts` was changed.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 27 route-only deletion correction | Existing backend suite/build | Integration/typecheck | Backend suite 28/28 | Build failed with the two expected `TS2307` deferred-test imports while shared-auth files were absent | Restored the three files byte-for-byte from `acf9398`; backend suite 28/28 and build passed | Exact-base `git diff --quiet acf9398` confirmed all three restored files | Structural restoration only; no refactor |

**Verification:** `pnpm --filter tew-backend test` 28/28; `pnpm --filter tew-backend run build` passed; `git diff --check` passed. A route-specific import scan of `backend/src` found no imports of `routes/{leads,admin-auth,admin-leads}.ts`.

**Workload / PR boundary:** feature-branch-chain work unit `27-remove-legacy-routes-only`; working-tree changed-line count is recorded after this reconciliation and remains under 400. No commit, push, PR, formatting, deployment, sync, review, archive, lead-module/test change, or protected-test change was performed.

**Task reconciliation:** no broad work-unit-6 checkbox changed. The assigned narrow route-only deletion does not complete its RED/GREEN/TRIANGULATE/REFACTOR rows, which include deferred test and legacy-module work.

**Remaining exact work-unit-6 rows:**

- [ ] RED — add obsolete-route `404` and legacy-token-denial cases to `backend/src/routes/academy-routes.test.ts`, and adjust `backend/src/modules/storage/academy-migrations.test.ts` to prove clean initialization no longer creates/imports/queries legacy data while pre-existing legacy rows remain unchanged. <!-- sdd-owner: implementation -->
- [ ] GREEN — remove the listed legacy lead/admin route and module files, their registrations in `backend/src/app.ts`, deprecated environment parsing in `backend/src/config/env.ts`, and legacy creation/import behavior from `backend/src/modules/storage/sqlite.ts`; retain no code path that drops historic tables. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — verify a database containing legacy rows keeps them byte-for-byte while academy authentication rejects old `admin_sessions` material and health plus `/api/academy` remain the only active backend surface. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — remove only orphaned backend test-script entries from `backend/package.json`, retain academy coverage, and run `pnpm --filter tew-backend test` followed by `pnpm --filter tew-backend run build`. <!-- sdd-owner: implementation -->

## 29-remove-legacy-lead-repository

**Status / attempt:** native `applyState: ready`; parent-supplied `proceed` token `sha256:e081d74644eb43bbe6b3635583ac87d5eef8bac6e2f1d1de69351511148e18d4` was settled `complete`.

**Completed:** deleted inactive `backend/src/modules/leads/{lead-repository.ts,lead-repository.test.ts}` only. `tasks.md` is unchanged; the broad work-unit-6 rows remain unchecked.

| TDD cycle | Evidence |
| --- | --- |
| Safety net / RED | Academy routes 14/14 passed before deletion; caller scan found zero production callers and the deleted test's single direct import. |
| GREEN | Academy routes 14/14, backend suite 28/28, and backend build passed after deletion. |
| TRIANGULATE / REFACTOR | Skipped: structural deletion with no replacement behavior authorized. |

**Verification:** `git diff --check`, deleted-module caller scan, unchanged-task check, exact-scope check, and candidate count passed; candidate is 378 changed lines against `e26bc8d`.

**Boundary:** `29-remove-legacy-lead-repository` only; no other source, test, task, script, formatter, lifecycle, or delivery action.

## 30-remove-legacy-lead-remnants

**Status / attempt:** native `applyState: ready`, `nextRecommended: apply`; repo-local action context permits this workspace with no warning. Continued parent-supplied `proceed` token `sha256:c60a93fd9207c2456155c5c0211ad1fa271f866e155e7f2a215886efb5cbc426`.

**Completed:** deleted only `backend/src/modules/leads/{lead-schema.ts,lead-types.ts}` and `backend/src/routes/{leads.test.ts,leads.test-note.ts}` (290 deleted lines). `tasks.md` is unchanged because the work-unit-6 rows remain broader than this cleanup.

| TDD cycle | Evidence |
| --- | --- |
| Safety net | Academy routes 14/14 before deletion. |
| RED | Structural deletion only: caller scan identified the final orphaned module/test remnants; no replacement behavior test by explicit scope. |
| GREEN | Academy routes 14/14; workspace suite frontend 57/57 and backend 28/28; backend build passed. |
| TRIANGULATE / REFACTOR | Skipped: deletion-only cleanup with no behavior change or replacement authorized. |

**Verification:** `git diff --check`; deleted-module/retired-route-source scan; retired `routes/leads.ts` absence; unchanged-task check; exact pre-progress backend scope; all passed. Candidate is 290/400 additions + deletions against `216ac7f` before this evidence record.

**Boundary:** `30-remove-legacy-lead-remnants` only; no other source/test path, package script, protected path, formatter, commit, push, PR, review, sync, archive, reset/rescope, or deployment. Native settlement `passed` returned `complete` (request `30-remove-legacy-lead-remnants-settlement-1789467428`; evidence `sha256:4ba8a4528cd2ec045f02a11d1c4b8f3653cadb8e82176e0f79e6b6d5cfa25535`).

**Remaining implementation rows (unchanged):**

- [ ] RED — add obsolete-route `404` and legacy-token-denial cases to `backend/src/routes/academy-routes.test.ts`, and adjust `backend/src/modules/storage/academy-migrations.test.ts` to prove clean initialization no longer creates/imports/queries legacy data while pre-existing legacy rows remain unchanged. <!-- sdd-owner: implementation -->
- [ ] GREEN — remove the listed legacy lead/admin route and module files, their registrations in `backend/src/app.ts`, deprecated environment parsing in `backend/src/config/env.ts`, and legacy creation/import behavior from `backend/src/modules/storage/sqlite.ts`; retain no code path that drops historic tables. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — verify a database containing legacy rows keeps them byte-for-byte while academy authentication rejects old `admin_sessions` material and health plus `/api/academy` remain the only active backend surface. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — remove only orphaned backend test-script entries from `backend/package.json`, retain academy coverage, and run `pnpm --filter tew-backend test` followed by `pnpm --filter tew-backend run build`. <!-- sdd-owner: implementation -->

## 31-remove-legacy-storage-helpers

**Status / attempt:** authoritative native `applyState: ready`; repo-local action context authorized this workspace with no warnings. Continued the supplied `proceed` token `sha256:55f7c71ebd73a20e064e9e641a34eb0b8ff4cc72ab771dca67a5e66f04b263ee` only.

**Completed:** deleted the four failing retired-storage tests; removed only `initializeDatabase` and `importLegacyLeadsIfNeeded` from `sqlite.ts`; removed only their migration-test import and two calls. No schema, migration, table, row, runtime-route, package, frontend, generated-dist, or formatter change.

**Files:** `backend/src/modules/storage/{sqlite.ts,sqlite.test.ts,academy-migrations.test.ts}` and this progress record. `tasks.md` remains byte-for-byte unchanged because no broad work-unit-6 checkbox is completed by this bounded cleanup.

### TDD Cycle Evidence

| Slice | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- |
| 31 storage-helper deletion | Focused academy migrations/routes: 22/22 | `sqlite.test.ts`: 0/4; all cases asserted retired initializer/import behavior | Focused academy migrations/routes: 22/22; backend 28/28; workspace frontend 57/57 + backend 28/28; backend build passed | Skipped: structural deletion with no replacement behavior | No behavioral refactor; final focused suite remained 22/22 |

**Verification:** `pnpm --filter tew-backend exec node --test --experimental-strip-types src/modules/storage/academy-migrations.test.ts src/routes/academy-routes.test.ts`; `pnpm --filter tew-backend test`; `pnpm --recursive test`; `pnpm --filter tew-backend run build`; `git diff --check` all passed. Exact `backend/src` caller scan is empty; exact transformation and unchanged-task checks passed. Pre-progress product diff: 160/400 against `806d5dc`.

**Boundary / remaining:** only `31-remove-legacy-storage-helpers`; no commit, push, PR, review, sync, archive, reset/rescope, deployment, or task update. The four work-unit-6 implementation rows remain unchecked, including:

- [ ] RED — add obsolete-route `404` and legacy-token-denial cases to `backend/src/routes/academy-routes.test.ts`, and adjust `backend/src/modules/storage/academy-migrations.test.ts` to prove clean initialization no longer creates/imports/queries legacy data while pre-existing legacy rows remain unchanged. <!-- sdd-owner: implementation -->
- [ ] GREEN — remove the listed legacy lead/admin route and module files, their registrations in `backend/src/app.ts`, deprecated environment parsing in `backend/src/config/env.ts`, and legacy creation/import behavior from `backend/src/modules/storage/sqlite.ts`; retain no code path that drops historic tables. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — verify a database containing legacy rows keeps them byte-for-byte while academy authentication rejects old `admin_sessions` material and health plus `/api/academy` remain the only active backend surface. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — remove only orphaned backend test-script entries from `backend/package.json`, retain academy coverage, and run `pnpm --filter tew-backend test` followed by `pnpm --filter tew-backend run build`. <!-- sdd-owner: implementation -->

## 32-remove-legacy-admin-tests-a

**Status / attempt:** native apply-ready; continued only token `sha256:beed8ca440be1691e22e4a9cfb3a24f76605c8d5731648cd56f55f79f38a9f25`.

**Completed:** removed the first five complete stale test blocks from `backend/src/routes/admin.test.ts` (base lines 11–364, 354 deletions). Base lines 1–10 and 365–466 remain byte-identical; imports stay because the remaining tests use them. Tasks remain unchanged.

**TDD evidence:** existing Academy migration/route safety stayed 22/22; backend suite stayed 28/28; backend build and `git diff --check` passed. Prefix/suffix hashes prove no formatting churn.

**Boundary:** deletion-only slice A; candidate is 364/400 lines including this record. The remaining 112-line file and all four work-unit-6 checkbox reconciliations are deferred to slice B. No formatter, commit, push, PR, review, sync, archive, reset/rescope, or deployment.

## 33-finish-backend-retirement

**Status / attempt:** consumed authoritative native `applyState: ready`, `nextRecommended: apply`, OpenSpec repo-local action context for this workspace with no warning. Parent supplied native acquire `proceed` token `sha256:3ac703a95fb084494430600c051b680b1b217326317cbf66787d765600b1cedf`; this slice continues and settles only that attempt.

**Completed / persisted:** deleted the final 112-line stale legacy test file `backend/src/routes/admin.test.ts`. After complete retirement verification, marked exactly the four work-unit-6 implementation rows RED/GREEN/TRIANGULATE/REFACTOR `[x]`; parent-owned rows were unchanged.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Backend retirement completion | `backend/src/routes/admin.test.ts` | Integration | academy migrations/routes 22/22 | stale test 0/3: obsolete endpoints return 404, not its obsolete 401/500 assertions | deleting the obsolete test leaves backend 28/28 | active academy route/migration coverage proves obsolete routes 404, old session denial, and historic table/schema/row preservation | none; deletion-only |

**Verification:** focused academy migrations/routes 22/22; backend 28/28; `pnpm --recursive test` frontend 57/57 + backend 28/28; `pnpm --recursive run build`; `git diff --check` all passed. Exact scans confirm retired paths and active legacy source/import references are absent. Active preservation coverage remains in `academy-migrations.test.ts` (clean-table absence plus existing schema/row equality) and `academy-routes.test.ts` (old token denied; legacy routes 404).

**Workload / PR boundary:** feature-branch-chain slice `33-finish-backend-retirement`, against `b9d3847`; only the deleted final stale backend test, four implementation checkbox substitutions, and this evidence record. No active product/test changes, migration, package, frontend, lifecycle, formatter, commit, push, PR, review, sync, archive, reset/rescope, or deployment.

**Remaining implementation rows:**

- [ ] RED — update `frontend/src/app/pages/home/{home-template,home-form}.test.ts` and route/template tests to expect Google Forms plus anonymous/authenticated academy navigation, no lead form/API state, no `/admin` compatibility route, and GitHub Pages academy-unavailable behavior. <!-- sdd-owner: implementation -->
- [ ] GREEN — remove `frontend/src/app/pages/admin/**`, legacy `core/services/admin-*`/`leads-*`, `pages/home/home-form.ts`, and their registrations; update `HomeComponent`, routes, menus, proxy configuration, durable Docker Compose volume/configuration, `.gitignore`, and `README.md` for CLI bootstrap, `/api`, uploads/SQLite, proxy trust, static hosting, and rollback. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — verify the public Google Forms call-to-action still works without academy authentication, `/admin` and `/admin/leads` have no redirect, deprecated credential guidance is absent, uploads are ignored/persisted in deployment configuration, and non-TTY CLI smoke creates no account. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — remove only stale frontend test-script entries while retaining all academy tests, then run `pnpm --recursive test`, `pnpm --recursive run build`, and the documented clean-data-path admin → parent → forced-password-change → publication → attachment → hide/delete stale-URL smoke flow. <!-- sdd-owner: implementation -->

**Deferred parent lifecycle actions:** tracker/child-base management and bounded review remain unchanged in `tasks.md`.

## 34-public-academy-navigation

**Status / attempt:** authoritative `applyState: ready`, `nextRecommended: apply`, OpenSpec repo-local action context; continued only supplied `proceed` token `sha256:e16106f28ea05e8a2f0d3281b5faf0f398eef68b94f21bdd9ff029d68e0e5548`.

**Completed slice:** public home now shows native-router **Acceso academia** navigation to anonymous visitors. With a token, it restores the session without awaiting public rendering; authenticated users get a native details menu with their role-appropriate `academyDestination` and immediate local logout. Empty or unavailable Academy configuration clears local Academy state while keeping the access link available. Existing Google Forms/lead behavior remains untouched by this slice.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Public Academy navigation | `frontend/src/app/pages/home/home-template.test.ts` | Template/source contract | 4/4 | 4/7: access, restore, and authenticated-menu contracts absent | 7/7 after standalone `RouterLink`, store restore, and native menu | 7/8: primary nav label absent; 8/8 after adding the labelled native nav/focus contract | Reused `academyDestination`, `AcademySessionStore`, and existing tokens; no abstraction added |

**Verification:** focused home/access/session command 12/12; frontend suite 61/61; `pnpm --recursive test` frontend 61/61 + backend 28/28; frontend build; `git diff --check` all passed. Candidate scope before this record: only `frontend/src/app/pages/home/{home.component.ts,home.component.html,home-template.test.ts}`, 116 additions + deletions against `d2e59ee`.

**Task reconciliation:** no work-unit-11 checkbox changed. Its four implementation rows remain incomplete beyond this bounded navigation slice; parent-owned rows are unchanged.

**Workload / PR boundary:** feature-branch-chain slice `34-public-academy-navigation`, below the 400-line budget. No route, API, dependency, Google Forms, lead-form, task, formatter, commit, push, PR, review, sync, archive, reset/rescope, or deployment work was performed.
