import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

import { createApp } from '../app.ts';


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
