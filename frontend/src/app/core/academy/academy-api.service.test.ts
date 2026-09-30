import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./academy-api.service.ts', import.meta.url), 'utf8');
const types = readFileSync(new URL('./academy-types.ts', import.meta.url), 'utf8');
const main = readFileSync(new URL('../../../main.ts', import.meta.url), 'utf8');
const { ACADEMY_ERROR_CODES } = await import(
  new URL('./academy-types.ts', import.meta.url).href
);

test('academy API uses the aligned HTTP contract', () => {
  assert.match(source, /post<AcademySuccess<AcademyLogin>>\(buildAcademyEndpoint\(apiBaseUrl, 'login'\), body\)/);
  assert.match(source, /get<AcademySuccess<AcademySession>>\(buildAcademyEndpoint\(apiBaseUrl, 'session'\), \{\s*headers: \{ Authorization: `Bearer \$\{token\}` \}/);
  assert.match(source, /post<void>\(buildAcademyEndpoint\(apiBaseUrl, 'logout'\), null, \{\s*headers: \{ Authorization: `Bearer \$\{token\}` \}/);
  assert.match(source, /post<void>\(buildAcademyEndpoint\(apiBaseUrl, 'me\/password'\), body, \{\s*headers: \{ Authorization: `Bearer \$\{token\}` \}/);
  assert.match(source, /get<AcademySuccess<AcademyParentPostList>>\(buildAcademyEndpoint\(apiBaseUrl, 'posts'\), \{\s*headers: \{ Authorization: `Bearer \$\{token\}` \},\s*params: parentPostParams\(query\)/);
  assert.match(source, /new HttpParams\(\{ fromObject: params \}\)/);
});

test('frontend Academy error codes exactly match the backend structured contract', () => {
  assert.deepEqual(ACADEMY_ERROR_CODES, [
    'INVALID_CREDENTIALS',
    'AUTHENTICATION_REQUIRED',
    'PASSWORD_CHANGE_REQUIRED',
    'FORBIDDEN',
    'VALIDATION_ERROR',
    'RATE_LIMITED',
    'INTERNAL_ERROR',
    'LAST_ACTIVE_ADMIN',
    'USER_DELETED',
    'USER_NOT_FOUND',
    'USERNAME_TAKEN',
    'CATEGORY_IN_USE',
    'CATEGORY_NAME_TAKEN',
    'CATEGORY_NOT_FOUND',
    'POST_DELETED',
    'POST_NOT_FOUND',
    'ATTACHMENT_DELETED',
    'ATTACHMENT_LIMIT',
    'ATTACHMENT_NOT_FOUND',
    'UNSUPPORTED_FILE_TYPE',
    'UPLOAD_TOO_LARGE',
  ]);
  assert.doesNotMatch(types, /RESOURCE_STATE_CONFLICT/);
});

test('post list and detail contracts remain distinct', () => {
  assert.match(types, /export type AcademyAdminPostSummary =/);
  assert.match(types, /export type AcademyAdminPostDetail = AcademyAdminPostSummary &/);
  assert.match(types, /AcademyAdminPostList = \{ items: AcademyAdminPostSummary\[\] \}/);
  assert.match(source, /get<AcademySuccess<AcademyAdminPostDetail>>/);
  assert.match(source, /post<AcademySuccess<AcademyAdminPostDetail>>/);
  assert.match(source, /patch<AcademySuccess<AcademyAdminPostDetail>>/);
});

test('Academy dates use es-ES presentation in the browser local timezone', () => {
  assert.match(main, /registerLocaleData\(localeEs\)/);
  assert.match(main, /provide: LOCALE_ID, useValue: 'es-ES'/);
  assert.doesNotMatch(main, /DATE_PIPE_DEFAULT_OPTIONS|timezone/);
  assert.match(types, /publishedAt: string/);
  assert.match(types, /updatedAt: string/);
});
