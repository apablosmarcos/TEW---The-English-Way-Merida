const ADMIN_SESSION_TOKEN_KEY = 'tew.admin.token';

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function resolveStorage(storage?: StorageLike) {
  return storage ?? globalThis.sessionStorage;
}

export function readAdminSessionToken(storage?: StorageLike) {
  return resolveStorage(storage).getItem(ADMIN_SESSION_TOKEN_KEY);
}

export function writeAdminSessionToken(storage: StorageLike | undefined, token: string) {
  resolveStorage(storage).setItem(ADMIN_SESSION_TOKEN_KEY, token);
}

export function clearAdminSession(storage?: StorageLike) {
  resolveStorage(storage).removeItem(ADMIN_SESSION_TOKEN_KEY);
}
