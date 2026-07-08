import { readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const defaultDatabaseFileUrl = new URL('../../../data/tew.sqlite', import.meta.url);

export function openDatabase(env: NodeJS.ProcessEnv) {
  const path = resolveDatabasePath(env);
  return new DatabaseSync(path);
}

export function initializeDatabase(database: DatabaseSync) {
  database.exec('PRAGMA journal_mode = WAL');
  database.exec(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      message TEXT NOT NULL,
      interestType TEXT,
      source TEXT NOT NULL,
      studentName TEXT NOT NULL,
      studentSurname TEXT NOT NULL,
      birthDate TEXT NOT NULL,
      address TEXT NOT NULL,
      school TEXT NOT NULL,
      currentCourse TEXT NOT NULL,
      primaryContactName TEXT NOT NULL,
      primaryContactSurname TEXT NOT NULL,
      primaryContactRelationship TEXT NOT NULL,
      secondaryContactName TEXT,
      secondaryContactSurname TEXT,
      secondaryContactRelationship TEXT,
      pickupContact TEXT,
      paymentMethod TEXT NOT NULL,
      paymentAccountHolder TEXT,
      paymentIban TEXT,
      observations TEXT,
      status TEXT NOT NULL,
      notes TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS admin_sessions (
      tokenHash TEXT PRIMARY KEY,
      createdAt TEXT NOT NULL,
      expiresAt TEXT NOT NULL
    ) STRICT;
  `);

  ensureLeadsSoftDeleteColumns(database);
}

function ensureLeadsSoftDeleteColumns(database: DatabaseSync) {
  const columns = database
    .prepare('PRAGMA table_info(leads)')
    .all() as Array<{ name: string }>;
  const existingColumns = new Set(columns.map((column) => column.name));
  const columnsToAdd = [
    { name: 'deletedAt', type: 'TEXT' },
    { name: 'deletedBy', type: 'TEXT' },
    { name: 'deletedReason', type: 'TEXT' },
  ];

  for (const column of columnsToAdd) {
    if (!existingColumns.has(column.name)) {
      database.exec(`ALTER TABLE leads ADD COLUMN ${column.name} ${column.type}`);
    }
  }
}

export function importLegacyLeadsIfNeeded(database: DatabaseSync, env: NodeJS.ProcessEnv) {
  const legacyPath = resolveLegacyLeadsFilePath(env);

  if (!legacyPath) {
    return;
  }

  const importKey = buildLegacyImportKey(legacyPath);
  const imported = database.prepare('SELECT value FROM app_meta WHERE key = ?').get(importKey);

  if (imported) {
    return;
  }

  const row = database.prepare('SELECT COUNT(*) as count FROM leads').get() as { count: number };

  if (row.count > 0) {
    database.prepare('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)').run(importKey, new Date().toISOString());
    return;
  }

  const legacyLeads = readLegacyLeads(legacyPath);

  if (legacyLeads.length === 0) {
    database.prepare('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)').run(importKey, new Date().toISOString());
    return;
  }

  const insert = database.prepare(`
    INSERT INTO leads (
      id, name, email, phone, message, interestType, source,
      studentName, studentSurname, birthDate, address, school, currentCourse,
      primaryContactName, primaryContactSurname, primaryContactRelationship,
      secondaryContactName, secondaryContactSurname, secondaryContactRelationship,
      pickupContact, paymentMethod, paymentAccountHolder, paymentIban, observations,
      status, notes, createdAt, updatedAt
    ) VALUES (
      @id, @name, @email, @phone, @message, @interestType, @source,
      @studentName, @studentSurname, @birthDate, @address, @school, @currentCourse,
      @primaryContactName, @primaryContactSurname, @primaryContactRelationship,
      @secondaryContactName, @secondaryContactSurname, @secondaryContactRelationship,
      @pickupContact, @paymentMethod, @paymentAccountHolder, @paymentIban, @observations,
      @status, @notes, @createdAt, @updatedAt
    )
  `);

  for (const lead of legacyLeads) {
    insert.run(normalizeLegacyLead(lead));
  }

  database.prepare('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)').run(importKey, new Date().toISOString());
}

export function resolveDatabasePath(env: NodeJS.ProcessEnv) {
  return env.SQLITE_DB_PATH ?? fileURLToPath(defaultDatabaseFileUrl);
}

function resolveLegacyLeadsFilePath(env: NodeJS.ProcessEnv) {
  const configuredPath = env.LEGACY_LEADS_FILE_PATH?.trim();
  return configuredPath ? configuredPath : '';
}

function buildLegacyImportKey(path: string) {
  return `legacy-import:${path}`;
}

export async function ensureDatabaseDirectory(env: NodeJS.ProcessEnv) {
  const path = resolveDatabasePath(env);

  if (path === ':memory:') {
    return path;
  }

  await mkdir(dirname(path), { recursive: true });
  return path;
}

function readLegacyLeads(path: string) {
  if (!path) {
    return [];
  }

  try {
    const content = readFileSync(path, 'utf8');
    const parsed = JSON.parse(content);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

function normalizeLegacyLead(input: Record<string, unknown>) {
  const name = readString(input.name);
  const [studentName, ...surnameParts] = name.split(' ');
  const studentSurname = surnameParts.join(' ').trim();
  const createdAt = readString(input.createdAt) || new Date(0).toISOString();
  const updatedAt = readString(input.updatedAt) || createdAt;

  return {
    id: readString(input.id),
    name,
    email: readString(input.email),
    phone: readNullableString(input.phone),
    message: readString(input.message),
    interestType: readNullableString(input.interestType),
    source: readString(input.source) || 'public-site',
    studentName: readString(input.studentName) || studentName || name,
    studentSurname: readString(input.studentSurname) || studentSurname,
    birthDate: readString(input.birthDate),
    address: readString(input.address),
    school: readString(input.school),
    currentCourse: readString(input.currentCourse),
    primaryContactName: readString(input.primaryContactName),
    primaryContactSurname: readString(input.primaryContactSurname),
    primaryContactRelationship: readString(input.primaryContactRelationship),
    secondaryContactName: readNullableString(input.secondaryContactName),
    secondaryContactSurname: readNullableString(input.secondaryContactSurname),
    secondaryContactRelationship: readNullableString(input.secondaryContactRelationship),
    pickupContact: readNullableString(input.pickupContact),
    paymentMethod: readString(input.paymentMethod),
    paymentAccountHolder: readNullableString(input.paymentAccountHolder),
    paymentIban: readNullableString(input.paymentIban),
    observations: readNullableString(input.observations),
    status: readString(input.status) || 'new',
    notes: readString(input.notes),
    createdAt,
    updatedAt,
  };
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function readNullableString(value: unknown) {
  const normalized = readString(value);
  return normalized === '' ? null : normalized;
}
