# Calidad de experiencia pública

## Purpose

Hacer utilizable la web pública incluso con red degradada, teclado y enlaces
profundos. Ámbito ROOT; portar únicamente los cambios equivalentes a ACADEMY
después de comprobar su plantilla distinta. No alterar matrícula externa ni marca.

## ADDED Requirements

### Requirement: PUB-R01 Contenido disponible sin animaciones

La web MUST presentar todo el contenido y los CTA aunque falle o se retrase AOS.
Las animaciones MUST ser una mejora progresiva, no una condición de visibilidad.
Traza: PUB-01.

#### Scenario: Fallo o retraso del script
- GIVEN CSS de AOS disponible y su script bloqueado o retrasado diez segundos
- WHEN se carga la portada y se recorren todas sus secciones
- THEN texto, enlaces y formulario externo MUST permanecer visibles y operables.

#### Scenario: Animaciones disponibles
- GIVEN AOS disponible y movimiento normal
- WHEN se entra en una sección
- THEN la animación MUST conservar la intención visual sin ocultar contenido al terminar.

### Requirement: PUB-R02 Navegación móvil y salto al contenido

La web MUST ofrecer salto al contenido, foco visible y menú móvil operable con
teclado, con nombre y estado coherentes y asociación explícita botón/nav.
Traza: PUB-03, PUB-04, ACA-09.

#### Scenario: Apertura y cierre por teclado
- GIVEN viewport de 375 px y foco en el botón de menú cerrado
- WHEN se pulsa Enter y después Tab
- THEN el siguiente paso MUST permitir entrar en los enlaces del menú; el botón anuncia cierre y estado expandido.
- WHEN se cierra con Escape o su botón
- THEN el foco MUST regresar al disparador sin alcanzar enlaces ocultos.

#### Scenario: Evitar cabecera repetida
- GIVEN portada o privacidad recién abierta
- WHEN se pulsa Tab y se activa «Saltar al contenido»
- THEN el enlace MUST ser visible al enfocar y mover el foco al contenido principal.

### Requirement: PUB-R03 Recuperación de rutas desconocidas

Las rutas públicas y privadas MUST mostrar una recuperación útil ante una URL
desconocida, sin revelar datos ni reactivar `/admin` retirado en ACADEMY.
Traza: PUB-08, ACA-07.

#### Scenario: URL pública inválida
- GIVEN una carga directa de `/ruta-inexistente`
- WHEN termina el enrutado
- THEN MUST aparecer «Página no encontrada», título específico y enlace a inicio, nunca una pantalla vacía.

#### Scenario: URL privada inválida
- GIVEN una URL `/academia/ruta-inexistente`, con y sin sesión
- WHEN se resuelve la ruta
- THEN MUST mostrarse recuperación segura y navegación apropiada al rol, sin cargar contenido ajeno.

### Requirement: PUB-R04 Contacto y metadatos accionables

El correo visible MUST ser un enlace `mailto:` y cada ruta pública MUST tener
título, descripción y canonical coherentes. Traza: PUB-09, PUB-11.

#### Scenario: Contactar y navegar a privacidad
- GIVEN portada abierta
- WHEN se inspecciona correo de contacto y pie y se navega a privacidad
- THEN ambos correos MUST ser accionables; privacidad MUST tener su propio título/canonical.
- WHEN se regresa al inicio
- THEN MUST restaurarse los metadatos de la portada sin duplicar etiquetas.

### Requirement: PUB-R05 Preferencia de movimiento

La web MUST respetar `prefers-reduced-motion: reduce` tanto en CSS como en
desplazamiento programático y animaciones no esenciales. Traza: PUB-10.

#### Scenario: Navegar con reducción de movimiento
- GIVEN reducción de movimiento activada antes de cargar la página
- WHEN se activan enlaces de sección o desplazamiento programático
- THEN el movimiento MUST ser inmediato y el destino quedar visible bajo la cabecera fija.

### Requirement: PUB-R06 Demo estática comprobable

Si se mantiene distribución en Pages, esta MUST declarar URL/base de despliegue
y estrategia de rutas y MUST funcionar con carga directa y recarga de privacidad.
No se promete login privado en hosting sin API. Traza: PUB-07, condicionado a decisión de distribución.

#### Scenario: Publicación bajo subruta
- GIVEN un artefacto construido para la URL real de Pages elegida
- WHEN se abre portada, se navega a privacidad y se recarga su enlace directo
- THEN assets y contenido MUST cargar sin 404; los enlaces MUST respetar la base.

#### Scenario: Demo sin API
- GIVEN hosting estático sin API privada configurada
- WHEN se ofrece acceso privado
- THEN MUST explicarse su indisponibilidad o dirigir al portal funcional explícito; nunca simular una autenticación exitosa.
