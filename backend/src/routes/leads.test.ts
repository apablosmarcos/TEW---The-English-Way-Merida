import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

import { createApp } from '../app.ts';

test('POST /api/leads returns 201 and leadId for a valid payload', async () => {
  const sqliteDbPath = join(tmpdir(), `tew-leads-${randomUUID()}.sqlite`);
  process.env.SQLITE_DB_PATH = sqliteDbPath;
  process.env.LEGACY_LEADS_FILE_PATH = join(tmpdir(), `tew-legacy-missing-${randomUUID()}.json`);

  const server = createServer(createApp());

  try {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();

    if (!address || typeof address === 'string') {
      throw new Error('Test server did not expose a port');
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/api/leads`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
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
        secondaryContactName: 'Juan',
        secondaryContactSurname: 'Perez',
        secondaryContactRelationship: 'Padre',
        pickupContact: 'Rocio Perez - Tia',
        paymentMethod: 'bizum',
        paymentAccountHolder: 'Laura Perez',
        paymentIban: 'ES7620770024003102575766',
        observations: '',
        source: 'public-site',
      }),
    });

    assert.equal(response.status, 201);

    const body = (await response.json()) as { ok?: unknown; leadId?: unknown };

    assert.equal(body.ok, true);
    assert.equal(typeof body.leadId, 'string');
    assert.notEqual(body.leadId, '');
  } finally {
    delete process.env.SQLITE_DB_PATH;
    delete process.env.LEGACY_LEADS_FILE_PATH;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await rm(sqliteDbPath, { force: true });
  }
});

test('POST /api/leads returns 500 when lead storage fails', async () => {
  process.env.SQLITE_DB_PATH = tmpdir();
  process.env.LEGACY_LEADS_FILE_PATH = join(tmpdir(), `tew-legacy-missing-${randomUUID()}.json`);

  const server = createServer(createApp());

  try {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();

    if (!address || typeof address === 'string') {
      throw new Error('Test server did not expose a port');
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/api/leads`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
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
        secondaryContactName: 'Juan',
        secondaryContactSurname: 'Perez',
        secondaryContactRelationship: 'Padre',
        pickupContact: 'Rocio Perez - Tia',
        paymentMethod: 'bizum',
        paymentAccountHolder: 'Laura Perez',
        paymentIban: 'ES7620770024003102575766',
        observations: '',
        source: 'public-site',
      }),
    });

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), {
      ok: false,
      error: 'Internal server error',
    });
  } finally {
    delete process.env.SQLITE_DB_PATH;
    delete process.env.LEGACY_LEADS_FILE_PATH;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
