import test from 'node:test';
import assert from 'node:assert/strict';

import { getTrustProxyHops } from './env.ts';

function withTrustProxyHops(value: string | undefined, check: () => void) {
  const original = process.env.TRUST_PROXY_HOPS;

  try {
    if (value === undefined) {
      delete process.env.TRUST_PROXY_HOPS;
    } else {
      process.env.TRUST_PROXY_HOPS = value;
    }
    check();
  } finally {
    if (original === undefined) {
      delete process.env.TRUST_PROXY_HOPS;
    } else {
      process.env.TRUST_PROXY_HOPS = original;
    }
  }
}

test('getTrustProxyHops keeps trust proxy disabled when absent', () => {
  withTrustProxyHops(undefined, () => assert.equal(getTrustProxyHops(), false));
});

test('getTrustProxyHops accepts the known two-proxy topology', () => {
  withTrustProxyHops('2', () => assert.equal(getTrustProxyHops(), 2));
});

test('getTrustProxyHops fails closed for malformed or out-of-range values', () => {
  for (const value of ['-1', '00', '1.5', '2x', ' 2', '3']) {
    withTrustProxyHops(value, () => assert.equal(getTrustProxyHops(), false));
  }
});
