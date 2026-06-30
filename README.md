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
- Deploy the Angular build from `frontend/dist/tew-frontend/browser` and the Express backend from `backend/dist/server.js` on the same site or behind the same domain.
- Keep `/api` routed to the backend so the frontend can call the real API through `/api`.
- The exact Hostinger wiring is intentionally pending; this repo only leaves the config files and build outputs ready for that follow-up.

## Dockerfile note

The repository `Dockerfile` is only a neutral backend artifact plus workspace build check. It does not represent the final Hostinger deployment.

- `docker build .` verifies that the monorepo builds cleanly under Node 22.
- The final container runs `backend/dist/server.js` only.
- GitHub Pages remains the temporary demo path, and the real frontend hosting setup for Hostinger stays as a later task.
