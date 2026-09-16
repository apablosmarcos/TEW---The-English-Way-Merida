# Academy Client Portal

The Academy portal gives each user an individual account. It is prepared for a future self-hosted server; it is **not deployed or production-validated**.

## Academy paths and roles

| Role | Sign in / destination | Access |
| --- | --- | --- |
| Parent | `/academia/acceso` → `/academia` | Published posts and protected attachments |
| Administrator | `/academia/acceso` → `/academia/admin/publicaciones` | Publications, categories, attachments, and user administration at `/academia/admin/usuarios` |

Administrators create individual parent accounts. There is no shared administrator login or credential environment bootstrap. The first administrator, and any recovery administrator, is created interactively with the CLI below.

## Safe local Compose quickstart

Compose is for local pre-deployment use only. It binds the proxy to `127.0.0.1:8080` and persists both SQLite and uploads in the named `academy-data` volume at `/app/backend/data`.

```sh
docker compose up -d --build
docker compose exec backend node backend/dist/cli/create-admin.js
```

Open `http://127.0.0.1:8080`, then sign in at `/academia/acceso`. The CLI requires an interactive TTY and prompts for the administrator details.

`docker compose down` keeps the volume. **`docker compose down -v` permanently deletes the Academy database and uploads for this Compose project.**

The backend uses:

```text
SQLITE_DB_PATH=/app/backend/data/academy.sqlite
FILE_STORAGE_PATH=/app/backend/data/uploads
```

The obsolete `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_TTL_HOURS`, and `LEGACY_LEADS_FILE_PATH` variables are not used.

## Development API routing

The frontend expects the API at the same-origin `/api` path. `pnpm dev:frontend` alone does not provide a functional portal API: configure and run a same-origin `/api` development proxy to `pnpm dev:backend`, or use Compose. Do not change the static site's API base implicitly; a static deployment that needs a separate API must explicitly set `apiBaseUrl` to that API's public URL before building.

## Offline backup and restore

Back up the whole data directory as one stopped-writer snapshot; SQLite's database, WAL, and SHM files and the uploads must stay matched. Do not copy only the `.sqlite` file.

```sh
mkdir -p backups
docker compose stop backend
if docker compose run --rm --no-deps -v "$PWD/backups:/backup" backend sh -c 'tar -C /app/backend/data -czf /backup/academy-data-$(date +%Y%m%dT%H%M%SZ).tgz .'; then
  docker compose up -d
else
  echo 'Backup failed; backend remains stopped.'
  exit 1
fi
```

Restore normally targets a fresh Compose project/volume (for example, replace `docker compose` below with `docker compose -p academy-restore`) to retain the original. Restore only into an intentionally empty volume; keep the backend stopped and never extract over existing data:

```sh
BACKUP=backups/academy-data-YYYYMMDDTHHMMSSZ.tgz
test -f "$BACKUP" || { echo 'Backup archive not found.'; exit 1; }
docker compose stop backend
docker compose run --rm --no-deps backend sh -c 'test -z "$(find /app/backend/data -mindepth 1 -maxdepth 1 -print -quit)"' || { echo 'Refusing to overwrite existing Academy data.'; exit 1; }
if docker compose run --rm --no-deps -v "$PWD/backups:/backup:ro" backend sh -c "tar -xzf /backup/$(basename "$BACKUP") -C /app/backend/data"; then
  docker compose up -d
else
  echo 'Restore failed; backend remains stopped.'
  exit 1
fi
```

## Future own-server checklist

Before exposing this stack, complete and validate:

- [ ] Domain DNS and TLS termination; publish the proxy only through the intended HTTPS entry point.
- [ ] Firewall rules that expose only required public ports; keep backend storage and database unreachable from the network.
- [ ] Administrator secrets and access procedures outside source control; bootstrap with the TTY CLI.
- [ ] Tested, encrypted/off-host backups using the stopped-writer whole-data procedure and a restore drill.
- [ ] A known reverse-proxy topology before enabling Express `trust proxy`. It is currently disabled: `req.ip` sees the proxy, so login rate limiting is shared behind that proxy. Never blanket-trust inbound `X-Forwarded-For`.
- [ ] A production smoke test covering administrator bootstrap, parent access, publication, and attachment persistence after restart.

## Static hosting

GitHub Pages can host only the static public site. Without a reachable API and persistent backend storage, Academy login and private content are unavailable. If a static host is used with a separate API, explicitly configure its `apiBaseUrl`; GitHub Pages alone is not a functional portal deployment.

## Status

Browser E2E passed locally. Production has not been deployed or validated, and formal project closure remains pending a release environment.
