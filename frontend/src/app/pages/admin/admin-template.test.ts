import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const loginPath = resolve(import.meta.dirname, 'login.component.ts');
const leadsPath = resolve(import.meta.dirname, 'leads.component.ts');
const indexPath = resolve(import.meta.dirname, '../../../index.html');
const adminApiPath = resolve(import.meta.dirname, '../../core/services/admin-api.service.ts');

test('admin templates include branded login, delete confirmation and success feedback hooks', () => {
  const loginSource = readFileSync(loginPath, 'utf8');
  const leadsSource = readFileSync(leadsPath, 'utf8');

  assert.match(loginSource, /assets\/img\/TEW\.png/);
  assert.match(loginSource, /assets\/img\/2\.png/);
  assert.match(leadsSource, /confirm\(/);
  assert.match(leadsSource, /successMessage/);
  assert.match(leadsSource, /previewMessage\(lead\.message\)/);
  assert.match(leadsSource, /lead\.phone \? lead\.phone : formatDate\(lead\.createdAt\)/);
  assert.match(leadsSource, /<strong class="lead-title">{{ lead\.name }}<\/strong>/);
  assert.match(leadsSource, /Detalle de solicitud/);
  assert.match(leadsSource, /class="lead-title"/);
  assert.match(leadsSource, /class="meta lead-meta"/);
  assert.match(leadsSource, /class="preview lead-preview"/);
  assert.match(leadsSource, /Centro educativo/);
  assert.match(leadsSource, /Curso actual/);
  assert.match(leadsSource, /Forma de pago/);
  assert.match(leadsSource, /Observaciones/);
});

test('index.html defines an explicit favicon to avoid runtime 404 noise', () => {
  const indexHtml = readFileSync(indexPath, 'utf8');

  assert.match(indexHtml, /rel="icon"/);
  assert.match(indexHtml, /assets\/img\/TEW\.png/);
});

test('admin login response type includes expiresAt for expiring sessions', () => {
  const adminApiSource = readFileSync(adminApiPath, 'utf8');

  assert.match(adminApiSource, /expiresAt:\s*string/);
});
