import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const { LatestRequest } = await import(
  new URL("./admin-post-interactions.ts", import.meta.url).href
);
const component = new URL("./admin-post-list.component.ts", import.meta.url);
const api = readFileSync(
  new URL("../../core/academy/academy-api.service.ts", import.meta.url),
  "utf8",
);
const routes = readFileSync(
  new URL("../../app.routes.ts", import.meta.url),
  "utf8",
);

test("administrator content discovery uses the protected posts endpoint", () => {
  assert.ok(existsSync(component));
  assert.match(
    api,
    /listAdminPosts\(apiBaseUrl: string, token: string, status: AcademyPostVisibility \| null\)/,
  );
});

test("only the latest filter request may update the list", async () => {
  const requests = new LatestRequest();
  let resolveVisible!: (value: string) => void;
  let resolveDeleted!: (value: string) => void;
  const visible = new Promise<string>((resolve) => { resolveVisible = resolve; });
  const deleted = new Promise<string>((resolve) => { resolveDeleted = resolve; });
  let rendered = "";
  const apply = async (ticket: number, response: Promise<string>) => {
    const value = await response;
    if (requests.isCurrent(ticket)) rendered = value;
  };

  const slowVisible = apply(requests.start(), visible);
  const fastDeleted = apply(requests.start(), deleted);
  resolveDeleted("deleted");
  await fastDeleted;
  resolveVisible("visible");
  await slowVisible;

  assert.equal(rendered, "deleted");

  const source = readFileSync(component, "utf8");
  assert.match(source, /private readonly requests = new LatestRequest\(\)/);
  assert.match(source, /const request = this\.requests\.start\(\)/);
  assert.match(source, /if \(!this\.requests\.isCurrent\(request\)\) return/);
  assert.match(source, /if \(this\.requests\.isCurrent\(request\)\) this\.error/);
  assert.match(source, /if \(this\.requests\.isCurrent\(request\)\) this\.loading = false/);
});

test("administrator content filters all lifecycle states and keeps category conflicts actionable", () => {
  const source = readFileSync(component, "utf8");
  assert.match(api, /listCategories\(apiBaseUrl: string, token: string\)/);
  assert.match(api, /createCategory\(apiBaseUrl: string, token: string, displayName: string\)/);
  assert.match(api, /renameCategory\(apiBaseUrl: string, token: string, id: string, displayName: string\)/);
  assert.match(api, /deleteCategory\(apiBaseUrl: string, token: string, id: string\)/);
  assert.match(source, /value === "visible" \|\| value === "hidden" \|\| value === "deleted"/);
  assert.match(source, /No se puede eliminar una categoría que tiene publicaciones\./);
  assert.match(source, /article>div\{min-width:0\}/);
  assert.match(source, /h2 a\{overflow-wrap:anywhere\}/);
  assert.match(source, /Crear categoría[\s\S]*Guardar nombre[\s\S]*Eliminar categoría/);
  assert.match(
    routes,
    /path: 'admin\/publicaciones'[\s\S]*academyAuthenticatedGuard[\s\S]*academyAdminGuard[\s\S]*admin-post-list\.component/,
  );
});
