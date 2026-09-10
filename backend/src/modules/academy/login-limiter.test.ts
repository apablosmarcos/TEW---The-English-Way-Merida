import assert from "node:assert/strict";
import test from "node:test";

import { LoginLimiter } from "./login-limiter.ts";

test("allows ten IP attempts, rejects the eleventh, and resets after fifteen minutes", () => {
  const limiter = new LoginLimiter();
  const start = Date.UTC(2026, 0, 1);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    assert.equal(limiter.attempt("203.0.113.1", start), true);
  }
  assert.equal(limiter.attempt("203.0.113.1", start), false);
  assert.equal(limiter.attempt("203.0.113.1", start + 15 * 60 * 1000), true);
});

test("removes stale IP entries while processing later attempts", () => {
  const limiter = new LoginLimiter();
  limiter.attempt("203.0.113.1", 0);
  limiter.attempt("203.0.113.2", 15 * 60 * 1000);

  assert.equal(limiter.size, 1);
});
