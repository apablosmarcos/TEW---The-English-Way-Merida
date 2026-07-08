import test from 'node:test';
import assert from 'node:assert/strict';
import { access, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

import { createLead, deleteLead, listLeads, updateLead } from './lead-repository.ts';
import { initializeDatabase, openDatabase } from '../storage/sqlite.ts';

test('createLead stores a new lead with empty notes', async () => {
  const sqliteDbPath = configureSqliteTestEnv();

  try {
    const result = await createLead({
      studentName: 'Ana',
      studentSurname: 'Perez',
      birthDate: '2014-05-10',
      address: 'Calle Mayor 1, Merida',
      email: 'ana@example.com',
      phone: '600000000',
      school: 'Colegio Ejemplo',
      currentCourse: '5 Primaria',
      primaryContactName: 'Laura',
      primaryContactSurname: 'Perez',
      primaryContactRelationship: 'Madre',
      secondaryContactName: null,
      secondaryContactSurname: null,
      secondaryContactRelationship: null,
      pickupContact: null,
      paymentMethod: 'bizum',
      paymentAccountHolder: null,
      paymentIban: null,
      observations: 'Sin observaciones',
      source: 'public-site',
    });

    assert.equal(typeof result.id, 'string');
    assert.notEqual(result.id, '');

    const leads = await listLeads();
    const lead = leads.find((entry: { id: string }) => entry.id === result.id);

     assert.ok(lead);
     assert.equal(lead.status, 'new');
     assert.equal(lead.notes, '');
  } finally {
    resetSqliteTestEnv();
    await rm(sqliteDbPath, { force: true });
  }
});

test('updateLead persists status and notes for an existing lead', async () => {
  const sqliteDbPath = configureSqliteTestEnv();

  try {
    const created = await createLead({
      studentName: 'Ana',
      studentSurname: 'Perez',
      birthDate: '2014-05-10',
      address: 'Calle Mayor 1, Merida',
      email: 'ana@example.com',
      phone: '600000000',
      school: 'Colegio Ejemplo',
      currentCourse: '5 Primaria',
      primaryContactName: 'Laura',
      primaryContactSurname: 'Perez',
      primaryContactRelationship: 'Madre',
      secondaryContactName: null,
      secondaryContactSurname: null,
      secondaryContactRelationship: null,
      pickupContact: null,
      paymentMethod: 'bizum',
      paymentAccountHolder: null,
      paymentIban: null,
      observations: 'Sin observaciones',
      source: 'public-site',
    });

    const updated = await updateLead(created.id, {
      status: 'contacted',
      notes: 'Llamada realizada',
    });

    assert.ok(updated);
    assert.equal(updated.status, 'contacted');
    assert.equal(updated.notes, 'Llamada realizada');

    const [storedLead] = await listLeads();

    assert.equal(storedLead.id, created.id);
     assert.equal(storedLead.status, 'contacted');
     assert.equal(storedLead.notes, 'Llamada realizada');
     assert.notEqual(storedLead.updatedAt, storedLead.createdAt);
  } finally {
    resetSqliteTestEnv();
    await rm(sqliteDbPath, { force: true });
  }
});

test('deleteLead removes an existing lead from storage', async () => {
  const sqliteDbPath = configureSqliteTestEnv();
  const deletedLeadsFilePath = join(tmpdir(), `tew-deleted-leads-${randomUUID()}.json`);

  try {
    const created = await createLead({
      studentName: 'Ana',
      studentSurname: 'Perez',
      birthDate: '2014-05-10',
      address: 'Calle Mayor 1, Merida',
      email: 'ana@example.com',
      phone: '600000000',
      school: 'Colegio Ejemplo',
      currentCourse: '5 Primaria',
      primaryContactName: 'Laura',
      primaryContactSurname: 'Perez',
      primaryContactRelationship: 'Madre',
      secondaryContactName: null,
      secondaryContactSurname: null,
      secondaryContactRelationship: null,
      pickupContact: null,
      paymentMethod: 'bizum',
      paymentAccountHolder: null,
      paymentIban: null,
      observations: 'Sin observaciones',
      source: 'public-site',
    });

    const deleted = await deleteLead(created.id, { username: 'admin', reason: 'duplicado' });
    assert.equal(deleted, true);

    const [remainingLead] = await listLeads();
    assert.equal(remainingLead, undefined);

    const allRows = readAllLeadRows(sqliteDbPath);
    assert.equal(allRows.length, 1);
    assert.equal(allRows[0].id, created.id);
    assert.equal(typeof allRows[0].deletedAt, 'string');
    assert.equal(allRows[0].deletedBy, 'admin');
    assert.equal(allRows[0].deletedReason, 'duplicado');
    await assert.rejects(access(deletedLeadsFilePath));
  } finally {
    resetSqliteTestEnv();
    await rm(sqliteDbPath, { force: true });
    await rm(deletedLeadsFilePath, { force: true });
  }
});

test('deleteLead returns false when the lead does not exist', async () => {
  const sqliteDbPath = configureSqliteTestEnv();

  try {
    assert.equal(await deleteLead('missing-lead', { username: 'admin' }), false);
  } finally {
    resetSqliteTestEnv();
    await rm(sqliteDbPath, { force: true });
  }
});

test('deleteLead is idempotent for an already deleted lead', async () => {
  const sqliteDbPath = configureSqliteTestEnv();

  try {
    const created = await createLead({
      studentName: 'Ana',
      studentSurname: 'Perez',
      birthDate: '2014-05-10',
      address: 'Calle Mayor 1, Merida',
      email: 'ana@example.com',
      phone: '600000000',
      school: 'Colegio Ejemplo',
      currentCourse: '5 Primaria',
      primaryContactName: 'Laura',
      primaryContactSurname: 'Perez',
      primaryContactRelationship: 'Madre',
      secondaryContactName: null,
      secondaryContactSurname: null,
      secondaryContactRelationship: null,
      pickupContact: null,
      paymentMethod: 'bizum',
      paymentAccountHolder: null,
      paymentIban: null,
      observations: 'Sin observaciones',
      source: 'public-site',
    });

    assert.equal(await deleteLead(created.id, { username: 'admin' }), true);
    assert.equal(await deleteLead(created.id, { username: 'admin' }), false);
    assert.deepEqual(await listLeads(), []);
  } finally {
    resetSqliteTestEnv();
    await rm(sqliteDbPath, { force: true });
  }
});

function readAllLeadRows(sqliteDbPath: string) {
  const database = openDatabase({ SQLITE_DB_PATH: sqliteDbPath });
  initializeDatabase(database);
  try {
    return database.prepare('SELECT * FROM leads').all() as Array<{
      id: string;
      deletedAt: string | null;
      deletedBy: string | null;
      deletedReason: string | null;
    }>;
  } finally {
    database.close();
  }
}

function configureSqliteTestEnv() {
  const sqliteDbPath = join(tmpdir(), `tew-leads-${randomUUID()}.sqlite`);
  process.env.SQLITE_DB_PATH = sqliteDbPath;
  process.env.LEGACY_LEADS_FILE_PATH = join(tmpdir(), `tew-legacy-missing-${randomUUID()}.json`);
  return sqliteDbPath;
}

function resetSqliteTestEnv() {
  delete process.env.SQLITE_DB_PATH;
  delete process.env.LEGACY_LEADS_FILE_PATH;
}
