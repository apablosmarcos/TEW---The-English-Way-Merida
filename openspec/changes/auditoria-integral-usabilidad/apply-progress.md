# Aplicación coordinada mediante Herdr y pi

## Autorización y alcance

2026-09-20: el usuario solicita implementar las incidencias usando sesiones pi
dirigidas por el padre mediante Herdr. Esto abre apply para los fixes técnicos,
sin commits, fusiones, despliegues, instalaciones ni modificaciones de datos reales.
Las decisiones legales que requieran identidad del titular no se inventan.

## Contextos y baseline

- ROOT: `/home/alvaro_pablos/mis_cosas/juanfran`, main, referencia observada
  `10b2d21`; Home TS/HTML/test ya modificados. `.omo/`, `--full-page` y este cambio
  OpenSpec ya estaban sin seguimiento.
- ACADEMY: `/home/alvaro_pablos/mis_cosas/juanfran-academy-client-portal`, rama
  `feat/academy-client-portal-42-retire-admin-test-path`, referencia `26b4c11`.
  Ya modificados README, backend package/app/test/env, Compose/Nginx y Home;
  ya existentes env.test.ts, vídeo y odd sin seguimiento.
- Baselines exactos del diff: `/tmp/opencode/fixes-baseline-root.diff` y
  `/tmp/opencode/fixes-baseline-academy.diff`.
- Cada agente arranca en su raíz autorizada. No hay escritura transversal ni
  selección única de árbol. OpenSpec solo lo actualiza el padre desde ROOT.

## Asignación de propiedad

| Agente | Raíz | Propiedad exclusiva inicial |
| --- | --- | --- |
| fix-publico | ROOT | frontend público, rutas, estilos, pruebas públicas |
| fix-editor | ACADEMY | admin-post-editor, admin-post-list, helpers y pruebas propias |
| fix-backend | ACADEMY | backend y sus pruebas/package; ningún fichero frontend |
| fix-sesiones | ACADEMY | core/academy, acceso, usuarios, main/locale, rutas/404 y sus pruebas; no editor/listado administrativo ni Home |
| fix-legado | ROOT | backend de contactos y pruebas MySQL aisladas; no frontend ni Academy |

El port del público a ACADEMY y el legado ROOT se asignarán en una fase posterior
sin compartir escritores. El padre mantiene navegador/pruebas E2E y revisión final.

## Decisiones de ejecución

- Conservar ambas aplicaciones existentes; no retirar legado ni Pages por suposición.
- La petición de resolver todas las incidencias autoriza el reset confirmado de
  ACA-12. Cancelar no envía petición; confirmar envía exactamente una; secreto
  efímero sin almacenamiento, logs ni captura de credenciales.
- Fechas: español de España, conservar zona local del navegador y timestamps ISO;
  no introducir una conversión silenciosa de datos.
- Maps: proponer activación explícita con dirección/enlace utilizable; no afirmar
  cumplimiento legal ni inventar datos del titular.
- Cada corrección se valida con regresión y se contrasta tras recibir el resultado.
  Un `done` del agente no completa una tarea por sí solo.
- Petición adicional del usuario: cerrar inmediatamente los agentes/paneles al
  terminar su trabajo y comprobar sus resultados; no mantenerlos inactivos consumiendo RAM.

## Estado

- Inicio: preflight nativo reconoce proposal/specs/design/tasks completos y apply ready.
- Implementación: **REANUDADA por petición explícita del usuario el 2026-09-24**.
  Hermes coordina como máximo dos agentes pi mediante Herdr. Se preserva el punto
  de parada histórico; la reanudación no implica que los fixes estén terminados.
- Baseline recuperado con dos agentes de lectura, cerrados después. Implementación
  desde ACADEMY: tew-fix (w1K:p4) tiene propiedad exclusiva de `frontend/`;
  tew-api (w1K:p5), de `backend/`. El padre conserva OpenSpec y QA integrado.
  Se autoriza explícitamente el port cuidadoso de las mejoras públicas ROOT a
  ACADEMY, sin copiar administración antigua ni sustituir a ciegas Home. ACADEMY
  es el candidato funcional de entrega; ROOT/Pages y legado no se retiran ni se
  integran mediante Git. Se preservan cambios previos, sin commits, fusiones,
  despliegues, instalaciones ni uso de datos reales.
- Baseline de agentes: ROOT frontend 27/27 y build verde; ACADEMY frontend 47/48
  (helper usuarios inexistente), backend 54/55 (fixture CLI de contraseña corta),
  builds verdes. Informes en scratch `tew-frontend-baseline.md` y
  `tew-backend-baseline.md`; no equivalen a aceptación integrada.
- QA padre: API real y SQLite/uploads sintéticos aislados, puerto 4387 y navegadores
  administrador/familia separados. Confirmado fallo adicional: API conserva
  categoryId pero select del editor muestra Sin categoría. Comunicado a frontend.
