import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

import { createApp } from '../app.ts';
import { storeAdminSession } from '../modules/auth/admin-session-repository.ts';

test('POST /api/admin/login returns 401 for invalid credentials', async () => {
  process.env.ADMIN_USERNAME = 'admin';
  process.env.ADMIN_PASSWORD = 'secret';

  const server = createServer(createApp());

  try {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();

    if (!address || typeof address === 'string') {
      throw new Error('Test server did not expose a port');
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/api/admin/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'wrong',
      }),
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { ok: false });
  } finally {
    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test('authenticated admin can list, update and delete leads', async () => {
  const sqliteDbPath = join(tmpdir(), `tew-admin-leads-${randomUUID()}.sqlite`);
  process.env.SQLITE_DB_PATH = sqliteDbPath;
  process.env.LEGACY_LEADS_FILE_PATH = join(tmpdir(), `tew-legacy-missing-${randomUUID()}.json`);
  process.env.ADMIN_USERNAME = 'admin';
  process.env.ADMIN_PASSWORD = 'secret';

  const server = createServer(createApp());

  try {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();

    if (!address || typeof address === 'string') {
      throw new Error('Test server did not expose a port');
    }

    const baseUrl = `http://127.0.0.1:${address.port}`;

    const createResponse = await fetch(`${baseUrl}/api/leads`, {
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
        observations: 'Alergia alimentaria',
        source: 'public-site',
      }),
    });

    assert.equal(createResponse.status, 201);
    const createdBody = (await createResponse.json()) as { leadId: string };

    const loginResponse = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'secret',
      }),
    });

    assert.equal(loginResponse.status, 200);
    const loginBody = (await loginResponse.json()) as { ok: boolean; token: string; expiresAt: string };

    assert.equal(loginBody.ok, true);
    assert.equal(typeof loginBody.token, 'string');
    assert.notEqual(loginBody.token, '');
    assert.equal(typeof loginBody.expiresAt, 'string');

    const listResponse = await fetch(`${baseUrl}/api/admin/leads`, {
      headers: {
        authorization: `Bearer ${loginBody.token}`,
      },
    });

    assert.equal(listResponse.status, 200);
    const listBody = (await listResponse.json()) as {
      ok: boolean;
      leads: Array<{ id: string; status: string; notes: string; updatedAt: string }>;
    };

    assert.equal(listBody.ok, true);
    assert.equal(listBody.leads.length, 1);
    assert.equal(listBody.leads[0].id, createdBody.leadId);
    assert.equal((listBody.leads[0] as { studentName?: string }).studentName, 'Ana');
    assert.equal(listBody.leads[0].status, 'new');

    const patchResponse = await fetch(`${baseUrl}/api/admin/leads/${createdBody.leadId}`, {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${loginBody.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        status: 'contacted',
        notes: 'Pendiente de visita',
      }),
    });

    assert.equal(patchResponse.status, 200);
    const patchBody = (await patchResponse.json()) as {
      ok: boolean;
      lead: { id: string; status: string; notes: string; updatedAt: string };
    };

    assert.equal(patchBody.ok, true);
    assert.equal(patchBody.lead.id, createdBody.leadId);
    assert.equal(patchBody.lead.status, 'contacted');
    assert.equal(patchBody.lead.notes, 'Pendiente de visita');
    assert.notEqual(patchBody.lead.updatedAt, listBody.leads[0].updatedAt);

    const deleteResponse = await fetch(`${baseUrl}/api/admin/leads/${createdBody.leadId}`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${loginBody.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ reason: 'matricula duplicada' }),
    });

    assert.equal(deleteResponse.status, 204);
    assert.equal(await deleteResponse.text(), '');

    const listAfterDeleteResponse = await fetch(`${baseUrl}/api/admin/leads`, {
      headers: {
        authorization: `Bearer ${loginBody.token}`,
      },
    });

    assert.equal(listAfterDeleteResponse.status, 200);
    const listAfterDeleteBody = (await listAfterDeleteResponse.json()) as {
      ok: boolean;
      leads: Array<{ id: string }>;
    };

    assert.equal(listAfterDeleteBody.ok, true);
    assert.deepEqual(listAfterDeleteBody.leads, []);
  } finally {
    delete process.env.SQLITE_DB_PATH;
    delete process.env.LEGACY_LEADS_FILE_PATH;
    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await rm(sqliteDbPath, { force: true });
  }
});

