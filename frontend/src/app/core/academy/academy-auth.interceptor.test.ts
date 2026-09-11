import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./academy-auth.interceptor.ts', import.meta.url), 'utf8');

test('academy interceptor scopes Bearer credentials to same-origin Academy API paths', () => {
  const origin = 'https://portal.example';
  const isAcademyPath = (url: string) => {
    const target = new URL(url, origin);
    return target.origin === origin && target.pathname.startsWith('/api/academy/');
  };

  assert.equal(isAcademyPath('api/academy/session'), true);
  assert.equal(isAcademyPath('https://evil.example/path/api/academy/session'), false);
  assert.equal(isAcademyPath('/orders?next=/academy/session'), false);
  assert.match(source, /new URL\(url, origin\)/);
  assert.match(source, /target\.origin === origin && target\.pathname\.startsWith\('\/api\/academy\/'\)/);
  assert.doesNotMatch(source, /includes\('\/academy\/'\)/);
});

test('academy interceptor clears only unauthenticated academy sessions and routes forced password changes', () => {
  assert.match(source, /error\.status === 401[\s\S]*session\.clear\(\)[\s\S]*navigateByUrl\('\/academia\/acceso'\)/);
  assert.match(source, /error\.status === 403[\s\S]*PASSWORD_CHANGE_REQUIRED[\s\S]*navigateByUrl\('\/academia\/cambiar-contrasena'\)/);
});
