import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const templatePath = resolve(import.meta.dirname, 'home.component.html');
const sourcePath = resolve(import.meta.dirname, 'home.component.ts');

test('home template keeps public TEW content and sends enrolment to the canonical Google Form', () => {
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
  assert.match(template, /Telegram/);
  assert.match(template, /secretaria\.tew@gmail\.com/);
  assert.match(template, /¿Dudas sobre grupos y horarios\? Escríbenos\./);
  assert.doesNotMatch(template, /¿Dudas sobre grupos o horarios\? Escríbenos\./);
  assert.match(template, /C\/ Severo Ochoa, 20, Local 4, 06800 Mérida/);
  assert.match(template, /iframe/);
  assert.match(template, /id="formulario"/);
  assert.match(template, /href="https:\/\/docs\.google\.com\/forms\/d\/e\/1FAIpQLSfTpcDh-XO9lGUBH9IagbhSyZkz3PlTsra64dvHEUAEgtMWlg\/viewform"/);
});

test('Google Forms enrolment opens safely in a clearly announced new tab', () => {
  const template = readFileSync(templatePath, 'utf8');

  assert.match(template, /target="_blank"/);
  assert.match(template, /rel="noopener noreferrer"/);
  assert.match(template, /aria-label="Abrir el formulario de matrícula en Google Forms en una nueva pestaña"/);
  assert.match(template, /Solicitar matrícula en Google Forms/);
});

test('public home has no local lead form, submission state, or lead API', () => {
  const template = readFileSync(templatePath, 'utf8');
  const source = readFileSync(sourcePath, 'utf8');

  assert.doesNotMatch(template, /<form[\s>]/);
  assert.doesNotMatch(template, /formControlName=/);
  assert.doesNotMatch(template, /\(ngSubmit\)=/);
  assert.doesNotMatch(source, /ReactiveFormsModule|LeadsApiService|home-form|createLeadForm|submitLeadForm/);
  assert.doesNotMatch(source, /protected readonly form|protected isSubmitting|protected successMessage|protected errorMessage|protected async submit\(/);
});

test('public home shows an anonymous Academy access link', () => {
  const template = readFileSync(templatePath, 'utf8');

  assert.match(template, /routerLink="\/academia\/acceso"[^>]*>Acceso academia<\//);
});

test('public home restores an existing Academy session without blocking public rendering', () => {
  const source = readFileSync(sourcePath, 'utf8');

  assert.match(source, /state\.status === 'ready' && this\.siteConfig\.apiBaseUrl && this\.academySession\.token[\s\S]*this\.academySession\.restore\(this\.siteConfig\.apiBaseUrl\)\.subscribe\(\)/);
  assert.match(source, /else if \(!this\.siteConfig\.apiBaseUrl\) \{\s*this\.academySession\.clear\(\);/);
});

test('authenticated Academy users get a role destination and immediate logout', () => {
  const template = readFileSync(templatePath, 'utf8');
  const source = readFileSync(sourcePath, 'utf8');

  assert.match(template, /\*ngIf="academySession\.user\(\) as user; else academyAccess"/);
  assert.match(template, /\[routerLink\]="academyDestination\(user\)"/);
  assert.match(template, /<button[^>]*\(click\)="logout\(\)"[^>]*>Cerrar sesión<\/button>/);
  assert.match(source, /this\.academySession\.clear\(\)/);
});

test('Academy navigation keeps native menu and keyboard-focus semantics', () => {
  const template = readFileSync(templatePath, 'utf8');
  const source = readFileSync(sourcePath, 'utf8');

  assert.match(template, /<nav[^>]*aria-label="Navegación principal"/);
  assert.match(template, /<details class="academy-menu">[\s\S]*<summary>\{\{ user\.displayName \}\}<\/summary>/);
  assert.match(source, /\.academy-menu :is\(summary, a, button\):focus-visible/);
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
