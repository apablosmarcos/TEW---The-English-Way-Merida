import assert from 'node:assert/strict';
import { rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';

import { importLegacyLeadsIfNeeded, initializeDatabase } from './sqlite.ts';

test('initializeDatabase creates leads and admin_sessions tables', () => {
  const database = new DatabaseSync(':memory:');

  initializeDatabase(database);

  const rows = database
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    .all() as Array<{ name: string }>;

  assert.deepEqual(
    rows.map((row) => row.name).filter((name) => !name.startsWith('sqlite_')),
    ['admin_sessions', 'app_meta', 'leads'],
  );
});

test('importLegacyLeadsIfNeeded imports leads from a legacy json file once', async () => {
  const database = new DatabaseSync(':memory:');
  const legacyLeadsPath = join(tmpdir(), `tew-legacy-leads-${randomUUID()}.json`);

  initializeDatabase(database);

  await writeFile(
    legacyLeadsPath,
    JSON.stringify([
      {
        id: 'lead-1',
        name: 'Ana Perez',
        email: 'ana@example.com',
        phone: '600000000',
        message: 'Colegio Ejemplo · 5 Primaria · Madre: Laura Perez · Pago: bizum',
        interestType: null,
        source: 'public-site',
        studentName: 'Ana',
        studentSurname: 'Perez',
        birthDate: '2014-05-10',
        address: 'Calle Mayor 1, Merida',
        school: 'Colegio Ejemplo',
        currentCourse: '5 Primaria',
        primaryContactName: 'Laura',
        primaryContactSurname: 'Perez',
        primaryContactRelationship: 'Madre',
        secondaryContactName: 'Juan',
        secondaryContactSurname: 'Perez',
        secondaryContactRelationship: 'Padre',
        pickupContact: 'Rocio Perez - Tia',
        paymentMethod: 'bizum',
        paymentAccountHolder: 'Laura Perez',
        paymentIban: 'ES7620770024003102575766',
        observations: 'Alergia alimentaria',
        status: 'new',
        notes: '',
        createdAt: '2026-07-08T00:00:00.000Z',
        updatedAt: '2026-07-08T00:00:00.000Z',
      },
    ]),
  );

  try {
    importLegacyLeadsIfNeeded(database, {
      LEGACY_LEADS_FILE_PATH: legacyLeadsPath,
    } as NodeJS.ProcessEnv);

    const row = database.prepare('SELECT COUNT(*) as count FROM leads').get() as { count: number };
    assert.equal(row.count, 1);
  } finally {
    await rm(legacyLeadsPath, { force: true });
  }
});

test('importLegacyLeadsIfNeeded skips legacy import when no explicit legacy path is configured', () => {
  const database = new DatabaseSync(':memory:');

  initializeDatabase(database);
  importLegacyLeadsIfNeeded(database, {} as NodeJS.ProcessEnv);

  const row = database.prepare('SELECT COUNT(*) as count FROM leads').get() as { count: number };
  assert.equal(row.count, 0);
});

test('importLegacyLeadsIfNeeded does not reimport after the imported rows were later deleted', async () => {
  const database = new DatabaseSync(':memory:');
  const legacyLeadsPath = join(tmpdir(), `tew-legacy-leads-${randomUUID()}.json`);

  initializeDatabase(database);

  await writeFile(
    legacyLeadsPath,
    JSON.stringify([
      {
        id: 'lead-1',
        name: 'Ana Perez',
        email: 'ana@example.com',
        phone: '600000000',
        message: 'Colegio Ejemplo · 5 Primaria · Madre: Laura Perez · Pago: bizum',
        interestType: null,
        source: 'public-site',
        studentName: 'Ana',
        studentSurname: 'Perez',
        birthDate: '2014-05-10',
        address: 'Calle Mayor 1, Merida',
        school: 'Colegio Ejemplo',
        currentCourse: '5 Primaria',
        primaryContactName: 'Laura',
        primaryContactSurname: 'Perez',
        primaryContactRelationship: 'Madre',
        secondaryContactName: 'Juan',
        secondaryContactSurname: 'Perez',
        secondaryContactRelationship: 'Padre',
        pickupContact: 'Rocio Perez - Tia',
        paymentMethod: 'bizum',
        paymentAccountHolder: 'Laura Perez',
        paymentIban: 'ES7620770024003102575766',
        observations: 'Alergia alimentaria',
        status: 'new',
        notes: '',
        createdAt: '2026-07-08T00:00:00.000Z',
        updatedAt: '2026-07-08T00:00:00.000Z',
      },
    ]),
  );

  try {
    const env = {
      LEGACY_LEADS_FILE_PATH: legacyLeadsPath,
    } as NodeJS.ProcessEnv;

    importLegacyLeadsIfNeeded(database, env);
    database.prepare('DELETE FROM leads').run();
    importLegacyLeadsIfNeeded(database, env);

    const row = database.prepare('SELECT COUNT(*) as count FROM leads').get() as { count: number };
    assert.equal(row.count, 0);
  } finally {
    await rm(legacyLeadsPath, { force: true });
  }
});
