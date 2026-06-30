import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAdminLeadsEndpoint,
  buildAdminLoginEndpoint,
  buildAdminLeadDetailEndpoint,
} from './admin-endpoint.ts';

test('admin endpoints support relative apiBaseUrl values like /api', () => {
  assert.equal(buildAdminLoginEndpoint('/api'), '/api/admin/login');
  assert.equal(buildAdminLeadsEndpoint('/api'), '/api/admin/leads');
  assert.equal(buildAdminLeadDetailEndpoint('/api', 'lead_123'), '/api/admin/leads/lead_123');
});

test('admin endpoints keep absolute apiBaseUrl support', () => {
  assert.equal(buildAdminLoginEndpoint('https://api.example.com'), 'https://api.example.com/admin/login');
  assert.equal(buildAdminLeadsEndpoint('https://api.example.com'), 'https://api.example.com/admin/leads');
});
