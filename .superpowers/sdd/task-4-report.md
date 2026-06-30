# Task 4 Report - Angular public site and lead form

## Scope delivered

- Built a minimal standalone Angular frontend for the public TEW landing page.
- Added a public lead form with required `name`, `email`, and `message` fields.
- Added runtime config loading from `frontend/src/assets/config/site.config.json`.
- Implemented demo-mode behavior: when `apiBaseUrl` is empty, the UI clearly states that GitHub Pages is only a visual demo and does not fake persistence.
- Kept admin features out of scope.

## TDD notes

### Red

1. Added `frontend/src/app/pages/home/home-form.test.ts` first.
2. Ran:

```bash
pnpm --filter tew-frontend test
```

Observed expected failure because `home-form.ts` did not exist yet:

```text
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../home-form.ts'
```

### Green

- Implemented `home-form.ts` with:
  - `createLeadForm()`
  - `submitLeadForm()`
- Hooked that logic into the Angular `HomeComponent`.
- Re-ran the test suite until it passed.

## Files added or changed

- `frontend/angular.json`
- `frontend/package.json`
- `frontend/tsconfig.json`
- `frontend/tsconfig.app.json`
- `frontend/src/index.html`
- `frontend/src/main.ts`
- `frontend/src/styles.css`
- `frontend/src/app/app.component.ts`
- `frontend/src/app/app.routes.ts`
- `frontend/src/app/core/services/site-config.service.ts`
- `frontend/src/app/core/services/leads-api.service.ts`
- `frontend/src/app/pages/home/home-form.ts`
- `frontend/src/app/pages/home/home-form.test.ts`
- `frontend/src/app/pages/home/home.component.ts`
- `frontend/src/app/pages/home/home.component.html`
- `frontend/src/assets/config/site.config.json`
- `.gitignore`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`

## Verification run

### Brief verification: expected initial fail

Ran before implementation:

```bash
pnpm --filter tew-frontend build
```

Result: failed as expected with the placeholder frontend script:

```text
Frontend not implemented yet
```

### Lightweight frontend tests

Ran after implementation:

```bash
pnpm --filter tew-frontend test
```

Result:

```text
✔ lead form is invalid without required fields
✔ lead form calls API when apiBaseUrl exists
✔ lead form shows demo-mode message when apiBaseUrl is empty
```

Note: this uses a very small Node-based test instead of full Angular component test infrastructure to keep scope and setup cost down for the MVP while still covering the lead-form behavior requested in the brief.

### Frontend build verification

Ran after implementation:

```bash
pnpm --filter tew-frontend build
```

Result: passed and generated the Angular app bundle in `frontend/dist/tew-frontend`.

## Self-review

- Confirmed the app reads runtime config from `assets/config/site.config.json`.
- Confirmed demo mode does not call the API and does not claim persistence.
- Confirmed API mode delegates to `POST /api/leads` via `LeadsApiService`.
- Confirmed only public landing + lead form were implemented; no admin UI was added.
- Added ignore rules for Angular-generated local artifacts.

## Notes / concerns

- `pnpm` required explicit `allowBuilds` entries in `pnpm-workspace.yaml` for Angular build dependencies (`esbuild`, `@parcel/watcher`, `lmdb`, `msgpackr-extract`).
- The workspace currently warns about the configured Node engine because this environment is running Node `v26.4.0` while the repo asks for Node `22.x`. The frontend still built and tests still passed under the current environment.
