import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const {
  adminUserQuery,
  adminUserQueryParams,
  withAdminUserFilters,
  withAdminUserPage,
} = await import(new URL("./academy-list-state.ts", import.meta.url).href);

const api = readFileSync(
  new URL("../../core/academy/academy-api.service.ts", import.meta.url),
  "utf8",
);
const component = new URL("./admin-users.component.ts", import.meta.url);
const routes = readFileSync(
  new URL("../../app.routes.ts", import.meta.url),
  "utf8",
);

test("admin user query keeps server filters in the URL and resets pages for changes", () => {
  const query = adminUserQuery(
    new URLSearchParams("search=Mar%C3%ADa&role=parent&state=disabled&page=3"),
  );
  assert.deepEqual(query, {
    search: "María",
    role: "parent",
    state: "disabled",
    page: 3,
  });
  assert.deepEqual(adminUserQueryParams(query), {
    search: "María",
    role: "parent",
    state: "disabled",
    page: "3",
  });
  assert.deepEqual(withAdminUserFilters(query, "ana", "admin", "active"), {
    search: "ana",
    role: "admin",
    state: "active",
    page: 1,
  });
  assert.deepEqual(withAdminUserPage(query, 2), { ...query, page: 2 });
});

test("admin user discovery uses the protected backend list contract", () => {
  assert.match(
    api,
    /listAdminUsers\(apiBaseUrl: string, token: string, query: AcademyAdminUserQuery\)/,
  );
  assert.match(api, /buildAcademyEndpoint\(apiBaseUrl, 'admin\/users'\)/);
  assert.match(api, /params: adminUserParams\(query\)/);
});

test("admin user discovery is guarded, query-backed, and usable at narrow widths", () => {
  assert.ok(existsSync(component));
  const source = readFileSync(component, "utf8");
  assert.match(
    routes,
    /path: 'admin\/usuarios'[\s\S]*academyAuthenticatedGuard[\s\S]*academyAdminGuard[\s\S]*admin-users\.component/,
  );
  assert.match(
    source,
    /queryParamMap[\s\S]*adminUserQuery[\s\S]*listAdminUsers/,
  );
  assert.match(source, /Buscar por nombre, usuario o UUID/);
  assert.match(source, /Filtro de rol[\s\S]*Filtro de estado/);
  assert.match(source, /role="status"[\s\S]*role="alert"/);
  assert.match(source, /aria-label="Paginación de usuarios"/);
  assert.match(
    source,
    /min-height:44px[\s\S]*:focus-visible[\s\S]*max-width:640px/,
  );
});
