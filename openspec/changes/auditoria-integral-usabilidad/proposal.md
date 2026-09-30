# Auditoría integral y correcciones de usabilidad

## Why

La aplicación necesita una revisión conjunta de navegación pública, academia,
administración, accesibilidad, contratos HTTP y persistencia. Que compilen los
dos árboles y pasen sus pruebas no demuestra que sus recorridos sean utilizables:
se han reproducido contenido invisible sin AOS, navegación móvil incorrecta,
rutas vacías y un editor editable tras un error de carga.

Petición del usuario: análisis autónomo mediante varios agentes pi coordinados
por Herdr, Judgment Day y preparación de especificaciones SDD para los fixes.
Esta entrega es **planificación**, no implementación ni autorización de despliegue.

## What Changes

- Registrar cada candidato con ID estable, ámbito, evidencia y clasificación.
- Definir requisitos y escenarios verificables por dominio, sin una reescritura
  general ni una única entrega masiva difícil de revisar.
- Priorizar pérdida de contenido, integridad del editor, acceso y pruebas omitidas.
- Preparar lotes TDD pequeños con dependencias y puertas de aceptación.
- Contrastar el paquete documental con dos jueces independientes de Gentle Pi.
- Conservar explícitamente riesgos no reproducidos y decisiones legales pendientes.

## Capabilities

### New Capabilities

- `public-experience-quality`: disponibilidad progresiva, teclado, navegación,
  contacto y metadatos de la web pública.
- `academy-interaction-quality`: estados, concurrencia, formularios y adaptación
  de las pantallas privadas a móviles.
- `academy-contract-hardening`: credenciales, contratos HTTP y persistencia segura.
- `verification-completeness`: cobertura ejecutable y pruebas de comportamiento.
- `privacy-media-readiness`: decisiones verificables sobre terceros y multimedia.
- `legacy-lead-lifecycle`: actualización coherente de contactos eliminados,
  exclusivamente si se mantiene el producto legado.

### Modified Capabilities

Ninguna especificación canónica se sustituye ahora. No existe `openspec/specs/`
en la raíz. Los nuevos dominios complementan, pero no duplican ni archivan, los
cambios activos `academy-client-portal` y `hero-images-poster-redesign`.

## Impact

| Ámbito | Árbol y referencia observada | Uso |
| --- | --- | --- |
| ROOT | repositorio actual, `main`, `10b2d21`, con cambios previos | Web pública y backend MySQL legado |
| ACADEMY | `../juanfran-academy-client-portal`, `26b4c11`, con cambios previos | Portal privado y backend SQLite |

Los paths de hallazgos llevan un ámbito; no se debe aplicar un fix ACADEMY al
backend ROOT. La rama de integración deberá elegirse antes de implementar.
Los cambios previos de ambos árboles se preservan. Solo este nuevo directorio
OpenSpec es superficie de escritura de la auditoría.

## Non-goals

- No fusionar ramas, hacer commits, desplegar ni cambiar configuración de agentes.
- No tocar cuentas reales, secretos, bases de datos existentes o servicios externos.
- No inventar membresías, pagos, roles docentes o activación por correo:
  no son capacidades exigidas por los contratos actuales.
- No reemplazar el formulario de matrícula de Google, los controles nativos del
  vídeo ni la retención administrativa de materiales eliminados.
- No presentar una auditoría legal, certificación WCAG, medición Lighthouse o
  validación de producción que no se haya realizado.

## Risks and decisions

- Los agentes aportan candidatos, no verdades ni autoridad de entrega. El padre
  contrasta evidencia y documenta discrepancias.
- La política de privacidad requiere datos legales del titular; no se inventan.
- Pages es solo una demo: sus hipótesis se validan sobre una URL real antes de
  clasificar un fallo como incidente de producción.
- Se autoriza planificar autónomamente todas las fases documentales. `apply`,
  `verify` de implementación y `archive` no se ejecutan en esta tarea.

## Acceptance of this planning delivery

1. Todos los candidatos recibidos tienen disposición documentada y trazabilidad.
2. Cada corrección propuesta tiene escenario positivo y adverso verificable.
3. Hay evidencias de navegador y pruebas, diferenciando respuestas simuladas.
4. Los jueces revisan el mismo paquete congelado, sin ver la salida del otro.
5. OpenSpec valida el paquete; las tareas de implementación permanecen pendientes.
