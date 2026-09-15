import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const guards = readFileSync(new URL('./academy-guards.ts', import.meta.url), 'utf8');
const routes = readFileSync(new URL('../../app.routes.ts', import.meta.url), 'utf8');

test('academy guard decisions prioritize forced changes and route admin landing separately', () => {
  assert.match(guards, /export function academyDestination[\s\S]*mustChangePassword[\s\S]*'\/academia\/cambiar-contrasena'[\s\S]*role === 'admin'[\s\S]*'\/academia\/admin\/publicaciones'[\s\S]*'\/academia'/);
  assert.match(guards, /export const academyAnonymousGuard: CanActivateFn/);
  assert.match(guards, /export const academyAuthenticatedGuard: CanActivateFn/);
  assert.match(guards, /export const academyForcedChangeGuard: CanActivateFn/);
});

test('academy role guards return router UrlTrees, blocking parents from admin routes', () => {
  assert.match(guards, /export const academyParentGuard: CanActivateFn[\s\S]*user\.role === 'parent'[\s\S]*router\.parseUrl\(academyDestination\(user\)\)/);
  assert.match(guards, /export const academyAdminGuard: CanActivateFn[\s\S]*user\.role === 'admin'[\s\S]*router\.parseUrl\(academyDestination\(user\)\)/);
  assert.match(guards, /return .*\.pipe\(/);
});

test('academy routes lazy-load access, forced-change, parent, and admin shell destinations', () => {
  assert.match(routes, /path: 'academia'[\s\S]*path: 'acceso'[\s\S]*academyAnonymousGuard[\s\S]*loadComponent/);
  assert.match(routes, /path: 'cambiar-contrasena'[\s\S]*academyForcedChangeGuard[\s\S]*loadComponent/);
  assert.match(routes, /path: ''[\s\S]*academyAuthenticatedGuard[\s\S]*academyParentGuard[\s\S]*loadComponent/);
  assert.match(routes, /path: 'admin\/publicaciones'[\s\S]*academyAuthenticatedGuard[\s\S]*academyAdminGuard[\s\S]*loadComponent/);
});

test('legacy admin login route and component are absent while legacy leads remain', () => {
  assert.doesNotMatch(routes, /path: 'admin'/);
  assert.doesNotMatch(routes, /LoginComponent/);
  assert.match(routes, /path: 'admin\/leads'/);
});
