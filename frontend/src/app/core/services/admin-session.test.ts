import assert from 'node:assert/strict';
import test from 'node:test';

import { clearAdminSession, readAdminSessionToken, writeAdminSessionToken } from './admin-session.ts';

function createStorage() {
  const values = new Map<string, string>();

  return {
    getItem(key: string) {
      return values.has(key) ? values.get(key)! : null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
    removeItem(key: string) {
      values.delete(key);
    },
  };
}

test('admin session token can be stored and read back', () => {
  const storage = createStorage();

  writeAdminSessionToken(storage, 'token_123');

  assert.equal(readAdminSessionToken(storage), 'token_123');
});

test('admin session token can be cleared', () => {
  const storage = createStorage();

  writeAdminSessionToken(storage, 'token_123');
  clearAdminSession(storage);

  assert.equal(readAdminSessionToken(storage), null);
});
