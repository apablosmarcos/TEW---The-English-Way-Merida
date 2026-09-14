import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("./parent-post-list.component.ts", import.meta.url),
  "utf8",
);
const routes = readFileSync(
  new URL("../../app.routes.ts", import.meta.url),
  "utf8",
);

test("parent feed is standalone, accessible, and derives data from restorable query params", () => {
  assert.match(source, /role="status"[\s\S]*role="alert"/);
  assert.match(source, /aria-label="Todas las categorías"/);
  assert.match(
    source,
    /queryParamMap[\s\S]*parentPostQuery[\s\S]*listParentPosts/,
  );
  assert.match(source, /withParentPostFilters/);
  assert.match(
    source,
    /<h2>\s*<a\s+\[routerLink\]\s*=\s*(['"])\[\s*(['"])\/academia\/publicaciones\2\s*,\s*post\.id\s*\]\1\s*>\s*{{\s*post\.title\s*}}\s*<\/a>\s*<\/h2>/,
  );
  assert.match(source, /private loadGeneration = 0/);
  assert.match(
    source,
    /const generation = \+\+this\.loadGeneration,\s*query = this\.query/,
  );
  assert.match(
    source,
    /const response = await firstValueFrom\(\s*this\.api\.listParentPosts\(state\.config\.apiBaseUrl, token, query\),?\s*\);\s*if \(generation !== this\.loadGeneration\) return;\s*this\.feed = response\.data;/,
  );
  assert.doesNotMatch(source, /author|deletedAt|markdown/i);
  assert.match(
    routes,
    /academy-shell\.component[\s\S]*children:[\s\S]*parent-post-list\.component/,
  );
});
