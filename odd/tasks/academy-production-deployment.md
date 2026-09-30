# Academy production deployment

## Objective

Deploy the implemented Academy portal to the existing Hostinger VPS behind the current Nginx and TLS edge, with a reversible cutover and durable Academy data.

## Problem

Production still serves the obsolete systemd/SQLite lead application. The release candidate lives in a separate clean worktree, replaces `/admin` with role-aware `/academia` routes, and has not yet been production-hardened or deployed.

## Why

The public site and Academy portal must run from the verified Academy candidate without exposing backend storage, losing uploads, or removing the currently working rollback path.

## Scope

- Harden the Academy Compose runtime minimally for production.
- Preserve host Nginx and Certbot as the TLS edge.
- Back up the existing deployment before cutover.
- Install Docker Engine and Compose on the VPS.
- Stage and run the Academy stack on `127.0.0.1:8080`.
- Bootstrap the first Academy administrator through the supported CLI.
- Switch Nginx traffic only after internal smoke checks pass.
- Verify persistence, public access, Academy access, restart behavior, and rollback readiness.

## Constraints

- Deployment source: `feat/academy-client-portal-42-retire-admin-test-path` in the `juanfran-academy-client-portal` worktree.
- Do not deploy `main` or its obsolete `/admin` application.
- Do not expose the backend, SQLite, or uploads directly to the network.
- Do not read, print, or copy secret values into tracked files or task evidence.
- Keep the old systemd deployment and SQLite data available for rollback until production acceptance.
- Never run `docker compose down -v` against production.
- Strict TDD is enabled by `openspec/config.yaml`; runner: `pnpm --recursive test`.
- Repository-facing technical artifacts remain in English.
- No commit or push without separate explicit authorization.

## Tasks

- [x] **DEPLOY-1 — Harden the release runtime.** Add the minimum production-safe Compose restart/readiness behavior, simplify the internal proxy to a single same-origin host, update operational documentation, and observe RED/GREEN evidence where behavior changes.
  - Acceptance: proxy remains bound to `127.0.0.1:8080`; `/api` routes to backend; SPA routes including `/academia` route to frontend; durable `academy-data` remains the only data volume; services recover after restart.
  - Checks: focused config assertions, `pnpm --recursive test`, `pnpm --recursive run build`, `docker compose config`, `git diff --check`.

- [x] **DEPLOY-2 — Prepare a reversible VPS release.** Capture timestamped backups of the existing Nginx site, systemd unit, deployed source/frontend, and persistent SQLite directory; install Docker/Compose; stage the exact Academy candidate without secret files.
  - Acceptance: backup inventory is readable; current production remains healthy; Docker and Compose report supported versions; staged files match the local release candidate.
  - Checks: existing public/API health, backup listing, Docker versions, staged manifest/hash checks.

- [x] **DEPLOY-3 — Start and validate Academy before cutover.** Create the production Compose environment, build/start the loopback-only stack, and exercise internal public/Academy/API flows. The user explicitly deferred first-administrator bootstrap until after cutover.
  - Acceptance: Compose services are healthy; `/api/health` succeeds through `127.0.0.1:8080`; legacy `/admin` and `/api/admin/*` remain absent; Academy access route loads.
  - Checks: Compose status/logs and internal curls with production Host header.

- [x] **DEPLOY-3A — Integrate the expected public redesign.** Reconcile the latest poster-style homepage from `main` with Academy navigation/session behavior, include its required media, verify the combined candidate, and redeploy the frontend without changing Academy persistence. Anonymous Academy access is now a visually separate red primary CTA in the topbar.
  - Acceptance: the public homepage shows the approved poster redesign and video while anonymous/authenticated Academy navigation remains correct; `/academia` and the API are unaffected.
  - Checks: focused homepage tests, `pnpm --recursive test`, `pnpm --recursive run build`, `docker compose config`, `git diff --check`, public asset/bundle verification.

- [x] **DEPLOY-4 — Cut over, bootstrap administration, verify, and preserve rollback.** Replace the host Nginx upstream with the loopback Compose proxy, validate and reload Nginx, verify external HTTPS flows and restart persistence, bootstrap the first administrator through the supported interactive CLI, then disable the obsolete backend service while retaining its files and data.
  - Acceptance: `tewacademy.es` and `www.tewacademy.es` serve the Academy release over valid TLS; `/academia` works; `/admin` is absent; administrator login and role routing work; data and uploads survive a controlled restart; rollback commands and backups are intact.
  - Checks: `nginx -t`, external HTTPS smoke, administrator login/session smoke, Compose restart smoke, certificate timer status, old service state, final backup/rollback inventory.

