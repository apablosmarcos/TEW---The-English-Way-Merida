import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createApp } from './app.ts';

test('serves compiled frontend assets and falls back to index.html outside /api', async () => {
  const staticDir = await mkdtemp(join(tmpdir(), 'tew-frontend-'));
  const indexPath = join(staticDir, 'index.html');
  const assetPath = join(staticDir, 'main.js');

  await writeFile(indexPath, '<!doctype html><html><body>frontend</body></html>');
  await writeFile(assetPath, 'console.log("frontend asset");');

  const server = createServer(createApp({ staticDir }));

  try {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();

    if (!address || typeof address === 'string') {
      throw new Error('Test server did not expose a port');
    }

    const baseUrl = `http://127.0.0.1:${address.port}`;

    const assetResponse = await fetch(`${baseUrl}/main.js`);
    assert.equal(assetResponse.status, 200);
    assert.match(await assetResponse.text(), /frontend asset/);

    const routeResponse = await fetch(`${baseUrl}/admin/leads`);
    assert.equal(routeResponse.status, 200);
    assert.match(await routeResponse.text(), /frontend/);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await rm(staticDir, { force: true, recursive: true });
  }
});
