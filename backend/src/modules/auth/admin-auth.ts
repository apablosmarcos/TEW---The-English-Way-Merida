import { createHash, timingSafeEqual } from 'node:crypto';

type AdminEnv = {
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
};

export function isValidAdminLogin(username: string, password: string, env: AdminEnv) {
  return username === env.ADMIN_USERNAME && password === env.ADMIN_PASSWORD;
}

export function createAdminToken(env: AdminEnv) {
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
    return '';
  }

  return createHash('sha256')
    .update(`${env.ADMIN_USERNAME}:${env.ADMIN_PASSWORD}`)
    .digest('hex');
}

export function isValidAdminToken(token: string, env: AdminEnv) {
  const expectedToken = createAdminToken(env);

  if (!token || !expectedToken || token.length !== expectedToken.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
}
