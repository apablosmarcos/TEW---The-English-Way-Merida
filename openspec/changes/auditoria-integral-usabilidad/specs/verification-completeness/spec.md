# Verificación completa y evidencia

## Purpose

Evitar que comandos verdes oculten pruebas omitidas o solo comprueben texto fuente.

## ADDED Requirements

### Requirement: QA-R01 Todas las suites incluidas

El comando habitual backend MUST ejecutar todos los `src/**/*.test.ts` propios,
incluidos CLI, auth, usuarios, materiales, Markdown y limitador. Una prueba nueva
MUST incorporarse automáticamente o existir una comprobación de inventario que
falle al omitirla. Traza: API-06.

#### Scenario: Suite añadida
- GIVEN un test nuevo que falla deliberadamente en un subdirectorio de src
- WHEN se ejecuta el comando oficial en una copia temporal
- THEN MUST fallar y señalar ese test, sin depender de enumerarlo manualmente.

### Requirement: QA-R02 Comportamiento visible y datos aislados

Cada corrección MUST incluir RED y GREEN sobre el comportamiento afectado. Las
pruebas de fuente existentes pueden conservarse, pero MUST NOT sustituir pruebas
de interacción, HTTP o persistencia. Ninguna prueba MUST usar cuentas o datos reales.

#### Scenario: Editor y concurrencia
- GIVEN editor fallido o filtros con respuestas fuera de orden
- WHEN se ejecuta su regresión
- THEN MUST interactuar con el componente real y comprobar DOM/estado final, no solo buscar una cadena de código.

#### Scenario: Límite de integración
- GIVEN prueba de permisos, persistencia o migraciones
- WHEN se ejecuta
- THEN MUST usar backend real y SQLite temporal; una respuesta interceptada se etiqueta como simulación y no cuenta como autorización E2E.

### Requirement: QA-R03 Puerta de entrega por lote

Cada lote MUST documentar árbol, revisión/diff, escenarios ejecutados, resultado y
limitaciones; compilar y pasar pruebas pertinentes. Lotes UI MUST comprobar 320/375,
768 y 1280 px, teclado, estados de error y navegación. No se deben inventar métricas.

#### Scenario: Hipótesis no demostrada
- GIVEN un candidato H como emergentes, Pages o fuga al abortar
- WHEN no puede reproducirse en el entorno aplicable
- THEN MUST quedar como pendiente/descartado con razón y no provocar un fix especulativo.

#### Scenario: Entrega documental
- GIVEN este cambio sin implementación
- WHEN se consulta estado SDD
- THEN MUST conservar tareas de implementación sin marcar y no crear un verify-report de producto aprobado ni archivar.
