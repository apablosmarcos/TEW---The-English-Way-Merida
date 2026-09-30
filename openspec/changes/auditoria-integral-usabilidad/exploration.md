# Exploración, cobertura y registro de hallazgos

Fecha: 2026-09-20. Estado: candidatos contrastados para planificación, sin fixes.

## Método y autoría

Herdr confirmó `HERDR_ENV=1`; se consultaron `herdr --skill` y su ayuda instalada.
Tres sesiones pi independientes hicieron inspección de solo lectura:

| Agente | Panel devuelto por Herdr | Encargo |
| --- | --- | --- |
| auditor-publico | w1B:p2 | Público, navegación, accesibilidad, privacidad, demo |
| auditor-academia | w1B:p3 | Acceso, familia, administración, estados e interacción |
| auditor-contratos | w1B:p4 | API, permisos, datos, errores y pruebas |

El padre ejecutó navegador Chromium mediante Playwright, pruebas y compilaciones.
Los informes completos de los agentes se recuperaron a `/tmp/opencode/informe-*.md`
porque Herdr solo devolvía el último viewport de pi. Sus conclusiones están
consolidadas aquí; esos ficheros temporales no son requisitos para retomar el trabajo.

## Baselines y límites

ROOT = repo actual `main@10b2d21`. ACADEMY = árbol existente
`../juanfran-academy-client-portal@26b4c11`.
Ambos tenían cambios sin confirmar; la auditoría corresponde al contenido de
trabajo, no exclusivamente al commit. No se considera fallo la ausencia de Academy
en ROOT. Las mejoras posteriores deberán revalidarse sobre el árbol seleccionado.

El grafo ROOT estaba indexado y la cobertura de siete paths citados no reportó
huecos. Esto es una señal best-effort, no prueba de completitud. Los agentes
leyeron directamente fuentes y pruebas fuera de cobertura, particularmente en
ACADEMY. El inventario no certifica cada dependencia externa ni cada combinación.

## Clasificación

- **R**: reproducido por el padre en navegador o ejecución determinista.
- **S**: evidencia estática de una discrepancia concreta; falta reproducción real.
- **H**: hipótesis condicionada al entorno, contenido o política; no vender como bug probado.
- **D**: decisión de producto/operación, no defecto automático.
- P1: resolver antes de liberar el flujo afectado; P2: siguiente lote; P3: mejora.
  Ninguna clasificación implica un exploit probado ni una incidencia en producción.

## Web pública: ROOT

| ID | Prioridad/clase | Evidencia exacta | Impacto y disposición |
| --- | --- | --- | --- |
| PUB-01 | P1/R | `frontend/src/index.html:13`; `frontend/src/app/pages/home/home.component.ts:1401` | Bloquear solo `aos.js` deja 19 elementos `data-aos` con opacidad 0, incluido contacto. Corrección obligatoria de mejora progresiva. |
| PUB-02 | P2/H | `frontend/src/app/pages/home/home.component.html:220` | No hay pista de subtítulos. No se ha escuchado el vídeo: comprobar voz/sonido relevante antes de afirmar incumplimiento; transcripción y subtítulos si procede. |
| PUB-03 | P2/R | `frontend/src/app/pages/home/home.component.html:15` | A 375 px, abrir menú con Enter y pulsar Tab salta a «Solicitar matrícula», no al menú. Nombre sigue «Abrir». Vinculado a ACA-09. |
| PUB-04 | P2/S | `frontend/src/app/pages/home/home.component.html:1`; `frontend/src/app/pages/privacidad/privacidad.component.ts:6` | No hay salto al contenido en las páginas públicas; añadirlo sin modificar el que ya existe en Academy. |
| PUB-05 | P2/H | `frontend/src/app/pages/home/home.component.html:253` | Iframe Maps directo, sin activación previa. Registrar solicitudes y someter necesidad de consentimiento a decisión legal; no afirmar cookies concretas no medidas. |
| PUB-06 | P2/D | `frontend/src/app/pages/privacidad/privacidad.component.ts:25` | Titular expresado como marca; faltan datos fiscales en lo inspeccionado. Solicitar datos validados, no inventarlos ni certificar cumplimiento legal. |
| PUB-07 | P2/H | `frontend/src/index.html:6`; `README.md:43` | Base raíz y navegación profunda pueden fallar en Pages bajo subruta. URL y configuración desplegadas no verificadas. |
| PUB-08 | P2/R | `frontend/src/app/app.routes.ts:8` | `/ruta-inexistente` deja body sin contenido útil. Vinculado a ACA-07; no restaurar rutas administrativas retiradas. |
| PUB-09 | P3/S | `frontend/src/app/pages/home/home.component.html:238` | Correo anunciado como canal pero no enlazado; convertirlo en `mailto:` sin enviar mensajes de prueba. |
| PUB-10 | P2/R | `frontend/src/styles.css:19`; `frontend/src/app/pages/home/home.component.ts:1427` | Con movimiento reducido, `scrollBehavior` sigue `smooth`; cubrir CSS y desplazamiento programático. |
| PUB-11 | P3/R | `frontend/src/index.html:5`; `frontend/src/app/pages/privacidad/privacidad.component.ts:6` | Privacidad conserva título de academia y canonical `https://tewacademy.es`. Metadatos específicos y restauración al volver. |

