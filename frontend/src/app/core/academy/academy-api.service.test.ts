import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./academy-api.service.ts', import.meta.url), 'utf8');

test('academy API uses the aligned HTTP contract', () => {
  assert.match(source, /post<AcademySuccess<AcademyLogin>>\(buildAcademyEndpoint\(apiBaseUrl, 'login'\), body\)/);
  assert.match(source, /get<AcademySuccess<AcademySession>>\(buildAcademyEndpoint\(apiBaseUrl, 'session'\), \{\s*headers: \{ Authorization: `Bearer \$\{token\}` \}/);
  assert.match(source, /post<void>\(buildAcademyEndpoint\(apiBaseUrl, 'logout'\), null, \{\s*headers: \{ Authorization: `Bearer \$\{token\}` \}/);
  assert.match(source, /post<void>\(buildAcademyEndpoint\(apiBaseUrl, 'me\/password'\), body, \{\s*headers: \{ Authorization: `Bearer \$\{token\}` \}/);
  assert.match(source, /get<AcademySuccess<AcademyParentPostList>>\(buildAcademyEndpoint\(apiBaseUrl, 'posts'\), \{\s*headers: \{ Authorization: `Bearer \$\{token\}` \},\s*params: parentPostParams\(query\)/);
  assert.match(source, /new HttpParams\(\{ fromObject: params \}\)/);
});
