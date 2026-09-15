import assert from 'node:assert/strict';
import test from 'node:test';

const { buildAdminLeadsEndpoint, buildAdminLeadDetailEndpoint } = await import(
  new URL('./admin-endpoint.ts', import.meta.url).href,
);

test('admin endpoints support relative apiBaseUrl values like /api', () => {
  assert.equal(buildAdminLeadsEndpoint('/api'), '/api/admin/leads');
  assert.equal(buildAdminLeadDetailEndpoint('/api', 'lead_123'), '/api/admin/leads/lead_123');
});

test('admin endpoints keep absolute apiBaseUrl support', () => {
  assert.equal(buildAdminLeadsEndpoint('https://api.example.com'), 'https://api.example.com/admin/leads');
  assert.equal(buildAdminLeadDetailEndpoint('https://api.example.com', 'lead_123'), 'https://api.example.com/admin/leads/lead_123');
});
