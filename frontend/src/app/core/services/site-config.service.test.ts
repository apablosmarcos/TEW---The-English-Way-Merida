import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  SITE_CONFIG_URL,
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

test('site config uses a root-relative asset url', () => {
  assert.equal(SITE_CONFIG_URL, '/assets/config/site.config.json');
});

test('index.html defines a root base href so assets work on admin routes', () => {
  const indexHtml = readFileSync(new URL('../../../index.html', import.meta.url), 'utf8');

  assert.match(indexHtml, /<base href="\/"\s*\/>/);
});
