# Revisión independiente y estado de entrega

## Alcance del veredicto

Judgment Day de Gentle Pi, solicitado por el usuario, se aplicó al **paquete
documental**, no a una versión corregida de la aplicación. Los hallazgos del
producto siguen abiertos. Esta revisión no autoriza commits, despliegue ni archive.

Se usaron cinco agentes pi reales a través de Herdr: tres auditores y dos jueces
nuevos e independientes. No se afirma diversidad de modelos/proveedores: se
respetó la configuración instalada sin seleccionar ni cambiar modelos.

## Protocolo y evidencia de congelación

- Skill canónica leída: `gentle-pi/skills/judgment-day/SKILL.md`, versión declarada 1.7.
- Ambos jueces recibieron esa misma ruta y la skill local
  `.agents/skills/frontend-design/SKILL.md`.
- Juez A: `juez-a`, panel `w1B:p5`; juez B: `juez-b`, panel `w1B:p6`.
- Target idéntico: proposal, exploration, design, tasks y las seis specs.
- Snapshot: `/tmp/opencode/jd-inicial.tar`, extraído en `/tmp/opencode/jd-inicial/`.
- SHA-256 del snapshot: `4c5e58fb8cbf61e6b920fd9c824640bf6a2705c47573368c23e8df57ab5535cb`.
- Una pasada ciega por juez; no leyeron las respuestas del otro; cero refutadores.
- Las respuestas fuera del viewport se recuperaron mediante el fallback de
  fichero de Herdr, sin repetir la revisión ni cambiar los resultados.

Huellas de respuestas iniciales:

| Salida | SHA-256 |
| --- | --- |
| juicio-a.json | `6c89eab9aef94e9139cf5bd55614ff3dade219fddc15633b16ab05e45df46239` |
| juicio-b.json | `062850283e94c53014f0246bbc693e6578c0a5f163c950cbfb6fe21547b58abf` |

Estos hashes identifican los bytes observados, no constituyen un recibo de
autoridad ni dependen de que sobreviva `/tmp`. La disposición se conserva debajo.

## Candidatos de los jueces y disposición

| ID | Severidad inicial | Hallazgo documental | Disposición |
| --- | --- | --- | --- |
| JD-A-001 | CRITICAL | Selección singular de árbol ambigua para L02 ROOT y L03 ACADEMY | Corregido con tabla de raíces/ramas por lote y secuencias separadas |
| JD-A-002 | CRITICAL | No se exigía rechazo de base incompatible ya marcada versión 1 | Corregido con validación en arranque, fail-closed sin mutar y escenario v1 |
| JD-B-001 | CRITICAL | Mismo problema de base v1 ya promovida | Duplicado conservado, misma corrección contrastada independientemente |
| JD-A-003 | WARNING | Preview exige comportamiento robusto aunque su supuesto fallo no está reproducido | Informativo: verificar comportamiento actual; no cambiar código si ya satisface el contrato |
| JD-A-004 | WARNING | Reset confirmado carece de escenario afirmativo detallado | Informativo pendiente de GOV-04; precisar antes de ejecutar ese lote condicional |
| JD-A-005 | WARNING | Legal/multimedia no detalla todas las ramas de datos aprobados y vídeo mudo | Informativo pendiente de GOV-03; no publicar ni implementar sin resolución |
| JD-B-002 | WARNING | Secuencia entre dos árboles poco clara | Cubierto por corrección de JD-A-001; no fue motivo independiente de cambios |
| JD-B-003 | WARNING | Falta recorrido afirmativo de reset | Duplicado de JD-A-004, conserva su condición |
| JD-B-004 | WARNING | Ramas legales/multimedia incompletas | Duplicado de JD-A-005, conserva su condición |
| JD-B-005 | WARNING | QA-06 no define umbral de rendimiento para aprobación | Informativo: la medición es diagnóstica; no puede usarse como gate numérico sin acordar antes métrica/umbral |

Las advertencias son información de una sola pasada, no se convirtieron en
un bucle de fixes ni en tareas automáticas nuevas. Limitan la preparación de los
lotes condicionales; no invalidan las correcciones P1 verificables del editor/AOS.

## Corrección documental y rejuicio

Ronda usada: **1 de un máximo de 2**. Solo se autorizaron los tres IDs CRITICAL,
que representan dos problemas distintos. Superficies: `design.md`, `tasks.md`
y `specs/academy-contract-hardening/spec.md`.

Diff exacto: `/tmp/opencode/correccion-r1.diff`.
SHA-256: `293d1ab1ac0cf142877b7fb7f44555c80c8aae5212d37121b55a7c605a916a75`.

Cada juez recibió sus filas congeladas exactas y el diff, sin nueva exploración.
Resultados leídos por el padre:

```json
{"resolutions":[{"id":"JD-A-001","outcome":"verified"},{"id":"JD-A-002","outcome":"verified"}]}
```

```json
{"resolutions":[{"id":"JD-B-001","outcome":"verified"}]}
```

No sobreviven candidatos severos de la revisión documental. Las advertencias
anteriores siguen explícitas. La validación OpenSpec estricta del paquete completo
ha terminado con `Change 'auditoria-integral-usabilidad' is valid`.

**JUDGMENT: APPROVED** para este paquete documental, con advertencias informativas
y decisiones pendientes expresamente registradas. No implica aprobación de la aplicación.

## Estado SDD y siguiente acción

- Proposal, seis specs, design y tasks presentes.
- 26 requisitos y 45 escenarios tras la corrección; 42 casillas futuras, todas pendientes.
- Sin apply-progress ni verify-report de implementación, sin archive.
- El motor nativo instalado enumera 42 pendientes y recomienda `apply`; también
  imprime `verify`/`archive: ready`. Esos flags no sustituyen las condiciones
  normativas: no se verifica ni archiva implementación con tareas pendientes.
- Primer trabajo: GOV-01 por lote; L01/L03 desde ACADEMY y L02 desde ROOT,
  respetando sus contextos independientes. Legal/reset requieren decisiones previas.

## Verificaciones y límites

Los resultados de navegador y ejecución están en `exploration.md`. Todas las
pruebas ejecutadas pasaron (19 ROOT frontend, 50 ACADEMY frontend, 53 ACADEMY
backend); ambas compilaciones completas pasaron. Las suites de frontend no
equivalen a pruebas DOM completas. Se recorrieron flujos reales con API/SQLite
temporal y se separaron las inyecciones de error simuladas.

No hay servidor LSP para Markdown instalado; sus diagnósticos no pudieron
ejecutarse. Se utiliza validación OpenSpec estricta y lectura estructural como
comprobación documental, sin afirmar «LSP limpio».

La auditoría no certifica producción, MySQL legado, Safari/Firefox, lectores de
pantalla, vídeo hablado, legales ni puntuaciones de rendimiento. La siguiente
implementación debe resolver las limitaciones correspondientes a cada lote.
