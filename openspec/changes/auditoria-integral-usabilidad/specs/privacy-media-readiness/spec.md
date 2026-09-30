# Privacidad, terceros y contenido multimedia

## Purpose

Convertir observaciones legales y de contenido en decisiones verificadas, no en
afirmaciones de incumplimiento sin datos. Ámbito público de ambos árboles.

## ADDED Requirements

### Requirement: PRV-R01 Terceros con activación informada

El tratamiento de Maps MUST tener inventario de solicitudes y decisión legal
registrada. Si requiere consentimiento, MUST no contactar al tercero antes de
obtenerlo; siempre MUST ofrecer dirección y alternativa accesible. Traza: PUB-05.

#### Scenario: Rechazo o ausencia de consentimiento requerido
- GIVEN decisión documentada de que la carga requiere consentimiento
- WHEN se carga la web, se llega a contacto o se rechaza
- THEN MUST haber cero solicitudes al mapa y mantenerse dirección/enlace alternativo.

#### Scenario: Activación autorizada
- GIVEN elección afirmativa válida según política aprobada
- WHEN se activa el mapa
- THEN MUST cargarse sin bloquear la navegación ni el resto del contacto.

### Requirement: PRV-R02 Identidad legal validada

El titular MUST proporcionar y aprobar los datos legales aplicables antes de
publicarlos. La página legal MUST ser accesible desde el pie; nunca se usarán
datos ficticios como cumplimiento. Traza: PUB-06.

#### Scenario: Datos pendientes
- GIVEN falta de identidad fiscal validada
- WHEN se prepara el lote legal
- THEN MUST mantenerse bloqueada su publicación y registrarse quién debe aportar la información.

### Requirement: PRV-R03 Alternativa al audio significativo

El vídeo MUST evaluarse para identificar voz o sonido informativo. Si lo contiene,
MUST ofrecer subtítulos sincronizados y alternativa textual fiel. Si es decorativo
y mudo, MUST registrarse esa comprobación antes de descartar la necesidad.
Traza: PUB-02.

#### Scenario: Vídeo con información hablada
- GIVEN contenido hablado comprobado
- WHEN se ve sin audio o se activan subtítulos
- THEN MUST poder comprenderse la información equivalente; el vídeo mantiene controles nativos y no inicia automáticamente.
