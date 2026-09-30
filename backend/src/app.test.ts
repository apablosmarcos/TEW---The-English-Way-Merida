import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

import { createApp } from './app.ts';

async function request(app: ReturnType<typeof createApp>, path: string, headers?: HeadersInit) {
  const server = createServer(app);

  try {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();

    if (!address || typeof address === 'string') {
      throw new Error('Test server did not expose a port');
    }

    return await fetch(`http://127.0.0.1:${address.port}${path}`, { headers });
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

test('GET / returns backend status information', async () => {
  const response = await request(createApp(), '/');

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    service: 'tew-backend',
    health: '/api/health',
  });
});

test('uses the forwarded client IP only when trust proxy is configured', async () => {
  const original = process.env.TRUST_PROXY_HOPS;

  try {
    delete process.env.TRUST_PROXY_HOPS;
    const disabled = createApp();
    disabled.get('/test/request-ip', (req, res) => res.json({ ip: req.ip }));
    const headers = { 'x-forwarded-for': '198.51.100.10, 192.0.2.20' };
    const disabledResponse = await request(disabled, '/test/request-ip', headers);
    assert.notEqual((await disabledResponse.json() as { ip: string }).ip, '198.51.100.10');

    process.env.TRUST_PROXY_HOPS = '2';
    const enabled = createApp();
    enabled.get('/test/request-ip', (req, res) => res.json({ ip: req.ip }));
    const enabledResponse = await request(enabled, '/test/request-ip', headers);
    assert.equal((await enabledResponse.json() as { ip: string }).ip, '198.51.100.10');
  } finally {
    if (original === undefined) {
      delete process.env.TRUST_PROXY_HOPS;
    } else {
      process.env.TRUST_PROXY_HOPS = original;
    }
  }
});
