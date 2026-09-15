import assert from 'node:assert/strict';
import test from 'node:test';

const { clearAdminSession, readAdminSessionToken } = await import(
  new URL('./admin-session.ts', import.meta.url).href,
);

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

test('admin session token can be read from storage', () => {
  const storage = createStorage();

  storage.setItem('tew.admin.token', 'token_123');

  assert.equal(readAdminSessionToken(storage), 'token_123');
});

test('admin session token can be cleared', () => {
  const storage = createStorage();

  storage.setItem('tew.admin.token', 'token_123');
  clearAdminSession(storage);

  assert.equal(readAdminSessionToken(storage), null);
});
