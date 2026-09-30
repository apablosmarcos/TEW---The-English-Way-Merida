import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./access.component.ts', import.meta.url), 'utf8');
const { retryAfterSeconds } = await import(
  new URL('../../core/academy/academy-http-policy.ts', import.meta.url).href
);

test('access routes forced changes before role destinations and exposes accessible state', () => {
  assert.match(source, /export function academyDestination[\s\S]*mustChangePassword[\s\S]*'\/academia\/cambiar-contrasena'[\s\S]*role === 'admin'[\s\S]*'\/academia\/admin\/publicaciones'[\s\S]*'\/academia'/);
  assert.match(source, /this\.session\.login\([\s\S]*this\.router\.navigateByUrl\(academyDestination/);
  assert.match(source, /aria-busy[\s\S]*role="alert"/);
  assert.match(source, /\[disabled\]="isLoading \|\| isSubmitting \|\| form\.invalid \|\| !apiBaseUrl"/);
  assert.match(source, /if \(!this\.apiBaseUrl\) \{ this\.errorMessage = 'El acceso no está disponible\.'; return; \}/);
  assert.match(source, /\.primary\{background:#B71C1C;color:#FFF/);
});

test('access presents Retry-After without automatic retries or account enumeration', () => {
  const now = Date.parse('2026-01-01T12:00:00Z');
  assert.equal(retryAfterSeconds('120', now), 120);
  assert.equal(retryAfterSeconds('Thu, 01 Jan 2026 12:00:45 GMT', now), 45);
  assert.equal(retryAfterSeconds('invalid', now), null);
  assert.match(source, /error\.status === 429/);
  assert.match(source, /Demasiados intentos/);
  assert.match(source, /Retry-After/);
  assert.doesNotMatch(source, /retry\(|timer\(|setTimeout\(/);
});
