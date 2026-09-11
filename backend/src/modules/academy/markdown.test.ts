import assert from "node:assert/strict";
import test from "node:test";

import { renderMarkdown } from "./markdown.ts";

test("renders headings and safe links", () => {
  assert.equal(renderMarkdown("# Welcome\n\n[Read more](https://example.com)"), '<h1>Welcome</h1>\n<p><a href="https://example.com">Read more</a></p>');
});

test("escapes raw HTML, including event handlers", () => {
  const html = renderMarkdown('<img src=x onerror="alert(1)">');

  assert.equal(html, "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
});

test("neutralizes unsafe link protocols", () => {
  const html = renderMarkdown("[script](javascript:alert(1))\n\n[data](data:text/html;base64,PHNjcmlwdD4=)");

  assert.doesNotMatch(html, /javascript:|data:text\/html/);
  assert.match(html, /href=""/);
});
