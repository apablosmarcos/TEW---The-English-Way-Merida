import { constants } from "node:fs";
import { access, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

import { configureDatabase } from "./academy-migrations.ts";

const defaultDatabaseFileUrl = new URL("../../../data/tew.sqlite", import.meta.url);
const defaultFileStorageUrl = new URL("../../../data/uploads", import.meta.url);

export function openDatabase(env: NodeJS.ProcessEnv) {
  const database = new DatabaseSync(resolveDatabasePath(env));
  configureDatabase(database);
  return database;
}

export function initializeDatabase(_database: DatabaseSync) {}

export function importLegacyLeadsIfNeeded(
  _database: DatabaseSync,
  _env: NodeJS.ProcessEnv,
) {}

export function resolveDatabasePath(env: NodeJS.ProcessEnv) {
  return env.SQLITE_DB_PATH ?? fileURLToPath(defaultDatabaseFileUrl);
}

export function resolveFileStoragePath(env: NodeJS.ProcessEnv) {
  return env.FILE_STORAGE_PATH ?? fileURLToPath(defaultFileStorageUrl);
}

export async function ensureDatabaseDirectory(env: NodeJS.ProcessEnv) {
  const path = resolveDatabasePath(env);

  if (path === ":memory:") {
    return path;
  }

  await mkdir(dirname(path), { recursive: true });
  return path;
}

export async function ensureStorageDirectories(env: NodeJS.ProcessEnv) {
  await ensureDatabaseDirectory(env);
  const storagePath = resolveFileStoragePath(env);
  await mkdir(storagePath, { recursive: true });
  await access(storagePath, constants.W_OK);
}
