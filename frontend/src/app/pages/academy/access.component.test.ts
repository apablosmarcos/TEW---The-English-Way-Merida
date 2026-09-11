import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./access.component.ts', import.meta.url), 'utf8');

test('access routes forced changes before role destinations and exposes accessible state', () => {
  assert.match(source, /export function academyDestination[\s\S]*mustChangePassword[\s\S]*'\/academia\/cambiar-contrasena'[\s\S]*role === 'admin'[\s\S]*'\/academia\/admin\/publicaciones'[\s\S]*'\/academia'/);
  assert.match(source, /this\.session\.login\([\s\S]*this\.router\.navigateByUrl\(academyDestination/);
  assert.match(source, /aria-busy[\s\S]*role="alert"/);
  assert.match(source, /\[disabled\]="isLoading \|\| isSubmitting \|\| form\.invalid \|\| !apiBaseUrl"/);
  assert.match(source, /if \(!this\.apiBaseUrl\) \{ this\.errorMessage = 'El acceso no está disponible\.'; return; \}/);
  assert.match(source, /\.primary\{background:#B71C1C;color:#FFF/);
});
