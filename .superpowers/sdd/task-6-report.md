# Task 6 Report

## Scope

Prepared the deployment split so the repository defaults to a GitHub Pages visual demo while documenting the functional Hostinger deployment path.

## Changes made

- Reverted the Task 6 runtime expansion in `backend/src/app.ts`; the backend stays API-only and does not serve frontend files or add an SPA fallback.
- Removed `backend/src/app.test.ts`, because it only existed to cover the combined frontend-plus-backend runtime that Task 6 should not own.
- Simplified the Node multi-stage `Dockerfile` back to a neutral artifact: it builds the full workspace for verification but ships only `backend/dist` at runtime.
- Updated `README.md` so GitHub Pages is clearly the temporary visual demo, `site.config.hostinger.json` remains the later Hostinger-oriented example, and the final Hostinger wiring is explicitly deferred.
- Added `frontend/src/assets/config/site.config.hostinger.json` as the production example that points the frontend to `/api`.
- Kept `frontend/src/assets/config/site.config.json` unchanged with an empty `apiBaseUrl`, so the default repo build remains a demo-safe GitHub Pages artifact.

## Verification

### Before changes

- `pnpm build`: PASS
- The previous `backend/src/app.test.ts` no longer applied once Task 6 stopped owning combined runtime behavior.

### After changes

- `pnpm build`: PASS
- `pnpm --recursive test`: PASS
- `docker build .`: PASS

## Self-review

- The README now matches the new user decision: GitHub Pages is temporary, Hostinger is deferred, and Task 6 stays in docs/config/deployment prep.
- The Dockerfile no longer claims to solve the full Hostinger shape; it is only an honest build/runtime check for the backend.
- Task 6 no longer adds backend runtime responsibility for frontend hosting.

## Concerns

- Local verification ran under Node `v26.4.0`, while the workspace declares `22.x`; builds and tests still passed, and `docker build .` verified the neutral artifact under Node 22.
