# TEW Lead Capture MVP

## Local start

1. Install dependencies: `pnpm install`
2. Run the frontend: `pnpm dev:frontend`
3. Run the backend: `pnpm dev:backend`

## Deployment split

### GitHub Pages

GitHub Pages is the visual demo only.

- Keep `frontend/src/assets/config/site.config.json` with `"apiBaseUrl": ""`.
- Build with `pnpm build`.
- Publish the Angular output from `frontend/dist/tew-frontend/browser`.
- The public form stays in demo mode and the admin is intentionally unusable there.

### Hostinger

Hostinger is the functional deployment.

- Build the frontend and backend with `pnpm build`.
- Before the production frontend build, copy `frontend/src/assets/config/site.config.hostinger.json` over `frontend/src/assets/config/site.config.json` so the app points to `/api`.
- Serve the Angular build from `frontend/dist/tew-frontend/browser`.
- Run the Express backend from `backend/dist/server.js`.
- Route `/api` to the backend so the frontend and API share the same origin.

## Dockerfile note

The repository Dockerfile now builds the real workspace and runs the backend. It is not the GitHub Pages artifact; Pages only needs the built frontend files.
