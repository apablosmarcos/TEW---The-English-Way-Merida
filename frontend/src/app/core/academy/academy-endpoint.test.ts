import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAcademyEndpoint } from './academy-endpoint.ts';

test('academy endpoints resolve empty, relative, and absolute API bases', () => {
  assert.equal(buildAcademyEndpoint('', 'login'), '/api/academy/login');
  assert.equal(buildAcademyEndpoint(' /api/ ', 'session'), '/api/academy/session');
  assert.equal(buildAcademyEndpoint('https://api.example.com/', 'logout'), 'https://api.example.com/academy/logout');
});
