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

test("administrator lifecycle calls use the protected user contract", () => {
  assert.match(api, /createAdminUser\(apiBaseUrl: string, token: string, input: AcademyAdminUserInput\)/);
  assert.match(api, /disableAdminUser\(apiBaseUrl: string, token: string, id: string\)/);
  assert.match(api, /enableAdminUser\(apiBaseUrl: string, token: string, id: string\)/);
  assert.match(api, /deleteAdminUser\(apiBaseUrl: string, token: string, id: string\)/);
  assert.match(api, /resetAdminUserPassword\(apiBaseUrl: string, token: string, id: string\)/);
  assert.match(api, /'admin\/users'\), input/);
  assert.match(api, /`admin\/users\/\$\{id\}\/reset-password`/);
});

test("temporary passwords are response-scoped and lifecycle conflicts stay focused", () => {
  const source = readFileSync(component, "utf8");
  assert.match(source, /temporaryPassword\?: \{ username: string; password: string \}/);
  assert.match(source, /closeTemporaryPassword\(\) \{\s*this\.temporaryPassword = undefined;/);
  assert.match(source, /ngOnDestroy\(\) \{[\s\S]*this\.temporaryPassword = undefined;/);
  assert.match(source, /No se puede desactivar ni eliminar al último administrador activo\./);
  assert.match(source, /createDisplayName[\s\S]*createUsername[\s\S]*createError/);
  assert.match(source, /Restablecer contraseña[\s\S]*Desactivar[\s\S]*Eliminar/);
});

test("admin lifecycle retains create fields after a conflict and clears response-scoped passwords", () => {
  const source = readFileSync(component, "utf8");
  const create = source.match(/async createUser\(\) \{[\s\S]*?\n  \}\n  async resetPassword/)?.[0] ?? "";
  assert.match(create, /catch \(error\) \{\s*this\.createError = this\.message\(error\);/);
  assert.doesNotMatch(create, /catch \(error\) \{[\s\S]*this\.create(DisplayName|Username) = ""/);
  assert.match(source, /temporaryPassword = \{ username, password: response\.data\.temporaryPassword \};/);
  assert.match(source, /closeTemporaryPassword\(\) \{\s*this\.temporaryPassword = undefined;/);
  assert.match(source, /ngOnDestroy\(\) \{[\s\S]*this\.temporaryPassword = undefined;/);
  assert.match(source, /private navigate\(query: AdminUserQuery\) \{\s*this\.closeTemporaryPassword\(\);/);
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
