import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const templatePath = resolve(import.meta.dirname, 'home.component.html');
const sourcePath = resolve(import.meta.dirname, 'home.component.ts');

test('home template uses refreshed TEW assets, copy, and full enrollment form bindings', () => {
  const template = readFileSync(templatePath, 'utf8');

  assert.match(template, /assets\/img\/Robot Head with TEW Logo\.png/);
  assert.match(template, /assets\/img\/TEW\.png/);
  assert.match(template, /class="hero-brand-pair"/);
  assert.match(template, /class="hero-brand-official"/);
  assert.match(template, /class="hero-line-fixed"/);
  assert.match(template, /Aprender inglés<\/span>\s*<span[^>]*>nunca fue tan motivador/);
  assert.match(template, /Aprendizaje \+ tecnología = motivación/);
  assert.match(template, /En TEW trabajamos un inglés real, práctico, cercano y útil para el día a día\./);
  assert.match(template, /class="marquee-logo-red"/);
  assert.match(template, /class="marquee-logo-black"/);
  assert.match(template, /class="marquee-logo-soft"/);
  assert.match(template, /APRENDER INGLÉS NUNCA FUE TAN MOTIVADOR/);
  assert.doesNotMatch(template, /APRENDER INGLÉS NUNCA FUE TAN ENTRETENIDO/);
  assert.match(template, /Cómo es una clase/);
  assert.match(template, /El alumno debe contar con algún dispositivo y nosotros nos encargamos de prepararle la plataforma/);
  assert.doesNotMatch(template, /La academia cuenta con sus propios equipos informáticos para dejar al alumnado si lo necesita/);
  assert.match(template, /<article class="benefit card benefit-explain">[\s\S]*?<img class="benefit-visual" src="assets\/img\/MOVERS CLASSROOM LOGO\.png" alt="" aria-hidden="true" \/>/);
  assert.doesNotMatch(template, /<article class="benefit card benefit-explain">[\s\S]*?<img class="benefit-visual" src="assets\/img\/Robot Head with TEW Logo\.png" alt="" aria-hidden="true" \/>/);
  assert.match(template, /Telegram/);
  assert.match(template, /secretaria\.tew@gmail\.com/);
  assert.match(template, /¿Dudas sobre grupos y horarios\? Escríbenos\./);
  assert.doesNotMatch(template, /¿Dudas sobre grupos o horarios\? Escríbenos\./);
  assert.match(template, /C\/ Severo Ochoa, 20, Local 4, 06800 Mérida/);
  assert.match(template, /iframe/);
  assert.match(template, /id="formulario"/);
  assert.match(template, /INFORMACIÓN DEL ALUMNO/);
  assert.match(template, /INFORMACIÓN ACADÉMICA/);
  assert.match(template, /INFORMACIÓN DE PADRE\/MADRE\/TUTOR/);
  assert.match(template, /CUOTA/);
  assert.match(template, /OBSERVACIONES/);
  assert.match(template, /id="student-name"/);
  assert.match(template, /formControlName="studentName"/);
  assert.match(template, /id="student-surname"/);
  assert.match(template, /formControlName="studentSurname"/);
  assert.match(template, /id="birth-date"/);
  assert.match(template, /formControlName="birthDate"/);
  assert.match(template, /id="student-address"/);
  assert.match(template, /formControlName="address"/);
  assert.match(template, /id="student-school"/);
  assert.match(template, /formControlName="school"/);
  assert.match(template, /id="student-current-course"/);
  assert.match(template, /formControlName="currentCourse"/);
  assert.match(template, /formControlName="primaryContactName"/);
  assert.match(template, /formControlName="primaryContactSurname"/);
  assert.match(template, /formControlName="primaryContactRelationship"/);
  assert.match(template, /formControlName="secondaryContactName"/);
  assert.match(template, /formControlName="pickupContact"/);
  assert.match(template, /formControlName="paymentMethod"/);
  assert.match(template, /formControlName="paymentAccountHolder"/);
  assert.match(template, /formControlName="paymentIban"/);
  assert.match(template, /formControlName="observations"/);
});

test('hero point cards use white backgrounds with red titles and dark copy', () => {
  const source = readFileSync(sourcePath, 'utf8');

  assert.match(source, /\.point\s*\{[\s\S]*background:\s*#fff;/);
  assert.match(source, /\.point\s+strong\s*\{[\s\S]*color:\s*var\(--accent\)/);
  assert.match(source, /\.point\s+p\s*\{[\s\S]*color:\s*#111111/);
});

test('home anchor targets reserve space for the sticky header when scrolling', () => {
  const source = readFileSync(sourcePath, 'utf8');

  assert.match(source, /scroll-margin-top:/);
});

test('proof bars stay visible without browser-only observers', () => {
  const source = readFileSync(sourcePath, 'utf8');

  assert.doesNotMatch(source, /IntersectionObserver/);
  assert.doesNotMatch(source, /\.proof-bar\s*\{[^}]*opacity:\s*0;/);
});
