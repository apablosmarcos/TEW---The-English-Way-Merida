import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createAdminSession, isValidAdminSessionToken, storeAdminSession } from './admin-session-repository.ts';

test('createAdminSession returns a different token on each login', () => {
  const first = createAdminSession({ ADMIN_SESSION_TTL_HOURS: '8' } as NodeJS.ProcessEnv);
  const second = createAdminSession({ ADMIN_SESSION_TTL_HOURS: '8' } as NodeJS.ProcessEnv);

  assert.notEqual(first.token, second.token);
  assert.equal(typeof first.expiresAt, 'string');
  assert.equal(typeof second.expiresAt, 'string');
});

test('isValidAdminSessionToken rejects expired sessions', async () => {
  const sqliteDbPath = join(tmpdir(), `tew-admin-sessions-${randomUUID()}.sqlite`);
  process.env.SQLITE_DB_PATH = sqliteDbPath;
  process.env.LEGACY_LEADS_FILE_PATH = join(tmpdir(), `tew-legacy-missing-${randomUUID()}.json`);

  try {
    const session = createAdminSession({ ADMIN_SESSION_TTL_HOURS: '8' } as NodeJS.ProcessEnv);
    storeAdminSession(session.token, '2000-01-01T00:00:00.000Z', process.env);

    assert.equal(isValidAdminSessionToken(session.token, process.env), false);
  } finally {
    delete process.env.SQLITE_DB_PATH;
    delete process.env.LEGACY_LEADS_FILE_PATH;
    await rm(sqliteDbPath, { force: true });
  }
});
