# Contratos y persistencia de academia

## Purpose

Correcciones limitadas al backend SQLite y consumidores Academy. No migrar el
backend MySQL legado ni cambiar silenciosamente formatos de datos persistidos.

## ADDED Requirements

### Requirement: API-R01 Política uniforme de credenciales

Bootstrap y recuperación de administradores MUST rechazar contraseñas inferiores
al mínimo de diez caracteres antes de preparar almacenamiento. Las contraseñas
temporales MUST cumplir el contrato existente de diez caracteres sin glifos
ambiguos, usando aleatoriedad criptográfica y sin sesgo de selección.
Traza: API-01, API-02.

#### Scenario: Límite mínimo del administrador
- GIVEN entrada TTY con identidad válida y contraseña de nueve caracteres
- WHEN se confirma su creación
- THEN MUST rechazarse sin crear base, usuario o auditoría.
- GIVEN contraseña válida de diez caracteres y confirmación idéntica
- WHEN se confirma
- THEN MUST crearse el administrador sin imprimir ni registrar su contraseña.

#### Scenario: Contraseña temporal legible
- GIVEN alta o reset de usuario
- WHEN se genera la contraseña temporal
- THEN MUST tener diez caracteres del alfabeto aprobado sin `0`, `O`, `I`, `l` y no exponerse fuera de la respuesta autorizada.

### Requirement: API-R02 Esquema incompatible no promovido

Una migración MUST rechazar tablas Academy incompatibles y no elevar user_version
ni alterar sus datos ante fallo. Las tablas legacy ajenas MUST permanecer intactas.
El arranque MUST validar el esquema efectivo aunque user_version ya sea 1; una
base incompatible ya promovida MUST bloquear el servicio con diagnóstico saneado
sin modificar su versión, esquema o filas. La recuperación MUST requerir copia
consistente y autorización del operador; nunca reparación o downgrade automáticos.
Traza: API-03.

#### Scenario: Tabla homónima incompleta
- GIVEN SQLite versión 0 con `users(id TEXT PRIMARY KEY, normalizedUsername TEXT, deletedAt TEXT)`
- WHEN se intenta aplicar la migración Academy
- THEN MUST fallar de forma explícita y conservar versión 0, definición y datos originales.

#### Scenario: Base incompatible ya promovida a versión 1
- GIVEN SQLite con user_version=1 y `users(id TEXT PRIMARY KEY, normalizedUsername TEXT, deletedAt TEXT)` y filas sintéticas existentes
- WHEN se arranca el servicio o se solicita inicialización
- THEN MUST rechazarse antes de habilitar endpoints, conservar user_version=1 y exactamente las definiciones/filas previas, y emitir diagnóstico sin contenido sensible.
- THEN MUST NOT ejecutar reparación, downgrade, recreación de tablas ni eliminación de datos; el operador recibe instrucciones para trabajar sobre copia consistente autorizada.

#### Scenario: Base vacía y repetición
- GIVEN base nueva o esquema vigente correctamente migrado
- WHEN se inicializa dos veces
- THEN MUST obtenerse esquema válido, sin pérdidas, ni duplicación de datos.

### Requirement: API-R03 Contrato de errores y resúmenes real

Todos los endpoints Academy MUST usar `{ok:false,error:{code,message}}` para
errores de dominio; clientes y pruebas MUST reconocer el conjunto emitido. La
lista administrativa MUST tener un tipo de resumen fiel a su JSON y el detalle
MUST conservar sus adjuntos. Traza: API-04, API-07.

#### Scenario: Conflictos de usuario
- GIVEN username duplicado, último administrador o identificador inválido
- WHEN el servidor rechaza la operación
- THEN MUST devolver código HTTP y objeto de error coherentes; el frontend MUST traducir el código sin analizar textos ni cadenas legacy.

#### Scenario: Lista frente a detalle
- GIVEN publicación con adjuntos
- WHEN se consultan lista y detalle
- THEN el contrato de lista MUST coincidir con sus campos reales y el detalle incluir los materiales; no exigir consultas de adjuntos por fila.

### Requirement: API-R04 Recursos cerrados y errores diagnosticables

Cada conexión abierta por middleware MUST cerrarse exactamente una vez al
finalizar o abortarse la respuesta. Los fallos inesperados MUST producir diagnóstico
correlacionable en servidor sin exponer secretos o datos personales al cliente o log.
Traza: API-05, API-08.

#### Scenario: Desconexión autenticada
- GIVEN conexión SQLite abierta para petición autenticada
- WHEN el cliente aborta antes de finish o se emiten close y finish
- THEN MUST cerrarse exactamente una vez, sin excepción secundaria ni handles retenidos.

#### Scenario: Fallo de almacenamiento
- GIVEN error inesperado de DB o lectura de archivo
- WHEN se responde al cliente
- THEN MUST recibirse error genérico y registrarse ruta/correlación/causa saneada, sin token, contraseña, cuerpos, storage ID ni datos personales.

### Requirement: API-R05 Conservar las fronteras de acceso

Las correcciones MUST preservar revocación de sesiones, último administrador,
cambio obligatorio, publicación visible para familias y retención administrativa.
Son invariantes de regresión, no vulnerabilidades nuevas encontradas.

#### Scenario: Publicación o material eliminado
- GIVEN familia autenticada y publicación oculta/eliminada o material eliminado
- WHEN solicita lista, detalle, preview o descarga
- THEN MUST denegarse la exposición; el administrador conserva inspección permitida por contrato.

#### Scenario: Revocación
- GIVEN sesiones previas de usuario desactivado, eliminado o cuya contraseña cambió
- WHEN cualquiera intenta consumir un endpoint privado
- THEN MUST rechazarse sin reutilizar datos o privilegios anteriores.
