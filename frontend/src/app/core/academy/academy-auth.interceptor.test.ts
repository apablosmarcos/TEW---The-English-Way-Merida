import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./academy-auth.interceptor.ts', import.meta.url), 'utf8');
const { isAcademyRequest } = await import(
  new URL('./academy-http-policy.ts', import.meta.url).href
);

test('academy interceptor scopes Bearer credentials to the configured same- or cross-origin API base', () => {
  const origin = 'https://portal.example';

  assert.equal(isAcademyRequest('/api/academy/session', '/api', origin), true);
  assert.equal(isAcademyRequest('https://api.example/v1/academy/session', 'https://api.example/v1', origin), true);
  assert.equal(isAcademyRequest('https://evil.example/v1/academy/session', 'https://api.example/v1', origin), false);
  assert.equal(isAcademyRequest('https://api.example/v1/academy-evil/session', 'https://api.example/v1', origin), false);
  assert.equal(isAcademyRequest('/orders?next=/api/academy/session', '/api', origin), false);
  assert.match(source, /config\.load\(\)/);
  assert.match(source, /isAcademyRequest\(request\.url, state\.config\.apiBaseUrl\)/);
  assert.doesNotMatch(source, /target\.pathname\.includes\('\/academy\/'\).*Authorization/);
});

test('academy interceptor clears only unauthenticated academy sessions and routes forced password changes', () => {
  assert.match(source, /error\.status === 401[\s\S]*session\.clear\(\)[\s\S]*navigateByUrl\('\/academia\/acceso'\)/);
  assert.match(source, /error\.status === 403[\s\S]*PASSWORD_CHANGE_REQUIRED[\s\S]*navigateByUrl\('\/academia\/cambiar-contrasena'\)/);
});
