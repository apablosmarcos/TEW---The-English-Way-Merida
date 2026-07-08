# Design: tew-polish-2026-07

Estrategia técnica. Cambios aditivos sobre lo existente. Sin migraciones pesadas.

## 1. Login admin usa asset ligero

**Decisión:** reemplazar `assets/img/2.png` por `assets/img/Robot Head with TEW Logo.png`.

**Por qué este y no `TEW.png`:**
- El robot es la identidad que el resto de la app ya privilegia (header, hero,
  `success-robot` del formulario). Coherencia de marca.
- Pesa 1.2MB pero se renderiza a 80px con `width/height` del CSS. La
  optimización WebP del cambio 2 cubre este caso también si decide añadirse
  al login en otro pase. El login admin se carga solo en producción real, no
  en el demo de GitHub Pages, así que el peso importa menos que en la home.

**Ponytail check:** ¿podemos no usar imagen y usar un SVG? La marca TEW aún
no tiene SVG oficial. No lo invento. Reutilizo el asset existente. **Sí, más
simple que añadir un SVG.**

**Cambio:** 1 línea en `login.component.ts:23`.

## 2. WebP de las 3 imágenes pesadas

### Generación

**Tooling:** `sharp` como devDep temporal en `frontend/`. Es la opción más
madura en Node y ya tenemos Node 22 como engine. Binario nativo, no requiere
apt.

**Por qué `sharp` y no `cwebp` puro:** el repo no tiene `cwebp` instalado, y
añadir una dependencia de sistema operativo rompe la portabilidad de la build.
`sharp` corre en Linux/macOS sin más.

**Script:** `frontend/scripts/generate-webp.mjs`. Lee la lista de assets
objetivo, por cada uno genera `<basename>.webp` con calidad 80 (sweet spot
tamaño/calidad para logos). Si el `.webp` ya existe y es más reciente que el
`.png`, lo deja en paz (idempotente).

**Integración:** el script se ejecuta una vez en local y los `.webp` se
commitean al repo. **No** se añade paso de build que regenere WebP en cada
build — son assets congelados. Si en el futuro cambia el PNG, se re-ejecuta
el script y se commitea el WebP nuevo.

### HTML

Cambio mecánico en 3 sitios de `home.component.html`:

```html
<picture>
  <source type="image/webp" srcset="assets/img/<basename>.webp">
  <img src="assets/img/<basename>.png" alt="…" loading="lazy" decoding="async" />
</picture>
```

Solo donde el asset aparece en home. La marca del header (línea 5) y la
del hero (línea 38) usan `Robot Head with TEW Logo.png` con `<picture>`. El
banner 3D (línea 65) usa `TEW 3D Logo with Robot and Flags.png` con `<picture>`.
La profesora (línea 70) usa `english teacher 03.png` con `<picture>`.

### Bundle y presupuesto

El presupuesto de Angular (`angular.json:39-41`) marca `initial 500kB warn /
1MB error`. Los WebP se sirven perezosos (`loading="lazy"`) y se cachean
separados. No afecta al bundle inicial, solo a las imágenes, que ya están
fuera del bundle JS.

**Ponytail check:** ¿necesitamos un servicio Angular que decida WebP vs PNG?
No. El navegador ya lo hace con `<picture>`. Cero runtime Angular.

## 3. Soft delete de leads

### Migración idempotente

`backend/src/modules/storage/sqlite.ts`, dentro de `initializeDatabase`:

```ts
ensureLeadsSoftDeleteColumns(database);
```

Lee `PRAGMA table_info(leads)`, comprueba qué columnas faltan entre
`deletedAt`, `deletedBy`, `deletedReason`, y hace `ALTER TABLE` solo para las
que falten. Idempotente, funciona en cualquier SQLite 3.x.

### Modelo

`backend/src/modules/leads/lead-types.ts` añade tipo `LeadDeleteContext`:

```ts
export type LeadDeleteContext = {
  username: string;
  reason?: string;
};
```

### Repositorio

`deleteLead` pasa de `(id) => Promise<boolean>` a `(id, context) => Promise<boolean>`.
`lead-repository.ts:48-55` cambia el SQL a:

```ts
database.prepare(
  'UPDATE leads SET deletedAt = ?, deletedBy = ?, deletedReason = ? WHERE id = ? AND deletedAt IS NULL',
).run(new Date().toISOString(), context.username, context.reason ?? null, id);
```

El `AND deletedAt IS NULL` garantiza idempotencia del borrado (segunda vez
devuelve 0 rows).

`listLeads` añade `WHERE deletedAt IS NULL` en su SELECT.

### HTTP

`backend/src/routes/admin-leads.ts:53-66`, el `DELETE /api/admin/leads/:id`:
- Lee `req.body` opcional, parsea `reason` (string opcional).
- Resuelve `username` desde `process.env.ADMIN_USERNAME` (single admin MVP).
- Pasa `{ username, reason }` a `deleteLead`.
- Devuelve `204` en éxito, `404` si no afecta filas.

Cambio de respuesta: `200 { ok: true }` → `204` (sin body). Esto es más
limpio y es lo que el spec promete. El frontend ya no mira el body en DELETE,
solo el status, así que no hay cambio UX.

### Frontend

`frontend/src/app/core/services/admin-api.service.ts` y
`leads-state.ts` no cambian. El método `deleteLead` ya no necesita argumento
adicional. La UI sigue mostrando el success message existente.

## Estructura de archivos

```
openspec/changes/tew-polish-2026-07/
├── proposal.md       (existente)
├── spec.md           (existente)
├── design.md         (este fichero)
├── tasks.md          (próximo)
├── apply-progress.md (se crea en apply)
└── verify-report.md  (se crea en verify)
```

Cambios en código:

```
frontend/src/app/pages/admin/login.component.ts        (1 línea)
frontend/src/app/pages/home/home.component.html        (~6 inserciones de <picture>)
assets/img/Robot Head with TEW Logo.webp               (nuevo)
assets/img/TEW 3D Logo with Robot and Flags.webp       (nuevo)
assets/img/english teacher 03.webp                     (nuevo)
frontend/scripts/generate-webp.mjs                     (nuevo, tooling one-shot)
frontend/package.json                                  (+ sharp devDep)
backend/src/modules/storage/sqlite.ts                  (ensureLeadsSoftDeleteColumns)
backend/src/modules/leads/lead-types.ts                (LeadDeleteContext)
backend/src/modules/leads/lead-repository.ts           (soft delete + filter)
backend/src/routes/admin-leads.ts                      (body + 204)
backend/src/modules/leads/lead-repository.test.ts      (tests nuevos)
backend/src/routes/admin.test.ts                       (tests nuevos)
```

## Riesgos y rollback

- **Migración:** la nueva columna `deletedAt` es NULL por defecto. No afecta
  a filas existentes. Rollback: borrar columna (SQLite no soporta DROP
  COLUMN directo en versiones viejas, pero la columna extra no molesta).
- **DELETE con cambio de respuesta (200→204):** la UI no lee body, solo
  status. Si un cliente externo asume body, lo rompe. No hay otro cliente.
- **WebP:** si un navegador no soporta WebP (ningún navegador moderno en
  2026), cae al PNG. Fallback gracioso. No hay forma de que el sitio se
  rompa por un WebP corrupto — el `<img>` fallback sigue funcionando.
