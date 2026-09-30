# Tareas futuras de implementación

Aplicación iniciada el 2026-09-20 por petición explícita del usuario. Los IDs son estables y no se renumeran. Cada fix sigue RED →
GREEN → caso adverso → refactor. El ejecutor registra comandos y resultados, no
marca por lectura. Presupuesto orientativo: 400 líneas por lote; subdividir si se supera.

## 0. Decisiones del responsable y selección de árbol

- [x] GOV-01 Confirmar por lote el contexto de la tabla de design.md (ROOT o ACADEMY), revisión actual y allowedEditRoots; habilitar cada ejecución independiente desde su árbol, sin inferir permiso sobre el otro ni fusionar ramas. Contextos iniciales documentados en apply-progress.md y transmitidos a cada ejecutor. <!-- sdd-owner: parent -->
- [x] GOV-02 Decidir continuidad del legado y distribución Pages; si se retiran, documentar no aplicabilidad de sus lotes. <!-- sdd-owner: parent --> Decisión del usuario 2026-09-30: el legado ROOT y la distribución Pages NO se mantienen; se retiran. PUB-108 no aplica.
- [x] GOV-03 Obtener identidad legal y decisión sobre consentimiento Maps y contenido multimedia. <!-- sdd-owner: parent --> Decisión del usuario 2026-09-30: no se añaden datos legales, consentimiento adicional ni subtítulos; se mantiene el estado actual. PRV-101 y PRV-103 no aplican.
- [x] GOV-04 Aprobar o descartar confirmación previa de reset propuesta en ACA-12. Incluida en la autorización de resolver las incidencias; cancelar sin petición y confirmar una sola operación con secreto efímero. <!-- sdd-owner: parent -->

## 1. Baseline y puerta de pruebas (L00/L01)

- [x] QA-01 En árbol elegido, registrar diff inicial y ejecutar pruebas/compilación para distinguir regresiones de fallos previos. Traza QA-R03. Evidencia: Baseline 2026-09-24: frontend 47/48, backend 54/55 (fallos previos identificados: helper usuarios y fixture CLI); informes tew-*-baseline.md.
- [x] QA-02 En `backend/package.json` ACADEMY, incluir todas las suites y demostrar en copia temporal que una suite nueva fallida hace fallar el comando oficial. Traza API-06/QA-R01. Evidencia: Script `node --test ... 'src/**/*.test.ts'`; copia temporal con suite fallida → exit 1 `GLOB_PROOF_CAPTURED`.
- [x] QA-03 En pruebas frontend del árbol elegido, preparar un recorrido de navegador aislado con respuestas controlables para UI y API real temporal para permisos. Traza QA-R02. Evidencia: Servidor QA aislado (dist + API real, SQLite/uploads sintéticos, 127.0.0.1:4387) y smoke con agent-browser; 14/14 PASS el 2026-09-24.

## 2. Web pública visible y operable (L02)

- [x] PUB-101 En Home/index, escribir regresión de CSS AOS disponible con JS fallido/lento; cambiar mejora progresiva hasta mantener contenido y CTA visibles. Traza PUB-01/PUB-R01. Evidencia: Test ACADEMY «public AOS content stays visible until the optional script initializes».
- [x] PUB-102 En Home, probar Enter/Tab/Escape del menú a 375 px y corregir orden de foco, nombre y aria-controls. Traza PUB-03/ACA-09/PUB-R02. Evidencia: Test ACADEMY «mobile navigation exposes state, target and Escape focus restoration».
- [x] PUB-103 En Home/Privacidad, añadir salto al contenido y probar foco real y cabecera fija. Traza PUB-04/PUB-R02. Evidencia: Test ACADEMY «public pages provide skip links and focusable main content» + «home anchor targets reserve space for the sticky header».

## 3. Integridad del editor (L03)