test('authenticated admin can delete a lead without a reason body', async () => {
  const sqliteDbPath = join(tmpdir(), `tew-admin-leads-${randomUUID()}.sqlite`);
  process.env.SQLITE_DB_PATH = sqliteDbPath;
  process.env.LEGACY_LEADS_FILE_PATH = join(tmpdir(), `tew-legacy-missing-${randomUUID()}.json`);
  process.env.ADMIN_USERNAME = 'admin';
  process.env.ADMIN_PASSWORD = 'secret';

  const server = createServer(createApp());

  try {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();

    if (!address || typeof address === 'string') {
      throw new Error('Test server did not expose a port');
    }

    const baseUrl = `http://127.0.0.1:${address.port}`;

    const createResponse = await fetch(`${baseUrl}/api/leads`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
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
        secondaryContactName: null,
        secondaryContactSurname: null,
        secondaryContactRelationship: null,
        pickupContact: null,
        paymentMethod: 'bizum',
        paymentAccountHolder: null,
        paymentIban: null,
        observations: 'Sin observaciones',
        source: 'public-site',
      }),
    });

    const createdBody = (await createResponse.json()) as { leadId: string };

    const loginResponse = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'secret' }),
    });

    const loginBody = (await loginResponse.json()) as { token: string };

    const deleteResponse = await fetch(`${baseUrl}/api/admin/leads/${createdBody.leadId}`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${loginBody.token}`,
      },
    });

    assert.equal(deleteResponse.status, 204);
  } finally {
    delete process.env.SQLITE_DB_PATH;
    delete process.env.LEGACY_LEADS_FILE_PATH;
    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await rm(sqliteDbPath, { force: true });
  }
});

test('admin delete lead returns 400 for an invalid reason payload', async () => {
  const sqliteDbPath = join(tmpdir(), `tew-admin-leads-${randomUUID()}.sqlite`);
  process.env.SQLITE_DB_PATH = sqliteDbPath;
  process.env.LEGACY_LEADS_FILE_PATH = join(tmpdir(), `tew-legacy-missing-${randomUUID()}.json`);
  process.env.ADMIN_USERNAME = 'admin';
  process.env.ADMIN_PASSWORD = 'secret';

  const server = createServer(createApp());

  try {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();

    if (!address || typeof address === 'string') {
      throw new Error('Test server did not expose a port');
    }

    const baseUrl = `http://127.0.0.1:${address.port}`;

    const loginResponse = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'secret' }),
    });

    const loginBody = (await loginResponse.json()) as { token: string };

    const deleteResponse = await fetch(`${baseUrl}/api/admin/leads/any-lead`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${loginBody.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ reason: 123 }),
    });

    assert.equal(deleteResponse.status, 400);
    assert.deepEqual(await deleteResponse.json(), { ok: false, error: 'Invalid delete payload' });
  } finally {
    delete process.env.SQLITE_DB_PATH;
    delete process.env.LEGACY_LEADS_FILE_PATH;
    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await rm(sqliteDbPath, { force: true });
  }
});

