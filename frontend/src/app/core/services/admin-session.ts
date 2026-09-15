const ADMIN_SESSION_TOKEN_KEY = 'tew.admin.token';

type StorageLike = {
  getItem(key: string): string | null;
  removeItem(key: string): void;
};

function resolveStorage(storage?: StorageLike) {
  return storage ?? globalThis.sessionStorage;
}

export function readAdminSessionToken(storage?: StorageLike) {
  return resolveStorage(storage).getItem(ADMIN_SESSION_TOKEN_KEY);
}

export function clearAdminSession(storage?: StorageLike) {
  resolveStorage(storage).removeItem(ADMIN_SESSION_TOKEN_KEY);
}
