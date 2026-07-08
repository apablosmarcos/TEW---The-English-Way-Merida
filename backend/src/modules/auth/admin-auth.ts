import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

type AdminEnv = {
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_TTL_HOURS?: string;
};

export function isValidAdminLogin(username: string, password: string, env: AdminEnv) {
  return isSafeEqual(username, env.ADMIN_USERNAME) && isSafeEqual(password, env.ADMIN_PASSWORD);
}

export function createAdminSessionToken() {
  return randomBytes(32).toString('hex');
}

export function hashAdminSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function createAdminSession(env: AdminEnv) {
  const token = createAdminSessionToken();
  const expiresAt = new Date(Date.now() + resolveAdminSessionTtlHours(env) * 60 * 60 * 1000).toISOString();

  return { token, expiresAt };
}

function isSafeEqual(value: string, expected: string | undefined) {
  if (!expected || value.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}

function resolveAdminSessionTtlHours(env: AdminEnv) {
  const parsed = Number.parseInt(env.ADMIN_SESSION_TTL_HOURS ?? '8', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 8;
}