## Academia: ACADEMY

| ID | Prioridad/clase | Evidencia exacta | Impacto y disposición |
| --- | --- | --- | --- |
| ACA-01 | P1/R | `frontend/src/app/pages/academy/admin-post-editor.component.ts:18`; `:62` | Con sesión y 503 de categorías simulados, aparecen error, editor vacío y guardar/ocultar/eliminar habilitados. Bloquear mutaciones hasta hidratación válida. |
| ACA-02 | P2/S | `frontend/src/app/core/academy/academy-auth.interceptor.ts:8` | Solo intercepta mismo origen; API configurada cross-origin recibe Bearer manual pero sus 401 no disparan limpieza central. No ampliar credenciales a orígenes arbitrarios. |
| ACA-03 | P2/S | `frontend/src/app/pages/academy/admin-post-list.component.ts:70` | Respuestas de filtros sin cancelación/generación pueden sobrescribir la selección reciente. Reproducir con latencias invertidas. |
| ACA-04 | P2/S | `frontend/src/app/pages/academy/admin-post-editor.component.ts:70` | Error de mutación no se limpia al reintentar/guardar con éxito; feedback contradictorio. |
| ACA-05 | P1/R | `frontend/src/app/pages/academy/admin-post-editor.component.ts:24` | Navegador a 375 px produce documento de 735 px; área de materiales ensancha el formulario. Reflow sin ocultar acciones. |
| ACA-06 | P2/S | `frontend/src/app/pages/academy/admin-post-editor.component.ts:111` | Tras upload se limpia el modelo pero no el control file; reseleccionar el mismo archivo puede no emitir change. |
| ACA-07 | P2/S | `frontend/src/app/app.routes.ts:23` | Sin ruta de recuperación Academy. Agrupar con PUB-08, validar roles y enlaces antiguos. |
| ACA-08 | P2/S | `frontend/src/app/pages/academy/access.component.ts:45`; `backend/src/routes/academy-auth.ts:13` | 429/Retry-After se muestra como error genérico; informar espera sin enumerar cuentas. |
| ACA-09 | P3/S | `frontend/src/app/pages/home/home.component.html:39` | Nombre accesible del menú no cambia al abrir; agrupar con PUB-03. |
| ACA-10 | P2/H | `frontend/src/app/pages/academy/admin-post-editor.component.ts:127` | Preview abre enlace tras await; comprobar bloqueo emergente en navegadores reales antes de cambiarlo. La familia ya abre ventana antes del await. |
| ACA-11 | P2/S | `frontend/src/app/pages/academy/admin-users.component.ts:94` | Sin estado pendiente por usuario; doble reset/acciones cruzadas pueden dejar contraseña o estado obsoletos. |
| ACA-12 | P3/D | `frontend/src/app/pages/academy/admin-users.component.ts:94` | Reset inmediato sin confirmación. Propuesta: confirmación identificando cuenta y efecto; no es vulnerabilidad probada. |
| ACA-13 | P2/R | `frontend/src/app/pages/academy/parent-post-list.component.ts`; `frontend/src/app/pages/academy/post-detail.component.ts` | En recorrido real de familia, fechas muestran «September 20, 2026» dentro de interfaz española. Configurar locale español para presentación sin alterar ISO persistido. |

## Backend y verificación

| ID | Ámbito, prioridad/clase | Evidencia exacta | Impacto y disposición |
| --- | --- | --- | --- |
| API-01 | ACADEMY P1/S | `backend/src/cli/create-admin.ts:39`; `backend/src/cli/create-admin.test.ts:104` | Bootstrap acepta contraseña no vacía de menos de 10 caracteres; alinear política de alta/recuperación. |
| API-02 | ACADEMY P2/S | `backend/src/modules/academy/password.ts:9` | Base64URL incluye glifos ambiguos; contrastar contrato de entrega manual y mantener entropía con alfabeto explícito. |
| API-03 | ACADEMY P1/R | `backend/src/modules/storage/academy-migrations.ts:12`; `:115` | Reproducción en SQLite en memoria: users con solo id, normalizedUsername y deletedAt acaba con user_version=1 sin crear las columnas restantes. No toda tabla incompleta pasa: los índices pueden hacer rollback. |
| API-04 | ACADEMY P2/S | `backend/src/routes/academy-admin-users.ts:116`; `frontend/src/app/core/academy/academy-types.ts:17` | Usuarios usa `error` cadena; resto usa objeto code/message. El cliente actual lo adapta, por lo que no se afirma fallo visible actual. Corregir contrato conjuntamente. |
| API-05 | ACADEMY P2/H | `backend/src/routes/academy-middleware.ts:31` | Cierre SQLite solo en finish; probar conexión abortada y cierre exactamente una vez antes de atribuir fuga medida. |
| API-06 | ACADEMY P1/R | `backend/package.json:9` | Script enumera cinco archivos y omite suites existentes de auth, usuarios, adjuntos, rate limit, markdown y CLI. Ejecución explícita de todos: 53 pruebas pasan; omisión sigue abierta. |
| API-07 | ACADEMY P3/S | `backend/src/modules/academy/publication-service.ts:42`; `frontend/src/app/core/academy/academy-types.ts:52` | Lista tipada como detalle con attachments obligatorios que no entrega. Usar resumen real; no añadir N+1 para satisfacer tipo incorrecto. |
| API-08 | ACADEMY P2/S | `backend/src/routes/academy-middleware.ts:78`; `backend/src/routes/academy-posts.ts:65` | 500 genérico sin registro de causa: deficiencia operativa, no fuga al cliente. Instrumentar sin secretos/datos personales. |
| API-09 | ROOT P2/S | `backend/src/modules/leads/lead-repository.ts:26` | Update por ID sin filtrar deletedAt permite editar eliminado. Solo abordar si se mantiene legado; no resucitarlo en Academy. |

