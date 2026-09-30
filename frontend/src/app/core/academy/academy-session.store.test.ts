import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./academy-session.store.ts', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('./academy-api.service.ts', import.meta.url), 'utf8');
const mainSource = readFileSync(new URL('../../../main.ts', import.meta.url), 'utf8');

test('academy session persists only its opaque token', () => {
  assert.match(source, /const TOKEN_KEY = 'tew\.academy\.token'/);
  assert.match(source, /this\.storage\.setItem\(TOKEN_KEY, token\)/);
  assert.doesNotMatch(source, /setItem\([^\n]*(user|expiresAt)/);
});

test('academy session restores with GET session and clears invalid storage', () => {
  assert.match(source, /this\.api\.session\(apiBaseUrl, token\)/);
  assert.match(source, /catchError\(\(\) => \{\s*this\.clear\(\);\s*return of\(null\);/);
});

test('academy logout clears local state before tolerating network failure', () => {
  assert.match(source, /const token = this\.token;\s*this\.clear\(\);\s*return token \? this\.api\.logout\(apiBaseUrl, token\)\.pipe\(catchError\(\(\) => of\(void 0\)\)\)/);
  assert.match(source, /this\.storage\.removeItem\(TOKEN_KEY\)/);
});

test('academy services use AOT-safe bootstrap factories', () => {
  assert.doesNotMatch(source, /Injectable\s*\(\s*\{\s*providedIn\s*:\s*['"]root['"]\s*\}\s*\)\s*\(\s*AcademySessionStore\s*\)/);
  assert.doesNotMatch(apiSource, /Injectable\s*\(\s*\{\s*providedIn\s*:\s*['"]root['"]\s*\}\s*\)\s*\(\s*AcademyApiService\s*\)/);
  assert.match(mainSource, /\{\s*provide:\s*AcademyApiService,\s*useFactory:\s*\(\)\s*=>\s*new AcademyApiService\(\)\s*\}/);
  assert.match(mainSource, /\{\s*provide:\s*AcademySessionStore,\s*useFactory:\s*\(\)\s*=>\s*new AcademySessionStore\(\)\s*\}/);
});