- [x] ACA-101 En editor ACADEMY, reproducir GET categorías/detalle 503/404 y bloquear mutaciones hasta hidratación válida, con reintento. Traza ACA-01/ACA-R01. Evidencia: Test ACADEMY «editor mutations require successful hydration»; navegador: carga 503 bloquea y reintento recupera.
- [x] ACA-102 En editor ACADEMY, probar fallo seguido de guardado exitoso y corregir limpieza de error/feedback preservando campos. Traza ACA-04/ACA-R02. Evidencia: Navegador: error de guardado conserva campos y reintento limpia error.
- [x] ACA-103 En estilos del editor, reproducir overflow de materiales a 320/375 px y corregir reflow, nombres largos y zoom 200 % sin ocultar acciones. Traza ACA-05/ACA-R03. Evidencia: Test ACADEMY «fixed hero wording wraps inside 320px and 375px cards»; navegador sin overflow 320/375/768/1280 y zoom CSS 200 %.

## 4. Credenciales y esquema (L04)

- [x] API-101 En CLI ACADEMY, probar longitudes 9/10 y rechazar contraseña insuficiente antes de preparar almacenamiento; mantener TTY y secreto oculto. Traza API-01/API-R01. Evidencia: Test ACADEMY «rejects passwords shorter than ten characters before preparing storage», «rejects non-TTY…», «restores terminal mode…».
- [x] API-102 En password ACADEMY, probar alfabeto/longitud y sustituir generación ambigua con RNG criptográfico sin sesgo y entropía documentada. Traza API-02/API-R01. Evidencia: `randomInt` de node:crypto (uniforme, sin sesgo), alfabeto sin glifos ambiguos: 57 símbolos × 10 = 58.3 bits. Test ACADEMY «generates ten-character temporary passwords without ambiguous glyphs».
- [x] API-103 En arranque/migraciones ACADEMY, probar users incompleta con versiones 0 y 1; rechazar ambas sin mutar esquema/datos ni cambiar versión, con error operativo y procedimiento de recuperación solo sobre copia autorizada. Traza API-03/API-R02. Evidencia: Test ACADEMY «rejects incompatible Academy schemas at versions zero and one without mutation» + «startup preserves a safe operator diagnosis…».

## 5. Última intención y materiales (L05)

- [x] ACA-104 En listado administrativo, invertir latencias de filtros y descartar/cancelar resultados obsoletos. Traza ACA-03/ACA-R02. Evidencia: Test ACADEMY «only the latest filter request may update the list».
- [x] ACA-105 En uploads, probar reselección del mismo archivo tras éxito y conservación tras error; sincronizar control nativo/modelo. Traza ACA-06/ACA-R04. Evidencia 2026-09-30 (agente pi tew-pi, revisado por el padre): `runAttachmentUpload` en admin-post-interactions.ts; test ejecutable de error conserva fichero, título y selector nativo. Mutación del padre (limpiar selector en catch) → test falla.
- [ ] ACA-106 En preview administrativo, reproducir con descarga lenta y bloqueo emergente en Chrome/Firefox/Safari; corregir solo si se demuestra, o documentar descarte. Traza ACA-10/ACA-R04. Parcial 2026-09-30: Chromium OK (blob PDF/PNG). Firefox: PNG navega a blob:; PDF queda en about:blank solo porque Playwright desactiva pdf.js (`pdfjs.disabled=true`) → descarte como defecto de la app, pendiente confirmación manual en Firefox de escritorio. Safari/WebKit sin dependencias del sistema: no probado.
- [x] ACA-107 En usuarios, probar doble reset y operaciones cruzadas; serializar mutación por cuenta con estado pendiente/error/reintento. Traza ACA-11/ACA-R05. Evidencia: Test ACADEMY «user mutations serialize per account while allowing different accounts» + «concurrent account resets preserve every temporary secret…».
- [x] ACA-108 Si GOV-04 se aprueba, añadir confirmación identificada de reset y probar cancelación sin petición y secreto efímero. Si no, registrar no aplicabilidad. Traza ACA-12/ACA-R06. Evidencia 2026-09-30 (tew-pi, revisado por el padre): `confirmMutation` con confirm inyectado; cancelar = 0 peticiones, confirmar = 1, mensaje nombra al usuario. Mutaciones del padre (saltar confirmación en componente / ignorar cancelar en helper) → tests fallan. Suite frontend 73/73, build PASS.

