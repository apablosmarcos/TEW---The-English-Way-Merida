import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./password-change.component.ts', import.meta.url), 'utf8');

test('password change validates the policy, offers an accessible exit, and returns to access', () => {
  assert.match(source, /Validators\.minLength\(10\)[\s\S]*Validators\.maxLength\(128\)/);
  assert.match(source, /newPassword !== value\.confirmPassword/);
  assert.match(source, /this\.api\.changePassword[\s\S]*await this\.exit\(\)/);
  assert.match(source, /aria-busy[\s\S]*role="alert"/);
  assert.match(source, /<button type="button"[\s\S]*\(click\)="exit\(\)"[\s\S]*>Salir<\/button>/);
  assert.match(source, /\[disabled\]="isLoading \|\| isSubmitting \|\| form\.invalid \|\| !apiBaseUrl"/);
  assert.match(source, /if \(!this\.apiBaseUrl\) \{ this\.errorMessage = 'El acceso no está disponible\.'; return; \}/);
  assert.match(source, /if \(!token \|\| !this\.apiBaseUrl\) this\.session\.clear\(\);[\s\S]*this\.session\.logout\(this\.apiBaseUrl\)[\s\S]*finally \{ await this\.router\.navigateByUrl\('\/academia\/acceso'\); \}/);
  assert.match(source, /if \(!token\) \{ await this\.exit\(\); return; \}/);
  assert.match(source, /\.primary\{background:#B71C1C;color:#FFF/);
});
