# Diseño de correcciones y estrategia de entrega

## Estado y contexto de acción

Planificación autorizada por petición explícita de SDD y autonomía. Almacén:
OpenSpec. Modo: automático para proposal/specs/design/tasks, no para despliegue.
Strict TDD procede de `openspec/config.yaml`; presupuesto orientativo de revisión:
400 líneas por lote. Solo se escriben documentos en este cambio.

El estado nativo Gentle AI se consulta con:

```sh
~/.pi/agent/npm/node_modules/gentle-pi/.gentle-ai/v3.1.0/gentle-ai sdd-status auditoria-integral-usabilidad --json
```

El ejecutor posterior MUST volver a resolver el binario instalado y no depender
indefinidamente de esta versión. No hay `openspec/status.sh` en este repositorio.
El estado `ready` de un motor describe artefactos, no permiso para actuar sobre
otro árbol. El árbol ACADEMY está fuera de la raíz de edición actual: antes de
implementar allí hay que seleccionar su contexto propio o integrar explícitamente
la rama; esta auditoría no hace ninguna de ambas cosas.

### Contexto de ejecución obligatorio por lote

No existe una selección global ROOT/ACADEMY que habilite todos los lotes. Esta
tabla fija el destino; GOV-01 comprueba revisión y autorización antes de cada lote,
no decide silenciosamente trasladar código entre ramas.

| Lotes | Raíz de ejecución/escritura futura | Rama observada | Regla |
| --- | --- | --- | --- |
| L01, L03, L04, L05, L06, L08 | `../juanfran-academy-client-portal` (ACADEMY) | `feat/academy-client-portal-42-retire-admin-test-path` | Lanzar ejecutor desde ACADEMY con allowedEditRoots de ACADEMY; este padre ROOT no escribe allí |
| L02, L07 | repo actual (ROOT) | `main` | Corregir primero la superficie ROOT auditada; no introducir componentes Academy ausentes |
| L09 | ROOT; ACADEMY solo en port explícito separado | La correspondiente a cada ejecución | Datos legales aprobados y evidencia por plantilla |
| L10 | ROOT exclusivamente | `main` | Solo si GOV-02 mantiene legado; nunca copiar a ACADEMY |
| L00 y aceptación | El mismo árbol que el lote que se prepara | Revalidar HEAD y diff | No compartir baseline ni resultado entre árboles |

Si cambia una rama, se integra Academy en ROOT o desaparece un árbol, el padre
actualiza esta tabla y vuelve a contrastar hallazgos antes de lanzar trabajo.
No ejecutar una receta ACADEMY en ROOT porque sus rutas relativas coincidan.
Los documentos en ROOT son contexto de lectura para un ejecutor ACADEMY;
actualizarlos corresponde al controlador con autoridad ROOT. Ningún lote exige
un permiso de escritura simultáneo sobre los dos árboles.

## Alternativas y decisiones

| Decisión | Elegida | Descartada y motivo |
| --- | --- | --- |
| Organización | Un cambio paraguas con seis specs y lotes pequeños | Un único megafix: difumina prioridad, rollback y revisión |
| Evidencia | Fuente + navegador + suites reales; simulaciones etiquetadas | Tratar output de agentes como prueba definitiva |
| UI | Corregir estados y reflow conservando lenguaje TEW | Rediseño global sin contrato visual ni métricas |
| AOS | Contenido visible por defecto, animación opt-in | Quitar contenido o ocultarlo hasta que cargue CDN |
| Editor | Estado explícito de hidratación separado de errores de mutación | Usar un único error para ocultar formulario también tras un guardado fallido |
| Concurrencia | Cancelar petición antigua o ignorar por generación | Introducir store general o framework de estados para un único listado |
| HTTP | Unificar errores con helper existente y tipos resumen | Añadir compatibilidad indefinida o adjuntos N+1 en lista |
| Migración | Rechazar esquema propio incompatible antes de promover versión | Borrar/recrear tablas del usuario o aceptar silenciosamente |
| Legal | Requisitos condicionados a decisión y datos reales | Inventar NIF, cookies observadas o certificación |

## Arquitectura afectada

Público: `index.html`/estilos globales → Home/Privacidad → Router.
Academy: configuración → SessionStore/interceptor/guards → componentes →
AcademyApiService → routers Express → servicios → repositorios SQLite/archivos.

### Público

- PUB-R01: cargar animación de forma progresiva con fallback visible incluso si
  el CSS llega y el script no. No temporizador que deje contenido oculto varios segundos.
- PUB-R02: reorganizar flujo de foco o gestionarlo explícitamente; conservar
  enlaces nativos, aria-expanded y cierre móvil tras navegar. Skip link a `main`.
- PUB-R03: recuperación de rutas desconocidas con destino seguro, título y foco.
  En Academy no redirigir `/admin` a una funcionalidad retirada.
- PUB-R04/05: metadatos por ruta y política de scroll compartida con media query.
- PUB-R06: elegir base/fallback para la URL de demo existente, no suponer subruta.

### Academia

- Separar `loadError`/`loadState` de `mutationError`. Un fallo de guardado debe
  conservar campos y permitir reintento; un fallo de GET no debe habilitar un editor vacío.
- En filtros, capturar parámetros y aceptar únicamente la respuesta de la
  generación vigente. La API sigue siendo fuente de autoridad.
