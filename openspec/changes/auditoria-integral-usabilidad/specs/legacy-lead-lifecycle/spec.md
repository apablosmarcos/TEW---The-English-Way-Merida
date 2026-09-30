# Integridad del ciclo de contactos legado

## Purpose

Tratar API-09 únicamente en ROOT si el producto MySQL legado sigue soportado.
Este dominio no autoriza restaurar endpoints ni UI legacy en ACADEMY.

## ADDED Requirements

### Requirement: LEG-R01 Inmutabilidad del contacto eliminado

Si el producto legado continúa activo, una actualización MUST limitarse a
contactos no eliminados. El recurso eliminado MUST responder 404 sin modificar
datos ni reaparecer en listados.

#### Scenario: Borrado seguido de edición
- GIVEN contacto sintético creado y posteriormente eliminado en MySQL aislado
- WHEN se solicita PATCH por su ID
- THEN MUST responder 404, conservar la fila sin cambios adicionales y permanecer ausente del listado.

#### Scenario: Legado retirado
- GIVEN decisión de retirar el producto legado y migrar al portal Academy
- WHEN se prepara la integración
- THEN el lote MUST cerrarse como no aplicable con evidencia de retirada, sin introducir `/api/leads` o `/admin` en Academy.
