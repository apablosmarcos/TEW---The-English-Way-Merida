import assert from 'node:assert/strict';
import test from 'node:test';

import { parentPostQuery, parentPostQueryParams, withParentPostFilters, withParentPostPage } from './academy-list-state.ts';

test('parses only safe parent post query values and serializes Todas without categoryId', () => {
  assert.deepEqual(parentPostQuery(new URLSearchParams('search=%20hello%20&categoryId=not-an-id&page=0')), { search: 'hello', categoryId: null, page: 1 });
  assert.deepEqual(parentPostQueryParams({ search: 'hello', categoryId: null, page: 1 }), { search: 'hello' });
  assert.deepEqual(parentPostQueryParams({ search: '', categoryId: '9c858901-8a57-4791-81fe-4c455b099bc9', page: 3 }), { categoryId: '9c858901-8a57-4791-81fe-4c455b099bc9', page: '3' });
});

test('filter changes reset pagination while page changes preserve filters', () => {
  const query = { search: 'old', categoryId: null, page: 3 };
  assert.deepEqual(withParentPostFilters(query, 'new', '9c858901-8a57-4791-81fe-4c455b099bc9'), { search: 'new', categoryId: '9c858901-8a57-4791-81fe-4c455b099bc9', page: 1 });
  assert.deepEqual(withParentPostPage(query, 2), { ...query, page: 2 });
});
