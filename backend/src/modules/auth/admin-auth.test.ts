import assert from 'node:assert/strict';
import test from 'node:test';

import { isValidAdminLogin } from './admin-auth.ts';

test('admin login validates configured credentials', () => {
  const env = {
    ADMIN_USERNAME: 'admin',
    ADMIN_PASSWORD: 'secret',
  };

  assert.equal(isValidAdminLogin('admin', 'secret', env), true);
  assert.equal(isValidAdminLogin('admin', 'wrong', env), false);
  assert.equal(isValidAdminLogin('wrong', 'secret', env), false);
});