- Verificación/archivo: no autorizados por flags ready mientras haya tareas abiertas.

## Punto de parada del 2026-09-21

- Cerrados los cinco paneles de ejecución: fix-publico (p7), fix-editor (p8),
  fix-backend (p9), fix-sesiones (pA) y fix-legado (pB), en workspace w1B.
- Se conserva el trabajo parcial en disco, sin revertir ni hacer commits.
- ROOT: respecto al inventario inicial aparecen cambios en app.component/routes,
  privacidad, index y estilos; nuevos public-experience.ts y pages/not-found;
  cambios adicionales de Home y una modificación en backend/src/routes/admin.test.ts.
- ACADEMY: aparecen cambios en create-admin.ts/test y password.ts, un password.test.ts
  nuevo, cambios en admin-post-editor.ts/test, admin-post-list.test.ts y
  admin-users.test.ts, y el nuevo admin-post-interactions.ts. Se conservan además
  todos los cambios previos indicados en el baseline.
- Este inventario proviene de git status, no demuestra que un fix esté completo.
  No se recogieron informes finales completos ni se verificaron los cambios por
  el padre; puede haber pruebas RED o código incompleto. No marcar tareas técnicas
  como completadas basándose en este punto de parada.
- No se ejecutaron nuevas pruebas ni builds durante el cierre por petición del
  usuario. No hay aprobación de implementación, integración ni despliegue.
- La inspección de puertos no mostró los servidores de prueba 4200/4201/4301 ni
  Chromium 19222. Docker solo mostró contenedores de otros proyectos: no se tocaron.

## Siguiente paso, solo cuando el usuario lo solicite

Releer este documento, inspeccionar el diff de ambos árboles frente al baseline,
clasificar los cambios parciales y ejecutar primero pruebas/compilación. Recuperar
evidencia de los ejecutores si es necesaria y continuar por lote sin repetir ni
pisar el trabajo existente. Los snapshots en /tmp pueden no sobrevivir un reinicio;
el inventario y los cambios en los árboles son el punto de partida duradero.

## Decisiones y verificación del 2026-09-30

- GOV-02: el usuario decide retirar el legado ROOT y la demo Pages. PUB-108 no aplica.
  La retirada operativa (despublicar Pages, dejar de usar ROOT) la ejecuta el usuario;
  no se ha borrado código ni se ha tocado ninguna distribución.
- GOV-03: el usuario decide no incorporar datos legales, consentimiento adicional ni
  subtítulos; se mantiene lo actual (Maps ya carga solo tras activación en ACADEMY).
  PRV-101/PRV-103 no aplican.
- LEG-101 corregido en ROOT (ver tasks.md). Suite backend ROOT 20/20 con MySQL
  desechable; el contenedor se detuvo y eliminó al terminar (`--rm`).
- Re-ejecución de hoy: ACADEMY frontend 71/71, backend 59/59, `git diff --check` PASS;
  ROOT frontend 27/27. Las casillas técnicas de ACADEMY siguen sin marcar hasta
  contrastar cada ID con su evidencia.
- ACA-105/ACA-108 (2026-09-30): implementados por agente pi `tew-pi` vía Herdr
  (escritura solo en frontend/src/app/pages/academy). El padre revisó el diff,
  confirmó con tres mutaciones que los tests detectan la violación, ejecutó
  frontend 73/73 y build PASS, y cerró el panel w1V:p2.
- Revisión backend (GOV-05, parcial): sin bloqueantes. Avisos: la comprobación de
  esquema compara con la migración 1 y deberá ampliarse al añadir migraciones; el
  diagnóstico de arranque reduce el error «base más nueva que el binario» a `UNKNOWN`.
- E2E 2026-09-30: agente pi `tew-qa` recorrió 27 escenarios con playwright-cli (Chromium y
  Firefox 156) sobre servidor QA aislado; 26 PASS y G1 reclasificado por el padre como
  artefacto de Playwright Firefox (pdf.js desactivado). El padre contrastó la web pública en
  sesión propia, comprobó que no se modificaron repositorios y cerró paneles y servidor.
  QA-05 completado; ACA-106 queda a falta de Firefox de escritorio y Safari.
- Correcciones visuales 2026-09-30 (fuera de las tareas originales, a petición del usuario tras la
  revisión visual conjunta): agente pi `tew-fixvis` implementó F1–F10; el padre rechazó F1 (estilos
  locales no alcanzan el HTML de `[innerHTML]` por encapsulación de Angular) y F9 (Salir fuera de
  pantalla en admin a 375 px) y los aceptó en la ronda 2 tras comprobar en navegador: enlaces
  rgb(183,28,28) subrayados en detalle familiar y vista previa, cabecera privada 109 px sin elementos
  fuera de pantalla a 320/375. Frontend 80/80, backend 60/60, build PASS, diff --check PASS.
  Fuera de alcance: unificar botones público/privado, tarjeta de mapa, control nativo de fichero.