Son 32 candidatos originales de agentes más ACA-13 descubierto en navegador, con dos parejas duplicadas entre superficies
(PUB-03/ACA-09 y PUB-08/ACA-07). No equivalen a 33 defectos reproducidos.

## Controles que deben preservarse

- Academy usa usuario individual, roles parent/admin y cambio obligatorio inicial.
- Guards y servidor comprueban rol y estado; los clientes no son autoridad.
- Reset/cambio de contraseña, desactivación y eliminación revocan sesiones.
- El último administrador activo está protegido dentro de una transacción.
- Familias solo leen publicaciones visibles y adjuntos activos; administradores
  pueden inspeccionar eliminados conforme al contrato. No es una filtración.
- Markdown neutraliza HTML/protocolos peligrosos según las pruebas existentes.
- El vídeo se inicia con controles nativos, sin autoplay; matrícula usa Google Forms.
- No hay requisito actual de membresías o activación por token; su ausencia no es bug.

## Evidencia ejecutada por el padre

| Verificación | Resultado |
| --- | --- |
| ROOT frontend, `pnpm --filter tew-frontend test` | 19/19 pasan |
| ACADEMY frontend, mismo comando en su árbol | 50/50 pasan |
| ACADEMY backend, `pnpm --filter tew-backend exec node --test --experimental-strip-types 'src/**/*.test.ts'` | 53/53 pasan, SQLite temporal de las pruebas |
| `pnpm --recursive run build`, en ambos árboles | backend y frontend compilan en ambos |
| Público móvil, menú con teclado | fallo PUB-03 reproducido |
| Ruta inválida y privacidad | PUB-08/PUB-11 reproducidos |
| Movimiento reducido | PUB-10 reproducido |
| Solo script AOS bloqueado, CSS disponible | 19 elementos con opacity 0; PUB-01 reproducido |
| Editor con sesión simulada y categorías 503 | ACA-01 y ACA-05 reproducidos; no es E2E de autenticación real |
| Migración con users parcial en SQLite en memoria | API-03 reproducido: versión 1 y solo tres columnas, sin esquema válido |
| API Academy aislada en 4301, SQLite/uploads bajo `/tmp/opencode/academy-qa-<pid>` | health 200; cuentas sintéticas, sin abrir bases del usuario |
| Navegador con frontend 4201 y apiBaseUrl de prueba 4301 | Login incorrecto comunica error; login admin correcto abre publicaciones; crear, ocultar y mostrar publicación funciona |
| Alta familiar real desde administración | HTTP 201, primer login exige cambio; cambio vuelve a acceso y nuevo login abre feed/detalle con Markdown |
| Editor con datos reales de la API temporal | Reconfirma ACA-05: viewport 375 y scrollWidth 735 |
| Feed/detalle con datos reales sintéticos | ACA-13: fechas en inglés dentro de pantalla española |
| Público a 375/768/1280 px | sin overflow horizontal de documento en lo medido |

Capturas temporales inspeccionadas: `/tmp/opencode/publico-375.png`,
`/tmp/opencode/editor-error-375.png`; además se capturaron acceso y degradación AOS.
Las capturas no sustituyen las instrucciones y resultados reproducibles de esta tabla.

La base de prueba se creó con servicios existentes compilados; solo la respuesta
de configuración del navegador se sustituyó para apuntar a esa API local real.
Esto verifica flujos con Express/SQLite, no la topología de proxy de producción.
El intento adicional de desactivar la cuenta desde UI no llegó a ejecutarse por
timeout del botón de cierre del aviso temporal: no se cuenta como prueba de revocación E2E.

No se ejecutó MySQL real del legado, producción, formularios externos, pruebas
de correo/Telegram, lector de pantalla, Safari/Firefox, auditoría legal ni
Lighthouse. No se deben publicar puntuaciones de rendimiento o cumplimiento.

## Próximo paso

Completar specs/design/tasks y juicio ciego del paquete. La implementación deberá
seleccionar árbol por lote, bloquear hipótesis hasta su prueba y mantener todos
los checks pendientes hasta verificar comportamiento real.
