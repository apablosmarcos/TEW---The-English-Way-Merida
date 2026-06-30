# Task 2 Report

## Status

DONE_WITH_CONCERNS

## Commits

- `d72dbb7` `feat: add express backend shell`
- `881d176` `fix: align backend dev imports with ts runtime`

## Review fix

- Reproduced the review finding with `pnpm --filter tew-backend dev`: Node failed on `ERR_MODULE_NOT_FOUND` because `src/server.ts` imported `./app.js` before any build output existed.
- Switched backend source-relative imports from `.js` to `.ts` in the TypeScript sources used by `dev`.
- Enabled TypeScript's `rewriteRelativeImportExtensions` so `pnpm --filter tew-backend build` still emits runtime-correct `.js` imports in `backend/dist/`.

## Scope delivered

- Created the minimal Express backend shell in `backend/`.
- Added `createApp()` with `helmet`, `cors`, JSON parsing and `morgan`.
- Added `GET /api/health` and stub `POST /api/leads` routes.
- Added `server.ts` entrypoint and `env.ts` port helper.
- Replaced backend placeholder scripts with real TypeScript build/dev scripts.
- Added backend dependencies and updated `pnpm-lock.yaml`.
- Ignored generated `backend/dist/` artifacts.

## TDD / verification notes

- The brief explicitly asked for a `backend/src/routes/leads.test-note.ts` note instead of a runnable test suite. I added that note first, then verified the pre-existing backend build failed before implementation.
- Verified the initial failure with `pnpm --filter tew-backend build` while the backend package still contained the placeholder script.
- After implementation, verified the backend build passes with `pnpm --filter tew-backend build`.
- Also ran the compiled server and checked both routes:
  - `GET /api/health` returned `200`
  - `POST /api/leads` returned `201`
- For the review fix, re-verified `pnpm --filter tew-backend build` after changing the import strategy.
- For the review fix, started `pnpm --filter tew-backend dev` and confirmed it booted successfully and served `GET /api/health` without import errors.

## Commands run

```bash
pnpm --filter tew-backend build
pnpm install
pnpm --filter tew-backend build
node backend/dist/server.js
curl http://127.0.0.1:3000/api/health
curl -X POST http://127.0.0.1:3000/api/leads -H 'Content-Type: application/json' -d '{"email":"test@example.com"}'
pnpm --filter tew-backend dev
curl -f http://127.0.0.1:3000/api/health
git diff --check
```

## Self-review

- Kept the backend shell minimal and avoided persistence, validation, admin, or lead workflow logic beyond the requested stub.
- Removed `tsx` after it triggered `pnpm` build-policy friction through `esbuild`; Node's native type-stripping watcher keeps the dev script simple.
- The original `.js` suffixes were fine for emitted ESM, but not for direct TypeScript execution. Using `.ts` in source plus compiler rewriting keeps both paths aligned.
- Reverted the accidental `pnpm-workspace.yaml` `allowBuilds` placeholder introduced by `pnpm install`.

## Concerns

- `pnpm build` at workspace root still fails because `frontend` remains on its Task 1 placeholder script (`Frontend not implemented yet`). That is outside the scope of Task 2.
- `pnpm` prints an engine warning in this environment because the workspace expects Node `22.x` and the current runtime is Node `26.4.0`.

## Files changed

- `.gitignore`
- `backend/package.json`
- `backend/tsconfig.json`
- `backend/src/app.ts`
- `backend/src/server.ts`
- `backend/src/config/env.ts`
- `backend/src/routes/health.ts`
- `backend/src/routes/leads.ts`
- `backend/src/routes/leads.test-note.ts`
- `pnpm-lock.yaml`
- `.superpowers/sdd/task-2-report.md`
