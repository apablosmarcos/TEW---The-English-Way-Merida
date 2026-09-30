# Auditoría integral de la aplicación

**Entrega: análisis y planificación SDD, no correcciones aplicadas.**

## Por dónde empezar

1. [Hallazgos y evidencias](exploration.md): 33 candidatos, ámbito ROOT/ACADEMY,
   prioridad y separación entre reproducción, fuente, hipótesis y decisión.
2. [Propuesta y límites](proposal.md): qué cambia y qué no debe tocarse.
3. [Diseño por lotes](design.md): contexto de ejecución de cada árbol, alternativas,
   dependencias, reversión y puertas de aceptación.
4. [Tareas pendientes](tasks.md): 42 casillas con IDs estables y trazabilidad.
5. [Juicio independiente](revision.md): dos jueces ciegos, correcciones documentales,
   advertencias residuales y evidencia de rejuicio.

## Especificaciones

| Dominio | Documento | Requisitos |
| --- | --- | --- |
| Experiencia pública | [spec](specs/public-experience-quality/spec.md) | 6 |
| Interacción Academy | [spec](specs/academy-interaction-quality/spec.md) | 8 |
| Contratos y persistencia | [spec](specs/academy-contract-hardening/spec.md) | 5 |
| Cobertura de verificación | [spec](specs/verification-completeness/spec.md) | 3 |
| Privacidad y multimedia | [spec](specs/privacy-media-readiness/spec.md) | 3 |
| Contactos legado condicional | [spec](specs/legacy-lead-lifecycle/spec.md) | 1 |

Total: **26 requisitos y 45 escenarios**. Los requisitos condicionados no
autorizan inventar datos legales o corregir hipótesis sin reproducirlas.

## Prioridades comprobadas

- PUB-01: el fallo de AOS oculta contenido y CTA.
- ACA-01: un GET fallido deja operativo un editor vacío.
- ACA-05: editor de 735 px de ancho en viewport de 375 px.
- API-03: SQLite incompatible puede etiquetarse como migrado.
- API-06: el comando backend normal deja suites de seguridad fuera.

También se documentan teclado, rutas vacías, errores persistentes, carreras,
materiales, credenciales, contratos, internacionalización, privacidad y operación.

## Consultar y validar

Desde la raíz actual:

```sh
openspec show auditoria-integral-usabilidad
openspec validate auditoria-integral-usabilidad --strict --no-interactive
```

No ejecutar todos los lotes desde esta raíz: Academy tiene su propio árbol y
contexto. Consultar primero la tabla de `design.md` y GOV-01 de `tasks.md`.
