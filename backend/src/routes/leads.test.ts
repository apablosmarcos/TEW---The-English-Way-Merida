import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

import { createApp } from '../app.ts';

test('POST /api/leads returns 201 and leadId for a valid payload', async () => {
  const leadsFilePath = join(tmpdir(), `tew-leads-${randomUUID()}.json`);
  process.env.LEADS_FILE_PATH = leadsFilePath;

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
        name: 'Ana Perez',
        email: 'ana@example.com',
        phone: '600000000',
        message: 'Quiero informacion',
        interestType: 'primary',
        source: 'public-site',
      }),
    });

    assert.equal(response.status, 201);

    const body = (await response.json()) as { ok?: unknown; leadId?: unknown };

    assert.equal(body.ok, true);
    assert.equal(typeof body.leadId, 'string');
    assert.notEqual(body.leadId, '');
  } finally {
    delete process.env.LEADS_FILE_PATH;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await rm(leadsFilePath, { force: true });
  }
});

test('POST /api/leads returns 500 when lead storage fails', async () => {
  process.env.LEADS_FILE_PATH = tmpdir();

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
        name: 'Ana Perez',
        email: 'ana@example.com',
        phone: '600000000',
        message: 'Quiero informacion',
        interestType: 'primary',
        source: 'public-site',
      }),
    });

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), {
      ok: false,
      error: 'Internal server error',
    });
  } finally {
    delete process.env.LEADS_FILE_PATH;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
