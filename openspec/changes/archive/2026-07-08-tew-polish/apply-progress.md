# Apply: tew-polish-2026-07

## 2026-07-08

### Tarea 1: Login admin usa asset ligero

- [x] Reemplazado `assets/img/2.png` por `assets/img/Robot Head with TEW Logo.png`
  en `frontend/src/app/pages/admin/login.component.ts:23`.

### Tarea 2: WebP de las 3 imágenes pesadas (en progreso)

- [x] Instalar `sharp` como devDep
- [x] Crear `frontend/scripts/generate-webp.mjs`
- [x] Generar WebPs: Robot 1.2MB → 60kB, 3D banner 972kB → 28kB, teacher 145kB → 106kB.
- [x] Editar `home.component.html` con `<picture>` en los 4 usos de los 3 assets.
- [x] Build + tests verdes (26/26). `2.png` eliminado del repo y del dist.

### Tarea 3: Soft delete de leads

- [x] `sqlite.ts`: migración idempotente con `PRAGMA table_info(leads)`.
- [x] `lead-types.ts`: añadido `LeadDeleteContext`.
- [x] `lead-repository.ts`: `listLeads` filtra `deletedAt IS NULL`, `deleteLead` hace UPDATE con `deletedAt/deletedBy/deletedReason`.
- [x] `admin-leads.ts`: endpoint DELETE acepta body opcional con `reason`, devuelve 204.
- [x] `admin-api.service.ts`: frontend usa `responseType: 'text'` para 204.
- [x] Tests backend actualizados y nuevos: 24/24 verde.
- [x] Tests frontend 26/26 verde, build Angular 377kB sin warnings.

