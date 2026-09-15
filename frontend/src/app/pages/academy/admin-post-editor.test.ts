import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { micromark } from "micromark";

const component = new URL("./admin-post-editor.component.ts", import.meta.url);
const api = readFileSync(new URL("../../core/academy/academy-api.service.ts", import.meta.url), "utf8");
const routes = readFileSync(new URL("../../app.routes.ts", import.meta.url), "utf8");

test("administrator editor creates visible publications and exposes guarded editor routes", () => {
  assert.ok(existsSync(component));
  assert.match(api, /createAdminPost\(apiBaseUrl: string, token: string, input:/);
  assert.match(routes, /path: 'nueva'[\s\S]*admin-post-editor\.component/);
});

test("visual and source modes preserve one safe Markdown source and reject deleted mutations", () => {
  const source = readFileSync(component, "utf8");
  const markdown = micromark('<img src=x onerror=1> [bad](javascript:alert(1)) **safe**', { allowDangerousHtml: false, allowDangerousProtocol: false });
  assert.match(markdown, /&lt;img src=x onerror=1&gt;/);
  assert.match(markdown, /href=""/);
  assert.doesNotMatch(markdown, /href="javascript:/);
  assert.match(markdown, /<strong>safe<\/strong>/);
  assert.match(readFileSync(new URL("../../core/academy/academy-markdown.ts", import.meta.url), "utf8"), /allowDangerousHtml: false, allowDangerousProtocol: false/);
  assert.match(source, /mode: 'visual' \| 'source' = 'visual'/);
  assert.match(source, /textarea\.setRangeText/);
  assert.match(source, /\[innerHTML\]="preview"/);
  assert.doesNotMatch(source, /bypassSecurityTrustHtml/);
  assert.match(api, /setAdminPostVisibility\(apiBaseUrl: string, token: string, id: string, action: 'show' \| 'hide'\)/);
  assert.match(api, /deleteAdminPost\(apiBaseUrl: string, token: string, id: string\)/);
  assert.match(source, /Las publicaciones eliminadas no se pueden modificar\./);
});