- En editor/materiales, `min-width:0`, límites de ancho y apilado bajo breakpoint
  dentro del componente, sin `overflow-x:hidden` que recorte acciones.
- Limpiar el input file nativo solo tras éxito; el error conserva selección.
- Para preview, primero demostrar el fallo en motores afectados; si hace falta,
  reservar ventana durante el gesto y cerrarla ante denegación, conservando la
  descarga Blob autenticada y revocación de object URLs.
- Bloqueo por usuario/mutación, no bloqueo global innecesario de todos los usuarios.
- Interceptor: comparar origen y prefijo exactos de la base autorizada. Nunca
  enviar un Bearer por coincidir solo la subcadena `/academy` en una URL externa.
- 429: procesar Retry-After y mantener error de autenticación genérico para 401.
- Fechas: registrar locale es-ES en Angular y definir si presentación usa zona
  Europe/Madrid o local del usuario antes de fijar la prueba; conservar ISO del servidor.

### Servidor

- Reutilizar política mínima de contraseña en el límite CLI y probar antes de
  `ensureStorageDirectories`. Elegir alfabeto de contraseña temporal compatible
  con longitud/entropía requeridas, sin `Math.random` ni módulo sesgado.
- Detectar esquema homónimo incompatible mediante validación del esquema esperado,
  independientemente de user_version. Con versión 0, rechazar antes de promover;
  con versión 1 ya mal promovida, rechazar el arranque antes de habilitar rutas.
  En ambos casos conservar versión, definición y filas; no bajar a 0, sobrescribir,
  reconstruir ni «reparar» automáticamente. Mantener rollback y datos legacy ajenos.
  Emitir error saneado al operador con indicación de copia/recuperación manual.
  Recuperación: detener escritor, tomar copia consistente verificada, inspeccionar
  esa copia y pedir autorización explícita para el procedimiento concreto. La
  corrección de arranque no incluye una migración de rescate destructiva.
- `academyErrorBody` será el formato único. Cambiar rutas, tipos y pruebas del
  mismo lote; comprobar consumidores externos antes de retirar el adaptador actual.
- Cerrar conexión con función idempotente enlazada a finish/close, si la prueba de
  aborto confirma omisión. No cerrar anticipadamente recursos necesarios al stream.
- Logging de servidor saneado con correlación. Nunca volcar req/res, cabeceras de
  autorización, campos de formulario, contraseñas o rutas privadas de almacenamiento.

## Priorización y dependencias

| Lote | Alcance | Depende de | Salida comprobable | Presupuesto estimado |
| --- | --- | --- | --- | --- |
| L00 | Árbol, baseline y gates | Decisión de integración | Contexto de edición seguro | 0–100 líneas |
| L01 | Suite backend completa | L00 | Nuevo test no puede quedar fuera | 20–120 |
| L02 | AOS y menú accesible | L00 | Contenido visible sin CDN; teclado correcto | 100–250 |
| L03 | Editor: hidratación, errores, reflow | L00 | No muta tras error; 320 px utilizable | 150–350 |
| L04 | Credenciales y migración | L01 | Política mínima y rechazo sin pérdida | 150–350 |
| L05 | Concurrencia y materiales | L03 | Última intención; upload/reset sin dobles operaciones | 150–350 |
| L06 | Sesión y contrato HTTP | L01 | 401/429 y JSON coherentes | 150–350 |
| L07 | Navegación pública y demo | L02 + destino Pages | 404/metadatos/scroll/contacto | 100–300 |
| L08 | Recursos y diagnóstico | L01 + prueba de aborto | Cierre único y logs saneados | 100–250 |
| L09 | Legal y multimedia | Decisiones de titular/contenido | Aprobación y pruebas de terceros/subtítulos | No estimar contenido sin datos |
| L10 | Legado | Decisión de mantenerlo + MySQL aislado | PATCH tras delete devuelve 404 | 50–180 |

Los tamaños son previsiones, no medidas. Si un lote excede 400 líneas efectivas,
subdividirlo antes de implementar sin reutilizar IDs. No combinar migración y
retoque cosmético en una misma revisión.

## Verificación, reversión y cierre

- Baseline: 19 tests frontend ROOT, 50 frontend ACADEMY y 53 backend ACADEMY
  ejecutando todos los ficheros; ambos árboles compilan. No son métricas de cobertura.
- RED → GREEN → prueba adversa → refactor mínimo → misma regresión; pruebas
  de integración SQLite temporales, navegador para interacción y MySQL aislado para legado.
- Conservar pruebas de permisos/revocación/retención que ya pasan.
- Capturar una evidencia por lote con viewport/rol/respuesta, sin datos personales.
- Reversión UI/API por lote; para almacenamiento, copia verificada y restauración
  en entorno aparte. Nunca borrar volúmenes ni «arreglar» una base incompatible.
- No medir rendimiento sobre `ng serve`; Lighthouse de producción queda pendiente,
  sin puntuación inventada y sin retirar funcionalidades para subir una nota.
- Judgment Day revisa este paquete documental congelado, no certifica producto.
  Dos jueces ciegos; máximo dos rondas de corrección documental y rejuicio acotado.
- Sin apply no hay verify-report de implementación ni archive. Hallazgos de
  producto abiertos no se convierten en «aprobados» por aprobar una especificación.