## Progress

- Deployment target and VPS topology explored.
- Academy candidate verified before deployment: 77/77 tests passed, both workspace builds passed, Compose rendered, and Git diff check passed.
- Existing production remains active and unchanged.
- DEPLOY-1 completed: the Compose proxy remains loopback-only, all services restart automatically, backend/proxy healthchecks are defined, and internal Nginx uses one same-origin server.
- DEPLOY-2 completed without interrupting production: the legacy deployment was backed up, Docker/Compose installed, and the Academy candidate staged at `/opt/tewacademy`.
- DEPLOY-3 completed: the new stack is running in parallel on `127.0.0.1:8080`; all containers are healthy and internal public, Academy access, API health, and legacy-route checks pass. At the user's request, first-administrator bootstrap moved after cutover.
- DEPLOY-4 completed: host Nginx serves the Academy stack publicly over TLS, the obsolete systemd backend is disabled but preserved, and the first administrator was created and validated through production login/logout.
- DEPLOY-3A completed: the Academy access control is structurally outside ordinary navigation, reuses the red primary button language, preserves the authenticated account menu, and is deployed publicly.

## Verification evidence

- Academy worktree was clean at `a5e7158` before deployment work.
- Frontend has `/academia` routes and no `/admin` route.
- Backend mounts `/api/academy`; legacy `/api/admin/*` tests return 404.
- Initial VPS baseline ran host Nginx/Certbot plus the obsolete Node systemd service without Docker.
- DEPLOY-1 RED assertions observed missing restart policies (0/3), healthchecks (0/2), health dependency (0/1), and two Nginx servers; GREEN observed 3/3 restart policies, 2/2 healthchecks, the dependency, and one server.
- Writer and independent verifier both observed 77/77 tests, both builds, valid Compose rendering, and a clean diff check. Parent spot check reran `git diff --check` successfully.
- Legacy backup `/root/deploy-backups/academy-20260917T111317Z/legacy-production.tar.gz` passed its SHA-256 verification and production health stayed green.
- VPS now runs Docker 29.1.3 and Compose 2.40.3; staged source matched the local candidate by an empty rsync dry-run and remote Compose rendered successfully.
- `docker compose up -d --build --wait` completed; backend and proxy reported healthy, `/api/health` returned 200, `/academia/acceso` returned 200, and `/admin`, `/admin/*`, and `/api/admin/login` returned 404 after the proxy was recreated with the corrected mounted configuration.
- Proxy trust was bound to the known two-hop topology with strict fail-closed parsing; 81/81 tests, both builds, Compose rendering, independent verification, and the parent diff check passed.
- Public HTTPS cutover passed for `tewacademy.es` and `www.tewacademy.es`; `/`, `/academia/acceso`, and `/api/health` return 200 while legacy admin paths return 404.
- A controlled backend/proxy restart preserved the empty `users` table count, both healthchecks recovered, Certbot remains enabled/active, the rollback checksum remains valid, and the legacy service is disabled/inactive.
- DEPLOY-3A observed focused RED 11/12 then GREEN 12/12; independent verification passed frontend 50/50, backend 32/32, both builds, Compose rendering, and diff checks.
- The poster release served `main-6T4H2OEB.js`; it contained both the poster video and Academy access references. The 73,085,947-byte MP4 returned 200 as `video/mp4`.
- The CTA follow-up observed focused RED 11/12 then GREEN 12/12; independent verification passed all 82 tests, both builds, Compose rendering, and diff checks.
- Production now serves `main-HUELODYN.js` with the separate `academy-access-link`; `/academia/acceso` remains 200, `/admin` remains 404, and `/api/health` remains 200.
- Administrator `admin` was created as role `admin`; production login returned 200 and logout returned 204. An interrupted TTY bootstrap lost the first generated credential, so the sole account credential was transactionally recovered, all its sessions were revoked, and the recovered credential was validated.

## Next step

Have the user sign in with the delivered administrator credential and store it in a password manager; no deployment task remains.
