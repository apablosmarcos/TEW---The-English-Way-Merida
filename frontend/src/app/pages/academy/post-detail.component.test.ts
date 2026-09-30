import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("./post-detail.component.ts", import.meta.url),
  "utf8",
);

const api = readFileSync(
  new URL("../../core/academy/academy-api.service.ts", import.meta.url),
  "utf8",
);
const routes = readFileSync(
  new URL("../../app.routes.ts", import.meta.url),
  "utf8",
);
const feed = readFileSync(
  new URL("./parent-post-list.component.ts", import.meta.url),
  "utf8",
);

test("parent post detail uses authenticated detail and attachment endpoints", () => {
  assert.match(
    api,
    /getParentPost\(apiBaseUrl: string, token: string, id: string\)/,
  );
  assert.match(
    api,
    /buildAcademyEndpoint\(\s*apiBaseUrl\s*,\s*`posts\/\$\{id\}`\s*\)/,
  );
  assert.match(
    api,
    /buildAcademyEndpoint\(\s*apiBaseUrl\s*,\s*`attachments\/\$\{id\}\/preview`\s*\)/,
  );
  assert.match(
    api,
    /buildAcademyEndpoint\(\s*apiBaseUrl\s*,\s*`attachments\/\$\{id\}\/download`\s*\)/,
  );
  assert.match(api, /responseType\s*:\s*(['"])blob\1/);
});

test("parent post detail restores feed navigation and preserves the parent shell guards", () => {
  assert.match(
    feed,
    /\[routerLink\]\s*=\s*(['"])\[\s*(['"])\/academia\/publicaciones\2\s*,\s*post\.id\s*\]\1/,
  );
  assert.match(
    routes,
    /academyAuthenticatedGuard\s*,\s*academyParentGuard[\s\S]*academy-shell\.component[\s\S]*children\s*:\s*\[[\s\S]*path\s*:\s*(['"])publicaciones\/:id\1[\s\S]*post-detail\.component/,
  );
});

test("parent post detail renders only parent-safe content and manages object URLs", () => {
  assert.match(source, /\[innerHTML\]="current\.renderedMarkdown"/);
  assert.match(source, /HttpErrorResponse && error\.status === 404/);
  assert.match(source, /private loadGeneration = 0/);
  assert.match(source, /URL\.createObjectURL/);
  assert.match(source, /window\.open\(\)[\s\S]*await this\.useAttachment/);
  assert.match(source, /const generation = this\.loadGeneration[\s\S]*generation !== this\.loadGeneration/);
  assert.match(source, /setTimeout\(\(\) => this\.releaseObjectUrl\(url\), 60_000\)/);
  assert.match(source, /ngOnDestroy\(\)[\s\S]*revokeObjectUrls/);
  assert.match(source, /aria-label[^>]*Vista previa de[\s\S]*aria-label[^>]*Descargar/);
  assert.match(
    source,
    /formatAttachmentName\(attachment\.visibleTitle, attachment\.materialOrdinal, mimeExtension\(attachment\.mimeType\)\)/,
  );
  assert.doesNotMatch(
    source,
    /bypassSecurityTrustHtml|micromark|author|markdownSource|storageId|visibility|deletedAt/,
  );
});
