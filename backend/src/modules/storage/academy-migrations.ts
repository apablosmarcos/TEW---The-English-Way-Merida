import { DatabaseSync } from 'node:sqlite';

export type AcademyMigration = {
  version: number;
  sql: string;
};

export const academyMigrations: readonly AcademyMigration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        displayName TEXT NOT NULL,
        username TEXT NOT NULL,
        normalizedUsername TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('parent', 'admin')),
        passwordHash TEXT NOT NULL,
        mustChangePassword INTEGER NOT NULL CHECK (mustChangePassword IN (0, 1)),
        disabledAt TEXT,
        deletedAt TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      ) STRICT;
      CREATE UNIQUE INDEX IF NOT EXISTS users_normalized_username_active
        ON users(normalizedUsername) WHERE deletedAt IS NULL;

      CREATE TABLE IF NOT EXISTS sessions (
        tokenHash TEXT PRIMARY KEY CHECK (length(tokenHash) = 64),
        userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        createdAt TEXT NOT NULL,
        lastSeenAt TEXT NOT NULL,
        expiresAt TEXT NOT NULL
      ) STRICT;
      CREATE INDEX IF NOT EXISTS sessions_user_id ON sessions(userId);
      CREATE INDEX IF NOT EXISTS sessions_expires_at ON sessions(expiresAt);

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        displayName TEXT NOT NULL,
        normalizedName TEXT NOT NULL UNIQUE,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      ) STRICT;

      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        markdownSource TEXT NOT NULL,
        categoryId TEXT REFERENCES categories(id),
        visibility TEXT NOT NULL CHECK (visibility IN ('visible', 'hidden', 'deleted')),
        publishedAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT,
        CHECK ((visibility = 'deleted') = (deletedAt IS NOT NULL))
      ) STRICT;
      CREATE INDEX IF NOT EXISTS posts_visibility_published_at ON posts(visibility, publishedAt DESC);
      CREATE INDEX IF NOT EXISTS posts_category_id ON posts(categoryId);
      CREATE INDEX IF NOT EXISTS posts_updated_at ON posts(updatedAt);

      CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        postId TEXT NOT NULL REFERENCES posts(id),
        storageId TEXT NOT NULL UNIQUE,
        extension TEXT NOT NULL CHECK (extension IN ('pdf', 'jpg', 'png', 'webp')),
        mimeType TEXT NOT NULL CHECK (mimeType IN ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
        byteSize INTEGER NOT NULL CHECK (byteSize BETWEEN 0 AND 20971520),
        visibleTitle TEXT,
        materialOrdinal INTEGER NOT NULL CHECK (materialOrdinal > 0),
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT,
        UNIQUE(postId, materialOrdinal)
      ) STRICT;
      CREATE INDEX IF NOT EXISTS attachments_post_id ON attachments(postId);

      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY,
        actorUserId TEXT REFERENCES users(id),
        action TEXT NOT NULL,
        entityType TEXT NOT NULL,
        entityId TEXT NOT NULL,
        createdAt TEXT NOT NULL
      ) STRICT;
      CREATE INDEX IF NOT EXISTS audit_log_created_at ON audit_log(createdAt);
      CREATE INDEX IF NOT EXISTS audit_log_entity ON audit_log(entityType, entityId);
    `,
  },
];

export function configureDatabase(database: DatabaseSync) {
  database.exec('PRAGMA foreign_keys = ON');
  database.exec('PRAGMA busy_timeout = 5000');
  database.exec('PRAGMA journal_mode = WAL');
}

export function applyAcademyMigrations(database: DatabaseSync, migrations = academyMigrations) {
  configureDatabase(database);

  const currentVersion = (database.prepare('PRAGMA user_version').get() as { user_version: number }).user_version;
  const newestVersion = migrations.at(-1)?.version ?? 0;

  if (currentVersion > newestVersion) {
    throw new Error(`Database version ${currentVersion} is newer than supported version ${newestVersion}.`);
  }

  for (const migration of migrations) {
    if (migration.version <= currentVersion) {
      continue;
    }

    database.exec('BEGIN IMMEDIATE');
    try {
      database.exec(migration.sql);
      database.exec(`PRAGMA user_version = ${migration.version}`);
      database.exec('COMMIT');
    } catch (error) {
      database.exec('ROLLBACK');
      throw error;
    }
  }
}
