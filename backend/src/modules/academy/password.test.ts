import assert from "node:assert/strict";
import test from "node:test";

import { generateTemporaryPassword } from "./password.ts";

test("generates ten-character temporary passwords without ambiguous glyphs", () => {
  for (let index = 0; index < 1_000; index += 1) {
    assert.match(generateTemporaryPassword(), /^[A-HJ-NP-Za-km-z2-9]{10}$/);
  }
});
