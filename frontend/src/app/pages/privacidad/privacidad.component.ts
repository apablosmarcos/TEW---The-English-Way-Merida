import { Component } from '@angular/core';

@Component({
  selector: 'app-privacidad',
  template: `
    <div class="page">
      <header class="topbar">
        <div class="shell topbar-shell">
          <a class="brand" href="/">
            <img class="brand-logo" src="assets/img/TEW.png" alt="The English Way" />
            <span class="brand-copy">
              <strong>The English Way</strong>
              <small>Academia de inglés en Mérida</small>
            </span>
          </a>
          <a class="back-link" href="/">← Volver</a>
        </div>
      </header>

      <main class="shell policy">
        <span class="kicker">Legal</span>
        <h1>Política de privacidad</h1>
        <p class="lead">Última actualización: julio de 2025</p>

        <section>
          <h2>1. Responsable del tratamiento</h2>
          <p>
            <strong>The English Way</strong><br />
            C. Severo Ochoa, 20, Local 4, 06800 Mérida (Badajoz)<br />
            secretaria.tew&#64;gmail.com · 615 15 30 12
          </p>
        </section>

        <section>
          <h2>2. Finalidad y base jurídica</h2>
          <p>
            Los datos facilitados mediante el formulario de matrícula se tratan con las siguientes finalidades:
          </p>
          <ul>
            <li>Gestión de la solicitud de inscripción y comunicación con la familia (base: ejecución de un contrato, art. 6.1.b RGPD).</li>
            <li>Seguimiento académico del alumno durante el curso (base: ejecución de un contrato).</li>
            <li>Envío de información sobre la academia relacionada con el servicio contratado (base: interés legítimo, art. 6.1.f RGPD).</li>
          </ul>
        </section>

        <section>
          <h2>3. Datos que tratamos</h2>
          <p>
            Nombre, apellidos, fecha de nacimiento, domicilio, email, teléfono, centro educativo, curso, datos del tutor/a legal y, en su caso, datos bancarios para domiciliación.
            No se tratan datos especialmente sensibles.
          </p>
        </section>

        <section>
          <h2>4. Menores de edad</h2>
          <p>
            La matrícula de alumnado menor de 14 años requiere el consentimiento expreso del padre, madre o tutor/a legal, quien firma y responde del formulario enviado.
            No recabamos datos de menores sin ese consentimiento.
          </p>
        </section>

        <section>
          <h2>5. Conservación de los datos</h2>
          <p>
            Los datos se conservan mientras dure la relación académica y, una vez finalizada, durante los plazos legalmente exigidos (mínimo 5 años para documentación contable y fiscal).
          </p>
        </section>

        <section>
          <h2>6. Destinatarios</h2>
          <p>
            No cedemos datos a terceros salvo obligación legal. Utilizamos Google Workspace (Classroom, Gmail) como herramienta de apoyo académico; Google actúa como encargado del tratamiento bajo su propio acuerdo de protección de datos.
          </p>
        </section>

        <section>
          <h2>7. Tus derechos</h2>
          <p>Puedes ejercer en cualquier momento los siguientes derechos dirigiéndote a secretaria.tew&#64;gmail.com:</p>
          <ul>
            <li><strong>Acceso</strong>: conocer qué datos tenemos sobre ti.</li>
            <li><strong>Rectificación</strong>: corregir datos inexactos o incompletos.</li>
            <li><strong>Supresión</strong>: solicitar la eliminación cuando ya no sean necesarios.</li>
            <li><strong>Portabilidad</strong>: recibir tus datos en formato electrónico.</li>
            <li><strong>Oposición y limitación</strong>: oponerte al tratamiento o solicitar que se limite.</li>
          </ul>
          <p>
            Si consideras que el tratamiento no es conforme a la normativa, puedes reclamar ante la
            <a href="https://www.aepd.es" target="_blank" rel="noreferrer">Agencia Española de Protección de Datos (AEPD)</a>.
          </p>
        </section>

        <section>
          <h2>8. Cookies</h2>
          <p>
            Esta web no utiliza cookies propias de seguimiento ni analítica de terceros. El mapa de Google Maps incrustado puede establecer cookies de terceros conforme a la política de Google.
          </p>
        </section>
      </main>

      <footer class="shell footer">
        <img class="footer-logo" src="assets/img/TEW.png" alt="The English Way" />
        <p>The English Way · secretaria.tew&#64;gmail.com</p>
      </footer>
    </div>
  `,
  styles: `
    :host { display: block; }

    * { box-sizing: border-box; }

    body { margin: 0; }

    .page {
      min-height: 100vh;
      font-family: Inter, Arial, sans-serif;
      color: #111;
    }

    .shell {
      width: min(860px, calc(100% - 32px));
      margin: 0 auto;
    }

    a { color: inherit; text-decoration: none; }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 20;
      border-bottom: 1px solid rgba(17,17,17,.08);
      background: rgba(255,253,251,.9);
      backdrop-filter: blur(18px);
    }

    .topbar-shell {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 0;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo { max-width: 120px; height: auto; display: block; }

    .brand-copy { display: grid; gap: 2px; }

    .brand-copy strong {
      font-size: .88rem;
      font-family: 'Arial Narrow', Impact, sans-serif;
      text-transform: uppercase;
      letter-spacing: .04em;
    }

    .brand-copy small {
      font-size: .66rem;
      color: #5b4f44;
      text-transform: uppercase;
      letter-spacing: .08em;
    }

    .back-link {
      font-size: .9rem;
      color: #5b4f44;
      font-weight: 600;
    }

    .back-link:hover { color: #111; }

    .policy {
      padding: 48px 0 64px;
    }

    .kicker {
      display: inline-flex;
      padding: 6px 14px;
      border-radius: 999px;
      background: #111;
      color: #fff;
      font-size: .78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .06em;
    }

    h1 {
      margin: 14px 0 4px;
      font-family: 'Arial Narrow', Impact, sans-serif;
      font-size: clamp(2rem, 5vw, 3rem);
      letter-spacing: -.03em;
      line-height: 1;
    }

    .lead {
      margin: 0 0 40px;
      color: #5b4f44;
      font-size: .9rem;
    }

    section { margin-top: 32px; padding-top: 32px; border-top: 1px solid #e6d9cf; }

    section:first-of-type { border-top: 0; padding-top: 0; }

    h2 {
      margin: 0 0 12px;
      font-family: 'Arial Narrow', Impact, sans-serif;
      font-size: 1.2rem;
      text-transform: uppercase;
      letter-spacing: .02em;
    }

    p { margin: 0 0 12px; line-height: 1.7; color: #3a3a3a; }

    ul { margin: 8px 0 12px; padding-left: 20px; }

    li { line-height: 1.7; color: #3a3a3a; margin-bottom: 6px; }

    a[href] { color: #b71c1c; text-decoration: underline; }

    .footer {
      display: grid;
      justify-items: center;
      gap: 10px;
      padding: 28px 0 36px;
      color: #5b4f44;
      font-size: .9rem;
      text-align: center;
      border-top: 1px solid #e6d9cf;
    }

    .footer-logo { max-width: 140px; display: block; width: 100%; height: auto; }
  `,
})
export class PrivacidadComponent {}
