# Calidad de interacción de academia

## Purpose

Proteger a administradores y familias frente a estados inconsistentes. Ámbito
ACADEMY exclusivamente; las respuestas simuladas verifican UI, no autorización real.

## ADDED Requirements

### Requirement: ACA-R01 Editor hidratado antes de mutar

El editor MUST distinguir carga, error de carga, listo y mutación. Guardar,
visibilidad, borrado y materiales MUST permanecer inaccesibles si no se han
cargado los datos requeridos. El error MUST permitir reintentar o volver.
Traza: ACA-01.

#### Scenario: Error de categorías o detalle
- GIVEN sesión válida y GET de categorías o publicación que responde 503, 404 o error de red
- WHEN concluye la carga
- THEN MUST mostrarse el error recuperable y no existir acción capaz de mutar datos vacíos o un ID desconocido.

#### Scenario: Recuperación completa
- GIVEN carga previa fallida
- WHEN el usuario reintenta y ambos recursos responden correctamente
- THEN MUST aparecer el contenido recibido y habilitarse las acciones permitidas por su estado.

### Requirement: ACA-R02 Última intención y feedback fiable

Los listados MUST reflejar el último filtro solicitado, independientemente del
orden de respuesta. Las mutaciones MUST limpiar el error previo al reintentar y
mostrar éxito solo tras respuesta válida. Traza: ACA-03, ACA-04.

#### Scenario: Respuestas invertidas
- GIVEN una petición lenta de visibles y otra posterior rápida de eliminadas
- WHEN ambas terminan en orden inverso
- THEN filtro e items MUST seguir mostrando eliminadas y no datos de la respuesta obsoleta.

#### Scenario: Guardar tras un fallo
- GIVEN un guardado fallido y contenido conservado
- WHEN el siguiente guardado tiene éxito
- THEN MUST desaparecer la alerta anterior y aparecer confirmación inequívoca sin perder cambios.

### Requirement: ACA-R03 Reflow del editor y materiales

El editor MUST permitir todos sus campos y acciones sin desplazamiento horizontal
de página a 320, 375, 768 y 1280 px, incluyendo títulos y nombres largos.
La vista a 200 % de zoom MUST conservar acceso y foco. Traza: ACA-05.

#### Scenario: Materiales en móvil
- GIVEN publicación con diez materiales y nombres largos, a 320 o 375 px
- WHEN se edita, se sube, se renombra y se inspeccionan acciones
- THEN controles MUST apilarse o ajustar línea sin solapamiento, clipping ni ocultar acciones.

### Requirement: ACA-R04 Ciclo del selector y vista previa

Tras upload exitoso, modelo y control file MUST quedar vacíos; tras fallo MUST
conservarse la selección para reintentar. Preview MUST abrir el recurso autorizado
o comunicar un error recuperable, sin pestañas vacías persistentes ni URLs sin revocar.
Traza: ACA-06 y validación previa de ACA-10.

#### Scenario: Reutilizar archivo
- GIVEN un archivo seleccionado y subido correctamente
- WHEN se selecciona inmediatamente el mismo archivo
- THEN el control MUST emitir la nueva selección y permitir una segunda subida intencionada.

#### Scenario: Descarga lenta o denegada
- GIVEN preview con respuesta lenta, 401/404 o bloqueo de emergentes
- WHEN se pulsa vista previa
- THEN MUST abrirse el material o explicarse el fallo; ninguna pestaña huérfana permanece y se liberan los object URLs.

### Requirement: ACA-R05 Mutaciones de usuario serializadas

Activar, desactivar, eliminar y restablecer MUST admitir como máximo una mutación
pendiente por cuenta desde esta interfaz. MUST mostrar estado pendiente y no
presentar una contraseña temporal que una segunda operación concurrente invalide.
Traza: ACA-11.

#### Scenario: Doble pulsación con latencia
- GIVEN una cuenta y un reset cuya respuesta tarda
- WHEN se pulsa dos veces o se intenta desactivar durante el reset
- THEN MUST enviarse una sola mutación por cuenta y los controles afectados explicar que está en curso.

#### Scenario: Fallo y reintento
- GIVEN operación fallida
- WHEN se libera su estado pendiente
- THEN MUST conservarse contexto, mostrarse error y permitirse un reintento manual.

### Requirement: ACA-R06 Reset consciente y secreto transitorio

Si se aprueba GOV-04, la interfaz MUST confirmar identidad y efecto del reset antes de
revocar credenciales. Una contraseña temporal MUST mostrarse solo en el resultado
de su operación, sin persistirla ni registrarla. Traza: ACA-12, decisión pendiente.

#### Scenario: Cancelar un reset
- GIVEN confirmación de restablecimiento de una cuenta identificada
- WHEN se cancela
- THEN MUST producirse cero peticiones de reset y conservarse la credencial existente.

#### Scenario: Confirmar un reset
- GIVEN confirmación de la cuenta identificada y ninguna mutación pendiente para ella
- WHEN el administrador confirma y repite la pulsación antes de terminar la respuesta
- THEN MUST enviarse exactamente una petición, revocarse credenciales anteriores en el servidor y mostrarse solo la contraseña correspondiente a esa operación.
- WHEN se cierra el aviso o se abandona la pantalla
- THEN el secreto MUST desaparecer de la vista y no existir en almacenamiento del navegador, URL, logs ni respuestas de listados.

### Requirement: ACA-R07 Errores de sesión y límite de acceso

Un 401 del endpoint Academy autorizado MUST borrar sesión y dirigir a acceso,
sin adjuntar credenciales a otros orígenes. Un 429 MUST explicar la espera a partir
de Retry-After y conservar un mensaje genérico respecto a la existencia de cuenta.
Traza: ACA-02, ACA-08.

#### Scenario: API configurada y origen ajeno
- GIVEN base Academy explícita del mismo origen o de otro origen permitido
- WHEN responde 401
- THEN MUST limpiarse sesión una sola vez y mostrarse acceso.
- GIVEN petición a cualquier origen o path no configurado como Academy
- WHEN responde 401
- THEN MUST mantenerse la sesión Academy y no enviarse su token.

#### Scenario: Rate limit
- GIVEN login que devuelve 429 con Retry-After de 900 segundos
- WHEN se presenta el resultado
- THEN MUST indicarse el bloqueo temporal y cuándo reintentar; no decir «contraseña incorrecta» ni reintentar automáticamente.

### Requirement: ACA-R08 Fechas coherentes con el idioma

La academia MUST presentar fechas en español de España con criterio de zona
horaria documentado; MUST conservar timestamps ISO y su ordenación. Traza: ACA-13.

#### Scenario: Fecha en feed y detalle
- GIVEN una publicación cuyo timestamp ISO representa el 20 de septiembre de 2026
- WHEN se consulta desde feed, detalle y administración bajo la política horaria elegida
- THEN el mes MUST mostrarse en español, la fecha ser coherente entre pantallas y no cambiar el valor persistido.