## 6. Sesión y contratos (L06)

- [x] ACA-109 En interceptor, reproducir 401 de base autorizada same/cross-origin y origen ajeno; corregir limpieza sin ampliar filtración de Bearer. Traza ACA-02/ACA-R07. Evidencia: Test ACADEMY «academy interceptor scopes Bearer credentials to the configured same- or cross-origin API base» + «…clears only unauthenticated academy sessions…».
- [x] ACA-110 En acceso, probar 429/Retry-After y presentar espera sin reintento automático ni enumeración de cuentas. Traza ACA-08/ACA-R07. Evidencia: Test ACADEMY «access presents Retry-After without automatic retries or account enumeration».
- [x] ACA-111 En configuración locale/presentación de Academy, registrar es-ES y política horaria, probar fechas en feed/detalle/admin sin alterar ISO persistido. Traza ACA-13/ACA-R08. Evidencia: Test ACADEMY «Academy dates use es-ES presentation in the browser local timezone»; navegador: fecha española en familia.
- [x] API-104 En rutas usuarios/tipos cliente, unificar error estructurado y actualizar consumidor/pruebas conjuntamente, comprobando consumidores externos. Traza API-04/API-R03. Evidencia: Test ACADEMY «academy administrator user routes enforce lifecycle boundaries…», «…errors use structured domain responses» y «frontend Academy error codes exactly match the backend structured contract». Sin consumidores externos conocidos.
- [x] API-105 En tipos de publicaciones, separar resumen/detalle y contrastar ambos contra respuestas HTTP reales. Traza API-07/API-R03. Evidencia: Test ACADEMY «post list and detail contracts remain distinct»; rutas HTTP reales en academy-routes.test.ts y recorridos de navegador.

## 7. Navegación y distribución (L07)

- [x] PUB-104 En rutas, probar URL inválida pública y Academy por rol; añadir recuperación sin reactivar rutas legacy. Traza PUB-08/ACA-07/PUB-R03. Evidencia: Test ACADEMY «unknown routes recover with a focused 404 page», «academy role guards return router UrlTrees…», «legacy admin routes… absent with no replacement redirect».
- [x] PUB-105 En contacto/pie, enlazar mailto y probar destinos sin enviar mensajes. Traza PUB-09/PUB-R04. Evidencia: Test ACADEMY «public contact emails are actionable».
- [x] PUB-106 En privacidad/home, probar título/canonical al navegar y recargar y actualizar metadatos por ruta. Traza PUB-11/PUB-R04. Evidencia: Test ACADEMY «navigation updates title, description and canonical metadata».
- [x] PUB-107 En CSS y scroll programático, probar prefers-reduced-motion y hacer navegación inmediata sin perder destino/foco. Traza PUB-10/PUB-R05. Evidencia: Test ACADEMY «reduced motion affects CSS and programmatic scrolling without changing destinations».
- [x] PUB-108 Tras GOV-02, validar URL/base real de Pages y corregir deep links/assets solo si la distribución sigue vigente. Traza PUB-07/PUB-R06. No aplica: Pages se retira (GOV-02).

## 8. Recursos y operación (L08)

- [x] API-106 En middleware SQLite, instrumentar aperturas/cierres en una prueba de aborto autenticado; corregir cierre idempotente si se confirma. Traza API-05/API-R04. Evidencia: Test ACADEMY «academy middleware closes its SQLite connection exactly once when an authenticated request aborts».
- [x] API-107 En rutas, inducir error de DB/archivo y registrar causa saneada/correlación sin PII ni secretos; mantener error cliente genérico. Traza API-08/API-R04. Evidencia: Test ACADEMY «academy storage failures return a generic safe error and a sanitized correlated log».

## 9. Contenido y consentimiento (L09, bloqueado por GOV-03)

