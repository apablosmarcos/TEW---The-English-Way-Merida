# Task 6 Report

## Scope

Prepared the deployment split so the repository defaults to a GitHub Pages visual demo while documenting the functional Hostinger deployment path.

## Changes made

- Kept the Node multi-stage `Dockerfile`, but changed it so the build swaps in `site.config.hostinger.json`, copies the compiled Angular output into the runtime image, and ships a real same-origin `/` + `/api` artifact instead of a backend-only container.
- Updated `backend/src/app.ts` so the backend serves compiled frontend assets when they exist and falls back to `index.html` outside `/api`.
- Added `backend/src/app.test.ts` to lock that runtime behavior with a backend test.
- Updated `README.md` so Hostinger and Docker describe the same actual runtime shape: one Express process serving both the Angular build and the API.
- Added `frontend/src/assets/config/site.config.hostinger.json` as the production example that points the frontend to `/api`.
- Kept `frontend/src/assets/config/site.config.json` unchanged with an empty `apiBaseUrl`, so the default repo build remains a demo-safe GitHub Pages artifact.

## Verification

### Before changes

- `pnpm build`: PASS
- `docker build .`: PASS technically, but it reflected the wrong deployment model because it only copied a static `index.html` into `nginx`.

### After changes

- `pnpm build`: PASS
- `pnpm --recursive test`: PASS
- `docker build .`: PASS
- `docker run` verification: PASS via `GET /`, `GET /api/health`, and `GET /assets/config/site.config.json` returning the combined artifact with `"apiBaseUrl": "/api"`.

## Self-review

- The README now matches the actual runtime behavior: GitHub Pages stays demo-only, while Docker/Hostinger serve frontend and backend together.
- The Dockerfile now produces a functional same-origin artifact instead of a backend-only container built with demo config.
- No product scope was expanded: this task stayed in deployment/configuration/documentation.

## Concerns

- Local verification ran under Node `v26.4.0`, while the workspace declares `22.x`; builds and tests still passed, and the Dockerfile now pins Node 22 for deployment parity.
