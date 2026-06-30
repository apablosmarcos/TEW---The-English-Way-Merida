import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SITE_CONFIG_LOAD_ERROR_MESSAGE,
  toSiteConfigErrorState,
  toSiteConfigReadyState,
} from './site-config-state.ts';

test('site config keeps demo mode only for a valid config with empty apiBaseUrl', () => {
  const result = toSiteConfigReadyState({
    brandName: 'TEW',
    apiBaseUrl: '   ',
    contactEmail: 'team@example.com',
  });

  assert.equal(result.status, 'ready');
  assert.equal(result.config.apiBaseUrl, '');
});

test('site config load errors stay distinct from demo mode', () => {
  const result = toSiteConfigErrorState();

  assert.equal(result.status, 'error');
  assert.equal(result.message, SITE_CONFIG_LOAD_ERROR_MESSAGE);
  assert.equal(result.config.apiBaseUrl, '');
});
