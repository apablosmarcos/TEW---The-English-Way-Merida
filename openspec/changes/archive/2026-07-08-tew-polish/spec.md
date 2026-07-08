# Spec: tew-polish-2026-07

Contrato observable de los 3 cambios. Sin decisiones nuevas — todo lo
trascendente se cerró en el proposal.

## 1. Login admin usa asset ligero

### Comportamiento

- `frontend/src/app/pages/admin/login.component.ts:23` deja de referenciar
  `assets/img/2.png`.
- La nueva referencia usa un asset del set ya servido por la build, con peso
  razonable para un icono de marca. Candidatos: `Robot Head with TEW Logo.png`
  o `TEW.png` (el que la home ya usa para la marca).
- El login sigue funcionando idéntico. No cambia layout ni dimensiones.
- El test `admin templates include branded login…` sigue verde.

### Aceptación

- El bundle de la build (`frontend/dist/tew-frontend/browser/`) ya no contiene
  copia de `2.png` cuando se elimina la referencia.
- `grep -R "2\.png" frontend/src` no encuentra referencias en código Angular.
- El test de admin template sigue verde.

## 2. WebP de las 3 imágenes pesadas de la home

### Comportamiento

- Para cada uno de los 3 assets listados, existe un `.webp` al lado del `.png`
  con la misma raíz y resolución similar.
- En el HTML, cada uso de esos assets pasa a usar `<picture>` con un
  `<source type="image/webp" srcset="…webp">` y el `<img>` PNG como fallback.
- Los atributos `alt`, `loading`, `decoding` y `width/height` se mantienen en
  el `<img>` (no en el `<source>`).
- El navegador elige WebP si lo soporta; si no, cae a PNG sin error.

### Aceptación

- `ls assets/img/*.webp` lista 3 archivos nuevos al lado de los PNGs.
- `grep -E "Robot Head with TEW Logo|TEW 3D Logo with Robot and Flags|english teacher 03" frontend/src/app/pages/home/home.component.html` muestra los 3 sitios con `<picture>` envolviendo el `<img>`.
- Build Angular completa sin warnings de presupuesto.
- Tests frontend siguen verdes (26/26).
- La build dist incluye los 3 `.webp` en `frontend/dist/tew-frontend/browser/assets/img/`.

### Out of scope

- AVIF. No se generan.
- `<picture>` en el admin login (ya cubierto por el cambio 1).

## 3. Soft delete de leads

### Comportamiento

- La tabla `leads` admite 3 columnas nuevas: `deletedAt TEXT NULL`,
  `deletedBy TEXT NULL`, `deletedReason TEXT NULL`.
- `listLeads()` solo devuelve filas con `deletedAt IS NULL`. El comportamiento
  por defecto del panel admin no cambia visiblemente: las matrículas borradas
  desaparecen.
- `deleteLead(id, context)` toma un contexto `{ username, reason? }` y hace
  `UPDATE leads SET deletedAt = ?, deletedBy = ?, deletedReason = ? WHERE id = ?`.
  Si la fila ya estaba borrada, devuelve `false`.
- El endpoint HTTP `DELETE /api/admin/leads/:id` acepta un body JSON opcional
  `{ reason?: string }` y propaga el `username` desde la sesión autenticada.
- La fila borrada sigue en DB. Se puede recuperar con SQL directo:
  `UPDATE leads SET deletedAt = NULL, deletedBy = NULL, deletedReason = NULL WHERE id = ?`.

### Migración

- `initializeDatabase` (en `backend/src/modules/storage/sqlite.ts`) detecta las
  columnas ausentes leyendo `PRAGMA table_info(leads)` y ejecuta
  `ALTER TABLE leads ADD COLUMN …` solo para las que falten. Idempotente.
- `importLegacyLeadsIfNeeded` no se toca.

### API

- `DELETE /api/admin/leads/:id` (autenticado):
  - Request body (opcional): `{ "reason": "matrícula duplicada" }`.
  - Respuestas:
    - `204 No Content` cuando el borrado se registra.
    - `404 Not Found` si la fila no existe o ya estaba borrada.
    - `400 Bad Request` si el body no es JSON válido (la propiedad `reason`
      se ignora silenciosamente si no existe).

### Aceptación

- Backend tests verdes (los actuales + los nuevos que añadamos).
- Smoke: `curl -X POST /api/leads` con payload válido crea un lead. `curl -X
  DELETE /api/admin/leads/:id` con auth lo marca como borrado. `curl
  /api/admin/leads` ya no lo lista. Lectura SQL directa confirma que la fila
  sigue con `deletedAt` poblado.
- La UI admin no muestra los borrados. El botón "Eliminar" sigue existiendo y
  funcionando, sin cambio de UX.

### Out of scope

- Endpoint para listar o restaurar borrados. YAGNI.
- Cambio en el modelo `Lead` exportado. `Lead` no expone `deletedAt` por
  defecto; `listLeads` filtra antes de devolver.
- Auditoría multi-admin. Sigue siendo single-admin.
