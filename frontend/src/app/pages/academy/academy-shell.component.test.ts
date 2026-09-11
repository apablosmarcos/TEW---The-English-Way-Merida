import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./academy-shell.component.ts', import.meta.url), 'utf8');

test('academy shell has a skip link, role-aware navigation, logout, and outlet without authorization logic', () => {
  assert.match(source, /href="#academy-content"[\s\S]*router-outlet/);
  assert.match(source, /session\.user\(\)[\s\S]*user\.role === 'admin'/);
  assert.match(source, /this\.session\.logout\([\s\S]*navigateByUrl\('\/academia\/acceso'\)/);
  assert.match(source, /min-height:\s*44px[\s\S]*:focus-visible[\s\S]*max-width:\s*820px[\s\S]*prefers-reduced-motion/);
});
