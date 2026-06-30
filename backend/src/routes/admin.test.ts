import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

import { createApp } from '../app.ts';

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

test('authenticated admin can list and update leads', async () => {
  const leadsFilePath = join(tmpdir(), `tew-admin-leads-${randomUUID()}.json`);
  process.env.LEADS_FILE_PATH = leadsFilePath;
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
        name: 'Ana Perez',
        email: 'ana@example.com',
        phone: '600000000',
        message: 'Quiero informacion',
        interestType: 'primary',
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
    const loginBody = (await loginResponse.json()) as { ok: boolean; token: string };

    assert.equal(loginBody.ok, true);
    assert.equal(typeof loginBody.token, 'string');
    assert.notEqual(loginBody.token, '');

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
  } finally {
    delete process.env.LEADS_FILE_PATH;
    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await rm(leadsFilePath, { force: true });
  }
});
