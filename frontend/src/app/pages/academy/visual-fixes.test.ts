import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (name: string) => readFileSync(new URL(name, import.meta.url), "utf8");
const styles = readFileSync(new URL("../../../styles.css", import.meta.url), "utf8");

test("Academy errors share one scoped alert treatment without styling temporary passwords as errors", () => {
  const alertRule = styles.match(/\.academy-error\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(alertRule, /background:\s*#FDECEA/);
  assert.match(alertRule, /border-left:\s*4px solid #B71C1C/);
  assert.match(alertRule, /color:\s*#111/);
  assert.match(alertRule, /padding:/);
  for (const name of [
    "./access.component.ts",
    "./password-change.component.ts",
    "./admin-post-list.component.ts",
    "./admin-post-editor.component.ts",
    "./admin-users.component.ts",
    "./parent-post-list.component.ts",
    "./post-detail.component.ts",
  ]) {
    const source = read(name);
    const errorAlerts = [...source.matchAll(/<p[^>]*role=["']alert["'][^>]*>/g)];
    assert.ok(errorAlerts.length > 0, `${name} must expose an error alert`);
    assert.ok(errorAlerts.every(([tag]) => /class=["'][^"']*academy-error/.test(tag)), `${name} must use academy-error on every error alert`);
  }
  assert.match(read("./admin-users.component.ts"), /<aside[^>]*class="temporary-password"[^>]*role="alert"/);
});

test("rendered Markdown links use global selectors that cross Angular encapsulation", () => {
  assert.match(styles, /\.detail \.content a,\s*\.editor \.preview a\s*\{[^}]*color:\s*#B71C1C;[^}]*text-decoration:\s*underline;[^}]*text-decoration-thickness:\s*2px/s);
  assert.match(styles, /\.detail \.content a:focus-visible,\s*\.editor \.preview a:focus-visible\s*\{[^}]*outline:\s*3px solid #B71C1C/s);
});

test("family detail keeps a moderate long-heading scale", () => {
  assert.match(read("./post-detail.component.ts"), /h1\{font-size:clamp\(1\.8rem,4vw,3rem\)/);
});

test("mobile Academy navigation and material actions stay compact and touchable", () => {
  const shell = read("./academy-shell.component.ts");
  const editor = read("./admin-post-editor.component.ts");
  assert.match(shell, /@media\(max-width:640px\)\{[^}]*header\{[^}]*display:grid;[^}]*grid-template-columns:/s);
  assert.match(shell, /<\/nav>\s*<button class="logout"[^>]*>Salir<\/button>/);
  assert.match(shell, /@media\(max-width:640px\)[\s\S]*header\{[^}]*grid-template-columns:auto minmax\(0,1fr\) auto/);
  assert.match(shell, /nav\{[^}]*display:grid;[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(shell, /\.logout\{grid-column:3;grid-row:1/);
  assert.doesNotMatch(shell, /overflow-x/);
  assert.match(shell, /nav a,button\{[^}]*min-height:44px/);
  assert.match(editor, /@media\(max-width:640px\)[\s\S]*\.materials \.actions\{[^}]*display:grid;[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(editor, /class="btn danger"[^>]*>Eliminar material/);
});
