import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import { initializeDatabase, openDatabase, resolveDatabasePath } from '../storage/sqlite.ts';
import { createAdminSession, hashAdminSessionToken } from './admin-auth.ts';

export { createAdminSession };

export function storeAdminSession(token: string, expiresAt: string, env: NodeJS.ProcessEnv) {
  return withDatabase(env, (database) => {
    deleteExpiredSessions(database);
    database.prepare(
      'INSERT OR REPLACE INTO admin_sessions (tokenHash, createdAt, expiresAt) VALUES (?, ?, ?)',
    ).run(hashAdminSessionToken(token), new Date().toISOString(), expiresAt);
  });
}

export function isValidAdminSessionToken(token: string, env: NodeJS.ProcessEnv) {
  return withDatabase(env, (database) => {
    deleteExpiredSessions(database);
    const row = database
      .prepare('SELECT expiresAt FROM admin_sessions WHERE tokenHash = ?')
      .get(hashAdminSessionToken(token)) as { expiresAt: string } | undefined;

    return !!row && Date.parse(row.expiresAt) > Date.now();
  });
}

export function deleteExpiredAdminSessions(env: NodeJS.ProcessEnv) {
  return withDatabase(env, (database) => {
    deleteExpiredSessions(database);
  });
}

function withDatabase<T>(env: NodeJS.ProcessEnv, action: (database: ReturnType<typeof openDatabase>) => T) {
  ensureSessionDatabaseDirectory(env);
  const database = openDatabase(env);

  try {
    initializeDatabase(database);
    return action(database);
  } finally {
    database.close();
  }
}

function ensureSessionDatabaseDirectory(env: NodeJS.ProcessEnv) {
  const path = resolveDatabasePath(env);

  if (path === ':memory:') {
    return;
  }

  mkdirSync(dirname(path), { recursive: true });
}

function deleteExpiredSessions(database: ReturnType<typeof openDatabase>) {
  database.prepare('DELETE FROM admin_sessions WHERE expiresAt <= ?').run(new Date().toISOString());
}