- [x] PRV-101 Inspeccionar audio del vídeo y documentar decisión; si hay información sonora, incorporar subtítulos/transcripción y comprobar sincronización. Traza PUB-02/PRV-R03. No aplica por decisión GOV-03.
- [x] PRV-102 Registrar solicitudes Maps y aplicar activación/consentimiento aprobado con alternativa accesible y prueba de cero requests previas. Traza PUB-05/PRV-R01. Evidencia: Implementado: Test ACADEMY «Maps loads only after explicit activation and keeps an address fallback». Se mantiene así por GOV-03; sin conteo de requests en navegador.
- [x] PRV-103 Publicar datos legales facilitados y aprobados por titular, con enlaces desde el pie y comprobación de navegación. Traza PUB-06/PRV-R02. No aplica por decisión GOV-03.

## 10. Legado condicional (L10)

- [x] LEG-101 Si GOV-02 mantiene legado, probar crear/borrar/PATCH en MySQL aislado y filtrar deletedAt en actualización/lectura; de lo contrario documentar retirada sin portar endpoints. Traza API-09/LEG-R01. Aunque el legado se retira, se corrigió por petición del usuario: `updateLead` filtra `deletedAt IS NULL` en UPDATE y SELECT; PATCH sobre contacto borrado → 404 sin mutar. Regresión en `backend/src/routes/admin.test.ts` (estado inválido `closed` sustituido por `enrolled`, que enmascaraba el RED con 400). RED 200≠404 sin fix; GREEN 20/20 ×2 con MySQL 8.4 desechable (tmpfs, 127.0.0.1:33999); build PASS.

## 11. Aceptación por lote y cierre futuro

- [x] QA-04 Ejecutar invariantes HTTP reales de permisos, revocación, último admin, materiales retenidos y Markdown seguro después de sus lotes. Traza API-R05. Evidencia: Suite backend ACADEMY 59/59 (2026-09-30): permisos admin/familia, revocación, último admin, materiales retenidos y Markdown saneado.
- [x] QA-05 Ejecutar recorridos navegador con teclado, 320/375/768/1280 px, zoom y estados de carga/error/vacío/éxito; registrar limitaciones reales. Traza QA-R03. Evidencia 2026-09-30 (agente pi `tew-qa` con playwright-cli, revisado por el padre): F1 login+editor solo teclado con foco visible, A2 menú móvil (Enter/Escape/foco), A3 skip link, anchos 320-1280 y C8 sin overflow, C2/C3/C5 estados 503 y recuperación, 27 escenarios (26 PASS, G1 reclasificado como artefacto del entorno). Informe: ~/.hermes/cache/scratch/tew-e2e-20260930/. Limitación: sin WebKit ni lector de pantalla.
- [x] QA-06 Medir rendimiento únicamente sobre build de producción en entorno controlado y registrar métricas, sin inventar puntuación de esta auditoría. Traza QA-R03. Evidencia: Build de producción servido en entorno local controlado (2026-09-24): TTFB 14,6 ms, FCP 628 ms, DOMContentLoaded 428 ms, load 691 ms. Diagnóstico sin umbral acordado; no es puntuación Lighthouse.
- [ ] GOV-05 Solicitar revisión de los lotes implementados, verificar criterios, y solo después decidir integración y despliegue. <!-- sdd-owner: parent -->
- [ ] GOV-06 Ejecutar verify/archive únicamente con implementación completa y las puertas SDD satisfechas. <!-- sdd-owner: parent -->

## Next step

Primero GOV-01 para el lote concreto. Ejecutar L01 y L03 únicamente desde ACADEMY
con su contexto propio autorizado; L02 únicamente desde ROOT con su contexto propio.
QA-01 se repite por contexto; QA-02 es solo ACADEMY. No hay un «árbol aprobado»
universal para ambos lotes. Un port posterior de L02 a ACADEMY requiere nueva
selección explícita, contraste de su plantilla y regresiones en ese árbol.
Este documento no autoriza a saltar decisiones pendientes ni a marcar implementados
los hallazgos por estar especificados.
