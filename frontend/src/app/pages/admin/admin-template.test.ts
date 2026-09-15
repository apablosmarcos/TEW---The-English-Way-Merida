import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const indexPath = resolve(import.meta.dirname, '../../../index.html');

test('index.html defines an explicit favicon to avoid runtime 404 noise', () => {
  const indexHtml = readFileSync(indexPath, 'utf8');

  assert.match(indexHtml, /rel="icon"/);
  assert.match(indexHtml, /assets\/img\/TEW\.png/);
});
