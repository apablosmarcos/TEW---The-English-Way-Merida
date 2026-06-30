# Task 5 Report - Single-admin backoffice

## Scope delivered

- Added a minimal single-admin auth flow backed by `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables.
- Added protected admin backend endpoints for login, lead listing, and lead updates.
- Extended the lead repository so persisted leads can be updated by `id`.
- Added a minimal Angular admin UI with:
  - `/admin` login page
  - `/admin/leads` lead list + embedded detail editor
- Kept scope to one admin user, no password recovery, no analytics, and no complex dashboard behavior.

## TDD notes

### Red

1. Added backend failing tests first:
   - `backend/src/modules/leads/lead-repository.test.ts` for `updateLead()`
   - `backend/src/routes/admin.test.ts` for admin login and protected lead management
2. Added lightweight frontend failing tests first:
   - `frontend/src/app/core/services/admin-endpoint.test.ts`
   - `frontend/src/app/core/services/admin-session.test.ts`
3. Ran the targeted suites before implementation.

Backend red result:

```text
SyntaxError: './lead-repository.ts' does not provide an export named 'updateLead'
POST /api/admin/login -> 404
```

Frontend red result:

```text
ERR_MODULE_NOT_FOUND: Cannot find module '.../admin-endpoint.ts'
ERR_MODULE_NOT_FOUND: Cannot find module '.../admin-session.ts'
```

### Green

- Implemented `backend/src/modules/auth/admin-auth.ts` with minimal stateless token validation.
- Implemented `POST /api/admin/login` in `backend/src/routes/admin-auth.ts`.
- Implemented protected `GET /api/admin/leads` and `PATCH /api/admin/leads/:id` in `backend/src/routes/admin-leads.ts`.
- Extended `lead-repository.ts` with `updateLead()` and update payload typing.
- Added Angular admin service/helpers:
  - `admin-api.service.ts`
  - `admin-endpoint.ts`
  - `admin-session.ts`
- Added Angular admin pages:
  - `frontend/src/app/pages/admin/login.component.ts`
  - `frontend/src/app/pages/admin/leads.component.ts`
- Added admin routes in `frontend/src/app/app.routes.ts`.

## Files added or changed

- `backend/package.json`
- `backend/src/app.ts`
- `backend/src/modules/auth/admin-auth.ts`
- `backend/src/modules/leads/lead-repository.ts`
- `backend/src/modules/leads/lead-repository.test.ts`
- `backend/src/modules/leads/lead-types.ts`
- `backend/src/routes/admin-auth.ts`
- `backend/src/routes/admin-leads.ts`
- `backend/src/routes/admin.test.ts`
- `frontend/package.json`
- `frontend/src/app/app.routes.ts`
- `frontend/src/app/core/services/admin-api.service.ts`
- `frontend/src/app/core/services/admin-endpoint.ts`
- `frontend/src/app/core/services/admin-endpoint.test.ts`
- `frontend/src/app/core/services/admin-session.ts`
- `frontend/src/app/core/services/admin-session.test.ts`
- `frontend/src/app/pages/admin/login.component.ts`
- `frontend/src/app/pages/admin/leads.component.ts`

## Verification run

### Brief verification: expected initial fail

Ran before implementation:

```bash
pnpm build
```

Actual result in this worktree: it already passed.

This means the brief expectation is stale here: the existing workspace compiled successfully before Task 5 because the admin surface was not referenced yet.

### Backend targeted tests

Ran after implementation:

```bash
pnpm --filter tew-backend test
```

Result:

```text
✔ createLead stores a new lead with empty notes
✔ updateLead persists status and notes for an existing lead
✔ POST /api/admin/login returns 401 for invalid credentials
✔ authenticated admin can list and update leads
✔ POST /api/leads returns 201 and leadId for a valid payload
✔ POST /api/leads returns 500 when lead storage fails
```

### Frontend lightweight tests

Ran after implementation:

```bash
pnpm --filter tew-frontend test
```

Result:

```text
✔ admin endpoints support relative apiBaseUrl values like /api
✔ admin endpoints keep absolute apiBaseUrl support
✔ admin session token can be stored and read back
✔ admin session token can be cleared
✔ site config keeps demo mode only for a valid config with empty apiBaseUrl
✔ site config load errors stay distinct from demo mode
✔ lead form is invalid without required fields
✔ lead form calls API when apiBaseUrl exists
✔ lead form shows demo-mode message when apiBaseUrl is empty
✔ lead endpoint supports relative apiBaseUrl values like /api
✔ lead endpoint keeps absolute apiBaseUrl support
```

### Workspace build verification

Ran after implementation:

```bash
pnpm build
```

Result:

```text
backend: tsc passed
frontend: Angular build completed successfully
```

## Self-review

- Confirmed admin auth is limited to one configured environment-backed user.
- Confirmed protected admin endpoints require a bearer token derived from the configured credentials.
- Confirmed persisted leads can be updated by `id` without changing the public lead creation flow.
- Confirmed the Angular admin UI stays within MVP scope: login, list, embedded edit.
- Confirmed `SiteConfigState` uses `status` rather than `mode`; the Angular build caught and verified that fix.
- Confirmed mobile-safe layout fallback exists for the admin leads page.

## Notes / concerns

- The task brief's expected initial `pnpm build` failure did not reproduce in this worktree; I recorded the actual behavior instead of forcing an artificial failure.
- Frontend automated coverage stays lightweight: admin helper logic is covered directly and the admin pages are build-verified, but there is no full Angular component/integration test harness for the new admin screens.
- The workspace still warns about the configured Node engine because this environment is running Node `v26.4.0` while the repo asks for Node `22.x`.
