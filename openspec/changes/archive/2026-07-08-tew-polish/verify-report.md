# Verify: tew-polish-2026-07

## Verdict: PASS

## Resumen

Tres cambios implementados y verificados contra tests y build.

## 1. Login admin usa asset ligero

- `frontend/src/app/pages/admin/login.component.ts:23` usa ahora
  `assets/img/Robot Head with TEW Logo.png`.
- `assets/img/2.png` eliminado del repo. Build Angular ya no lo incluye.
- Test `admin templates include branded login…` verde.

## 2. WebP de las 3 imágenes pesadas

- Generados 3 archivos `.webp` con `sharp` (calidad 80):
  - `Robot Head with TEW Logo.png` 1.2MB → 60kB WebP.
  - `TEW 3D Logo with Robot and Flags.png` 972kB → 28kB WebP.
  - `english teacher 03.png` 145kB → 106kB WebP.
- `frontend/src/app/pages/home/home.component.html` usa `<picture>` con
  `<source type="image/webp">` y PNG fallback en los 4 usos de esos assets.
- Build Angular: 377.70kB inicial, sin warnings.

## 3. Soft delete de leads

- `backend/src/modules/storage/sqlite.ts`: migración idempotente con
  `PRAGMA table_info(leads)` añade `deletedAt`, `deletedBy`, `deletedReason`.
- `backend/src/modules/leads/lead-types.ts`: nuevo `LeadDeleteContext`.
- `backend/src/modules/leads/lead-repository.ts`:
  - `listLeads` filtra `WHERE deletedAt IS NULL`.
  - `deleteLead` hace `UPDATE … WHERE id = ? AND deletedAt IS NULL`.
- `backend/src/routes/admin-leads.ts`: `DELETE` acepta body opcional con
  `reason`, responde `204` en éxito, `404` si no existe.
- `frontend/src/app/core/services/admin-api.service.ts`: usa
  `responseType: 'text'` para consumir el 204.

## Tests

- Backend: 24/24 verde.
- Frontend: 26/26 verde.

## Build

- Frontend Angular build sin warnings de presupuesto.
- Dist incluye los 3 `.webp` y ya no incluye `2.png`.

## Out of scope respetado

- No se añadió UI de papelera.
- No se añadió refresh token / rotación.
- No se migró a AVIF.
- No se tocó `importLegacyLeadsIfNeeded`.
