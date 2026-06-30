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
- Run the Express backend from `backend/dist/server.js` and let it serve `frontend/dist/tew-frontend/browser` on the same origin.
- Keep `/api` on that same process so the frontend calls the real backend through `/api`.

## Dockerfile note

The repository `Dockerfile` builds the Hostinger-style artifact, not the GitHub Pages demo artifact.

- During `docker build`, it swaps in `frontend/src/assets/config/site.config.hostinger.json`, so the compiled frontend targets `/api`.
- The final container runs `backend/dist/server.js` and serves the compiled Angular files from the same runtime.
- A successful container should answer both `/` and `/api/health`.
