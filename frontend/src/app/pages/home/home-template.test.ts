import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const templatePath = resolve(import.meta.dirname, 'home.component.html');
const sourcePath = resolve(import.meta.dirname, 'home.component.ts');
const indexPath = resolve(import.meta.dirname, '../../../index.html');
const appPath = resolve(import.meta.dirname, '../../app.component.ts');
const routesPath = resolve(import.meta.dirname, '../../app.routes.ts');
const privacyPath = resolve(import.meta.dirname, '../privacidad/privacidad.component.ts');
const stylesPath = resolve(import.meta.dirname, '../../../styles.css');
const { preferredScrollBehavior } = await import(
  new URL('./public-experience.ts', import.meta.url).href
);

test('home renders the current year without hard-coding the footer date', () => {
  const template = readFileSync(templatePath, 'utf8');
  const source = readFileSync(sourcePath, 'utf8');

  assert.match(template, /© \{\{ currentYear \}\} The English Way/);
  assert.doesNotMatch(template, /© 2025/);
  assert.match(source, /currentYear = new Date\(\)\.getFullYear\(\)/);
});

test('home visual fixes keep the robot visible and separate section headings from copy', () => {
  const source = readFileSync(sourcePath, 'utf8');

  const robotRule = source.match(/\.hero-brand-robot\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(robotRule, /background:\s*#fff/);
  assert.match(robotRule, /border-radius:\s*50%/);
  assert.match(robotRule, /filter:/);
  assert.doesNotMatch(source, /@media \(max-width: 640px\)[\s\S]*\.brand\s*\{\s*align-items:\s*start;/);
  assert.match(source, /\.info-card\s*>\s*p,[\s\S]*\.form-card\s*>\s*\.copy-muted\s*\{[^}]*margin-top:/);
});

test('home template keeps public TEW content and sends enrolment to the canonical Google Form', () => {
  const template = readFileSync(templatePath, 'utf8');

  assert.match(template, /assets\/img\/Robot Head with TEW Logo\.png/);
  assert.match(template, /assets\/img\/TEW\.png/);
  assert.match(template, /class="hero-brand-pair"/);
  assert.match(template, /class="hero-brand-official"/);
  assert.match(template, /class="hero-line-fixed"/);
  assert.match(template, /Aprender inglés<\/span>\s*<span[^>]*>nunca fue tan motivador/);
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

test('index.html defines an explicit favicon to avoid runtime 404 noise', () => {
  const indexHtml = readFileSync(indexPath, 'utf8');

  assert.match(indexHtml, /rel="icon"/);
  assert.match(indexHtml, /assets\/img\/TEW\.png/);
});

test('Google Forms enrolment opens safely in a new tab', () => {
  const template = readFileSync(templatePath, 'utf8');

  assert.match(template, /target="_blank"/);
  assert.match(template, /rel="noopener noreferrer"/);
  assert.match(template, /Ir al formulario de matrícula/);
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

test('public home includes the poster redesign and its user-controlled video', () => {
  const template = readFileSync(templatePath, 'utf8');

  assert.match(template, /class="hero-stage"/);
  assert.match(template, /assets\/img\/english%20teacher%2004\.png/);
  assert.match(template, /class="classroom-banner"/);
  assert.match(template, /assets\/img\/english%20teacher%2003\.png/);
  assert.match(template, /id="video-clases"/);
  assert.match(template, /video-showcase/);
  assert.match(template, /assets\/TEW%20SS%20Ad24-25\.mp4/);
  assert.match(template, /<video[^>]*controls/);
  assert.doesNotMatch(template, /<video[^>]*autoplay/);
  assert.doesNotMatch(template, /<video[^>]*muted/);
});

test('Academy access uses a separate primary CTA slot rather than an ordinary navigation link', () => {
  const template = readFileSync(templatePath, 'utf8');
  const source = readFileSync(sourcePath, 'utf8');
  const navigation = template.match(/<nav[^>]*>([\s\S]*?)<\/nav>/)?.[1];

  assert.ok(navigation);
  assert.doesNotMatch(navigation, /Acceso academia|academy-menu/);
  assert.match(template, /<div class="academy-access">[\s\S]*<a class="button primary academy-access-link" routerLink="\/academia\/acceso" \(click\)="closeMenu\(\)">Acceso academia<\//);
  assert.match(source, /\.academy-access-link\s*\{[\s\S]*min-height:/);
  assert.match(source, /\.academy-access-link:focus-visible\s*\{/);
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

test('fixed hero wording wraps inside 320px and 375px cards', () => {
  const source = readFileSync(sourcePath, 'utf8');
  assert.match(source, /@media \(max-width: 640px\)[\s\S]*\.hero-line-fixed\s*\{[\s\S]*white-space:\s*normal/);
});

test('home anchor targets reserve space for the sticky header when scrolling', () => {
  const source = readFileSync(sourcePath, 'utf8');

  assert.match(source, /scroll-margin-top:/);
});

test('home source leaves video playback to native user controls and removes legacy enrollment wiring', () => {
  const source = readFileSync(sourcePath, 'utf8');

  assert.doesNotMatch(source, /autoplay-video|IntersectionObserver|\.play\(\)|\.pause\(\)/);
  assert.doesNotMatch(source, /\.proof-bar\s*\{[^}]*opacity:\s*0;/);
});

test('public AOS content stays visible until the optional script initializes', () => {
  const source = readFileSync(sourcePath, 'utf8');
  const styles = readFileSync(stylesPath, 'utf8');
  const index = readFileSync(indexPath, 'utf8');

  assert.match(styles, /html:not\(\.aos-enabled\)\s+\[data-aos\]/);
  assert.match(source, /classList\.add\('aos-enabled'\)/);
  assert.match(source, /addEventListener\('load'/);
  assert.match(index, /id="aos-script"/);
});

test('mobile navigation exposes state, target and Escape focus restoration', () => {
  const template = readFileSync(templatePath, 'utf8');
  const source = readFileSync(sourcePath, 'utf8');

  assert.match(template, /aria-controls="primary-navigation"/);
  assert.match(template, /\[attr\.aria-label\]="menuOpen \? 'Cerrar menú de navegación' : 'Abrir menú de navegación'"/);
  assert.match(template, /keydown\.escape/);
  assert.match(source, /menuButton\?\.nativeElement\.focus\(\)/);
});

test('public pages provide skip links and focusable main content', () => {
  for (const page of [readFileSync(templatePath, 'utf8'), readFileSync(privacyPath, 'utf8')]) {
    assert.match(page, /class="skip-link"/);
    assert.match(page, /href="#main-content"/);
    assert.match(page, /<main[^>]*id="main-content"[^>]*tabindex="-1"/);
  }
});

test('unknown routes recover with a focused 404 page', () => {
  const routes = readFileSync(routesPath, 'utf8');
  assert.match(routes, /path:\s*'\*\*'/);
  assert.match(routes, /NotFoundComponent/);
  assert.match(routes, /Página no encontrada/);
});

test('public contact emails are actionable', () => {
  const template = readFileSync(templatePath, 'utf8');
  const privacy = readFileSync(privacyPath, 'utf8');
  assert.ok((template.match(/mailto:secretaria\.tew@gmail\.com/g) ?? []).length >= 2);
  assert.ok((privacy.match(/mailto:secretaria\.tew@gmail\.com/g) ?? []).length >= 3);
});

test('navigation updates title, description and canonical metadata', () => {
  const app = readFileSync(appPath, 'utf8');
  const routes = readFileSync(routesPath, 'utf8');
  assert.match(app, /NavigationEnd/);
  assert.match(app, /updateTag/);
  assert.match(app, /link\[rel='canonical'\]/);
  assert.match(routes, /Política de privacidad/);
  assert.match(routes, /Academia · The English Way/);
});

test('reduced motion affects CSS and programmatic scrolling without changing destinations', () => {
  const source = readFileSync(sourcePath, 'utf8');
  const styles = readFileSync(stylesPath, 'utf8');
  assert.match(styles, /prefers-reduced-motion:\s*reduce[\s\S]*scroll-behavior:\s*auto/);
  assert.match(source, /matchMedia\('\(prefers-reduced-motion: reduce\)'\)/);
  assert.equal(preferredScrollBehavior(true), 'auto');
  assert.equal(preferredScrollBehavior(false), 'smooth');
  assert.match(source, /target\.focus\(\{ preventScroll: true \}\)/);
});

test('Maps loads only after explicit activation and keeps an address fallback', () => {
  const template = readFileSync(templatePath, 'utf8');
  const source = readFileSync(sourcePath, 'utf8');
  assert.match(template, /@if \(mapLoaded\)/);
  assert.match(template, /Cargar mapa/);
  assert.match(template, /Abrir ubicación en Google Maps/);
  assert.match(source, /mapLoaded = false/);
  assert.match(source, /loadMap\(\)[\s\S]*mapLoaded = true/);
});
