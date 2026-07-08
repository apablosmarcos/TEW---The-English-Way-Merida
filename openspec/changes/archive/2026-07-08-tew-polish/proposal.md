# Proposal: TEW polish — imágenes, login, soft delete

Endurecimiento y polish pendientes de la review `reviews/2026-07-02-frontend-backend-issues.md`
que el rediseño del 2026-07-08 y la migración a SQLite (`99f96c0`) NO cerraron.
El review lista estos puntos como P1, P1, P3, P3. Verificación de hoy:

- Auth admin plano (#7) → ya resuelto: tokens `randomBytes(32)` hasheados, TTL
  configurable, expiración validada contra DB. Sigue siendo single-admin MVP,
  sin refresh tokens, que se deja fuera de scope.
- Feedback de éxito al borrar (#4) → ya resuelto en `leads.component.ts:506`.
- Imágenes sobredimensionadas (#2) → parcialmente resuelto. La home ya no
  referencia `2.png` ni `TEW Board Welcome SS.png`. **Pero el login admin
  sigue usando `2.png` a 647KB como icono de 80px.**
- Borrado destructivo sin auditoría (#8) → sigue siendo DELETE físico en
  `lead-repository.ts:48-55`. Para un MVP de matrículas escolares, perder un
  lead por error del admin tiene coste real.

## Cambios

1. **Login admin usa asset ligero** — `login.component.ts:23` reemplaza
   `assets/img/2.png` por un asset del set ya optimizado. La identidad TEW ya
   tiene `Robot Head with TEW Logo.png` y `TEW.png` que el resto de la app usa.

2. **WebP de las tres imágenes pesadas de la home** — generar variantes WebP
   al lado de las PNGs y servirlas con `<picture><source type="image/webp">…</picture>`
   para que el navegador elija. Las PNGs siguen siendo fallback. Aplica a:
   - `Robot Head with TEW Logo.png` (1.2MB) — header y hero.
   - `TEW 3D Logo with Robot and Flags.png` (995KB) — banner del hero.
   - `english teacher 03.png` (149KB) — moderadamente pesada, también.

   Las 3 se referencian ya con `loading="lazy"` excepto la primera (header).
   La del header es prioritaria para LCP, así que su WebP es la mejora más
   rentable.

3. **Soft delete de leads** — añadir columnas `deletedAt TEXT, deletedBy TEXT,
   deletedReason TEXT` a la tabla `leads`. `deleteLead` pasa a
   `UPDATE leads SET deletedAt = ?, deletedBy = ?, deletedReason = ? WHERE id = ?`.
   `listLeads` añade `WHERE deletedAt IS NULL`. La fila sigue en DB para
   auditoría y recuperación manual vía SQL, pero no aparece en el panel.
   **No** se añade UI de papelera — YAGNI para el scope actual. Si se necesita
   más adelante, el endpoint `listLeads` admite un `includeDeleted` con un
   cambio de una línea.

## Decisiones que necesitan spec

- B) **Formato fallback**: ¿solo WebP + PNG (recomendado, cubre todo), o también
  AVIF? Cubre 95% del tráfico con WebP, AVIF añade complejidad de tooling.
- C) **Granularidad de `deletedBy`**: ¿qué identificador guardamos? El MVP solo
  tiene un admin (env). Guardamos el username del `ADMIN_USERNAME` y un campo
  libre para razón corta.
- C) **Migración**: la tabla existe, hay que `ALTER TABLE` con `IF NOT EXISTS`
  equivalente. SQLite no tiene `ADD COLUMN IF NOT EXISTS` hasta 3.35+. La
  detección se hace leyendo `PRAGMA table_info(leads)` y solo añadiendo las
  columnas que falten, de forma idempotente.

## No objetivo (out of scope)

- Refresh tokens / rotación. El TTL de 8h cubre la sesión de un día de
  trabajo. Una sola sesión activa por admin.
- UI de papelera / restauración. Documentado como follow-up.
- Rediseño del login. Solo el icono.
- Cambio de proveedor de DB. Sigue SQLite.
