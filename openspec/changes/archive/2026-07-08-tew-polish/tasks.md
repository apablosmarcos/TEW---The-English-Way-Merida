# Tasks: tew-polish-2026-07

Lista ordenada, accionable, verificable. Cada tarea deja evidencia.

## 1. Login admin usa asset ligero

- [x] Cambiar `frontend/src/app/pages/admin/login.component.ts:23` para usar
  `assets/img/Robot Head with TEW Logo.png` en lugar de `assets/img/2.png`.
- [x] Verificar build Angular: `cd frontend && pnpm build` termina sin warnings
  ni errores.
- [x] Verificar que el dist ya no contiene `2.png`:
  `ls frontend/dist/tew-frontend/browser/assets/img/2.png` debe fallar.

## 2. WebP de las 3 imágenes pesadas

- [x] Añadir `sharp` como devDep en `frontend/package.json`:
  `cd frontend && pnpm add -D sharp`.
- [x] Crear `frontend/scripts/generate-webp.mjs` con la lógica:
  - Lista hardcoded de los 3 PNGs objetivo (paths absolutos).
  - Por cada uno, si `.webp` no existe o es más antiguo que el `.png`, genera
    `.webp` con `sharp(input).webp({ quality: 80 }).toFile(output)`.
  - Imprime peso antes/después de cada uno.
- [x] Ejecutar `node frontend/scripts/generate-webp.mjs` y verificar que los 3
  `.webp` existen.
- [x] En `frontend/src/app/pages/home/home.component.html`, envolver con
  `<picture><source type="image/webp" srcset="…webp"><img …></picture>` los
  `<img>` que apunten a:
  - `assets/img/Robot Head with TEW Logo.png` (líneas 5 y 38)
  - `assets/img/TEW 3D Logo with Robot and Flags.png` (línea 65)
  - `assets/img/english teacher 03.png` (línea 70)
- [x] Re-ejecutar la build Angular. Verificar:
  - Sin warnings de presupuesto.
  - Los 3 `.webp` aparecen en `frontend/dist/tew-frontend/browser/assets/img/`.
- [ ] Correr tests frontend: `cd frontend && pnpm test` → 26/26 verde.

## 3. Soft delete de leads

- [x] `backend/src/modules/storage/sqlite.ts`: añadir función
  `ensureLeadsSoftDeleteColumns(database)` que lee `PRAGMA table_info(leads)`
  y hace `ALTER TABLE leads ADD COLUMN …` para `deletedAt`, `deletedBy`,
  `deletedReason` si faltan. Idempotente. Llamarla al final de
  `initializeDatabase`.
- [x] `backend/src/modules/leads/lead-types.ts`: añadir
  `export type LeadDeleteContext = { username: string; reason?: string };`.
- [x] `backend/src/modules/leads/lead-repository.ts`:
  - Cambiar `deleteLead(id)` por `deleteLead(id, context: LeadDeleteContext)`.
  - SQL: `UPDATE leads SET deletedAt = ?, deletedBy = ?, deletedReason = ?
    WHERE id = ? AND deletedAt IS NULL`.
  - `listLeads`: añadir `WHERE deletedAt IS NULL` al SELECT.
- [x] `backend/src/routes/admin-leads.ts`:
  - `DELETE /api/admin/leads/:id`: leer body opcional, extraer `reason`.
  - `username` desde `process.env.ADMIN_USERNAME`.
  - Llamar `deleteLead(req.params.id, { username, reason })`.
  - Responder `204` en éxito, `404` si no afectó filas.
- [x] Tests nuevos en `backend/src/modules/leads/lead-repository.test.ts`:
  - `deleteLead` marca `deletedAt` con el timestamp.
  - `deleteLead` propaga `username` y `reason` a la fila.
  - `listLeads` excluye filas con `deletedAt` no nulo.
  - `deleteLead` sobre fila ya borrada devuelve `false` (idempotente).
- [x] Tests nuevos en `backend/src/routes/admin.test.ts`:
  - `DELETE /api/admin/leads/:id` con body `{ reason: "duplicado" }` devuelve
    204 y la fila queda con `deletedAt` poblado y `deletedReason="duplicado"`.
  - `DELETE /api/admin/leads/:id` sin body también funciona.
  - `DELETE /api/admin/leads/<id-inexistente>` devuelve 404.
  - `GET /api/admin/leads` no lista la fila borrada.
- [x] Correr `cd backend && pnpm test` → 24/24 verde.

## 4. Verify y archive

- [ ] Ejecutar suite completa: backend + frontend tests, build Angular.
- [ ] Smoke manual con curl si es posible (no obligatorio si los tests cubren).
- [ ] Escribir `verify-report.md` con `Verdict: PASS` cuando todo esté verde.
- [ ] Mover `openspec/changes/tew-polish-2026-07/` a
  `openspec/changes/archive/2026-07-08-tew-polish/`.
- [ ] Dejar al usuario el comando `git add` + `git commit` con los cambios.
