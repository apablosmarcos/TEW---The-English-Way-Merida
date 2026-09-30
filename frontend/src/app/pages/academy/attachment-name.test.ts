import assert from "node:assert/strict";
import test from "node:test";

const { attachmentName } = await import(new URL("./attachment-name.ts", import.meta.url).href);

test("attachment names append the extension only when it is missing", () => {
  assert.equal(attachmentName("Resumen primavera", 1, "pdf"), "Resumen primavera.pdf");
  assert.equal(attachmentName("Resumen primavera.pdf", 1, "pdf"), "Resumen primavera.pdf");
  assert.equal(attachmentName("Resumen primavera.PDF", 1, "pdf"), "Resumen primavera.PDF");
  assert.equal(attachmentName(null, 3, "pdf"), "Material 3.pdf");
});