test('admin delete lead returns 404 when the lead does not exist', async () => {
  const sqliteDbPath = join(tmpdir(), `tew-admin-leads-${randomUUID()}.sqlite`);
  process.env.SQLITE_DB_PATH = sqliteDbPath;
  process.env.LEGACY_LEADS_FILE_PATH = join(tmpdir(), `tew-legacy-missing-${randomUUID()}.json`);
  process.env.ADMIN_USERNAME = 'admin';
  process.env.ADMIN_PASSWORD = 'secret';

  const server = createServer(createApp());

  try {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();

    if (!address || typeof address === 'string') {
      throw new Error('Test server did not expose a port');
    }

    const baseUrl = `http://127.0.0.1:${address.port}`;

    const loginResponse = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'secret',
      }),
    });

    const loginBody = (await loginResponse.json()) as { token: string };

    const deleteResponse = await fetch(`${baseUrl}/api/admin/leads/missing-lead`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${loginBody.token}`,
      },
    });

    assert.equal(deleteResponse.status, 404);
    assert.deepEqual(await deleteResponse.json(), { ok: false, error: 'Lead not found' });
  } finally {
    delete process.env.SQLITE_DB_PATH;
    delete process.env.LEGACY_LEADS_FILE_PATH;
    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await rm(sqliteDbPath, { force: true });
  }
});

test('admin delete lead returns 401 without a valid token', async () => {
  const sqliteDbPath = join(tmpdir(), `tew-admin-leads-${randomUUID()}.sqlite`);
  process.env.SQLITE_DB_PATH = sqliteDbPath;
  process.env.LEGACY_LEADS_FILE_PATH = join(tmpdir(), `tew-legacy-missing-${randomUUID()}.json`);
  process.env.ADMIN_USERNAME = 'admin';
  process.env.ADMIN_PASSWORD = 'secret';

  const server = createServer(createApp());

  try {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();

    if (!address || typeof address === 'string') {
      throw new Error('Test server did not expose a port');
    }

    const baseUrl = `http://127.0.0.1:${address.port}`;

    const deleteResponse = await fetch(`${baseUrl}/api/admin/leads/lead_123`, {
      method: 'DELETE',
    });

    assert.equal(deleteResponse.status, 401);
    assert.deepEqual(await deleteResponse.json(), { ok: false });
  } finally {
    delete process.env.SQLITE_DB_PATH;
    delete process.env.LEGACY_LEADS_FILE_PATH;
    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await rm(sqliteDbPath, { force: true });
  }
});

test('admin leads returns 401 for an expired persisted session token', async () => {
  const sqliteDbPath = join(tmpdir(), `tew-admin-leads-${randomUUID()}.sqlite`);
  process.env.SQLITE_DB_PATH = sqliteDbPath;
  process.env.LEGACY_LEADS_FILE_PATH = join(tmpdir(), `tew-legacy-missing-${randomUUID()}.json`);
  process.env.ADMIN_USERNAME = 'admin';
  process.env.ADMIN_PASSWORD = 'secret';

  const server = createServer(createApp());

  try {
    storeAdminSession('expired-token', '2000-01-01T00:00:00.000Z', process.env);

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();

    if (!address || typeof address === 'string') {
      throw new Error('Test server did not expose a port');
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/api/admin/leads`, {
      headers: {
        authorization: 'Bearer expired-token',
      },
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { ok: false });
  } finally {
    delete process.env.SQLITE_DB_PATH;
    delete process.env.LEGACY_LEADS_FILE_PATH;
    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await rm(sqliteDbPath, { force: true });
  }
});

test('admin login returns JSON 500 when sqlite storage is unavailable', async () => {
  process.env.SQLITE_DB_PATH = tmpdir();
  process.env.ADMIN_USERNAME = 'admin';
  process.env.ADMIN_PASSWORD = 'secret';

  const server = createServer(createApp());

  try {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();

    if (!address || typeof address === 'string') {
      throw new Error('Test server did not expose a port');
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/api/admin/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'secret',
      }),
    });

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { ok: false, error: 'Internal server error' });
  } finally {
    delete process.env.SQLITE_DB_PATH;
    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test('admin leads returns JSON 500 when sqlite storage is unavailable during token validation', async () => {
  process.env.SQLITE_DB_PATH = tmpdir();
  process.env.ADMIN_USERNAME = 'admin';
  process.env.ADMIN_PASSWORD = 'secret';

  const server = createServer(createApp());

  try {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();

    if (!address || typeof address === 'string') {
      throw new Error('Test server did not expose a port');
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/api/admin/leads`, {
      headers: {
        authorization: 'Bearer token_123',
      },
    });

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { ok: false, error: 'Internal server error' });
  } finally {
    delete process.env.SQLITE_DB_PATH;
    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
