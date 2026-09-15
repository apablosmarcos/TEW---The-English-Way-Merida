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

test("administrator attachments use authenticated lifecycle calls and keep deleted materials inspectable", () => {
  const source = readFileSync(component, "utf8");
  assert.match(api, /uploadAdminAttachment\(apiBaseUrl: string, token: string, postId: string, form: FormData\)/);
  assert.match(api, /renameAdminAttachment\(apiBaseUrl: string, token: string, id: string, title: string\)/);
  assert.match(api, /deleteAdminAttachment\(apiBaseUrl: string, token: string, id: string\)/);
  assert.match(source, /form\.append\('file', this\.attachmentFile\)/);
  assert.match(source, /form\.append\('title', this\.attachmentTitle\)/);
  assert.match(source, /activeAttachments/);
  assert.match(source, /deletedAttachments/);
  assert.match(source, /this\.api\.previewAttachment/);
  assert.match(source, /this\.api\.downloadAttachment/);
});

test("attachment controls preserve Blob authorization and explain backend rejection states", () => {
  const source = readFileSync(component, "utf8");
  const template = source.split('template: `')[1].split('`,\n  styles')[0];
  const active = template.split('<h3>Activos</h3>')[1].split('<h3>Eliminados (retenidos)</h3>')[0];
  const retained = template.split('<h3>Eliminados (retenidos)</h3>')[1];
  assert.match(active, /renameAttachment/);
  assert.match(active, /deleteAttachment/);
  assert.doesNotMatch(retained, /renameAttachment|deleteAttachment/);
  assert.match(api, /responseType: 'blob'/);
  assert.match(source, /URL\.createObjectURL\(blob\)/);
  assert.match(source, /URL\.revokeObjectURL\(url\)/);
  assert.match(source, /Esta publicación ya tiene 10 materiales\.|máximo de 20 MiB|PDF, JPEG, PNG o WebP|ya no se puede modificar/);
});
