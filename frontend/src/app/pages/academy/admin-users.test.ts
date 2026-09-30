import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const { confirmMutation, runExclusiveMutation, TemporarySecretQueue } = await import(
  new URL("./academy-user-mutations.ts", import.meta.url).href
);
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

test("password reset confirmation names the user, cancels cleanly, and confirms once", () => {
  const messages: string[] = [];
  let requests = 0;
  const confirm = (answer: boolean) => (message: string) => {
    messages.push(message);
    return answer;
  };

  assert.equal(confirmMutation(confirm(false), "¿Restablecer la contraseña de «ana»?", () => { requests += 1; }), false);
  assert.equal(requests, 0);
  assert.equal(confirmMutation(confirm(true), "¿Restablecer la contraseña de «ana»?", () => { requests += 1; }), true);
  assert.equal(requests, 1);
  assert.deepEqual(messages, [
    "¿Restablecer la contraseña de «ana»?",
    "¿Restablecer la contraseña de «ana»?",
  ]);
});

test("user mutations serialize per account while allowing different accounts", async () => {
  const pending = new Set<string>();
  let releaseFirst!: () => void;
  let calls = 0;
  const first = runExclusiveMutation(pending, "user-1", async () => {
    calls += 1;
    await new Promise<void>((resolve) => { releaseFirst = resolve; });
  });
  const duplicate = runExclusiveMutation(pending, "user-1", async () => { calls += 1; });
  const otherUser = runExclusiveMutation(pending, "user-2", async () => { calls += 1; });

  assert.equal(pending.has("user-1"), true);
  assert.equal(await duplicate, false);
  assert.equal(await otherUser, true);
  releaseFirst();
  assert.equal(await first, true);
  assert.equal(calls, 2);
  assert.deepEqual([...pending], []);
});

test("concurrent account resets preserve every temporary secret until explicit acknowledgement", async () => {
  const pending = new Set<string>();
  const secrets = new TemporarySecretQueue();
  let releaseFirst!: () => void;
  let releaseSecond!: () => void;

  const first = runExclusiveMutation(pending, "user-1", async () => {
    await new Promise<void>((resolve) => { releaseFirst = resolve; });
    secrets.add({ id: "user-1", username: "ana", password: "first-secret" });
  });
  const second = runExclusiveMutation(pending, "user-2", async () => {
    await new Promise<void>((resolve) => { releaseSecond = resolve; });
    secrets.add({ id: "user-2", username: "bea", password: "second-secret" });
  });

  releaseSecond();
  await second;
  releaseFirst();
  await first;

  assert.deepEqual(secrets.items.map(({ id, password }: { id: string; password: string }) => ({ id, password })), [
    { id: "user-2", password: "second-secret" },
    { id: "user-1", password: "first-secret" },
  ]);
  secrets.acknowledge(secrets.items[0]);
  assert.deepEqual(secrets.items.map(({ id }: { id: string }) => id), ["user-1"]);
  secrets.clear();
  assert.deepEqual(secrets.items, []);
});

test("temporary passwords are listed explicitly and lifecycle conflicts stay focused", () => {
  const source = readFileSync(component, "utf8");
  assert.match(source, /temporarySecrets = new TemporarySecretQueue\(\)/);
  assert.match(source, /\*ngFor="let temporaryPassword of temporarySecrets\.items"/);
  assert.match(source, /closeTemporaryPassword\(temporaryPassword\)/);
  assert.match(source, /ngOnDestroy\(\) \{[\s\S]*this\.temporarySecrets\.clear\(\)/);
  assert.match(source, /No se puede desactivar ni eliminar al último administrador activo\./);
  assert.match(source, /confirmResetPassword\(user\.id, user\.username\)/);
  assert.match(source, /\[disabled\]="isUserPending\(user\.id\)"/);
  assert.match(source, /Operación en curso…/);
});

test("admin lifecycle retains create fields after a conflict and clears response-scoped passwords", () => {
  const source = readFileSync(component, "utf8");
  const create = source.match(/async createUser\(\) \{[\s\S]*?\n  \}\n  resetPassword/)?.[0] ?? "";
  assert.match(create, /catch \(error\) \{\s*this\.createError = this\.message\(error\);/);
  assert.doesNotMatch(create, /catch \(error\) \{[\s\S]*this\.create(DisplayName|Username) = ""/);
  assert.match(create, /temporarySecrets\.add\(\{ id: response\.data\.user\.id, username: response\.data\.user\.username, password: response\.data\.temporaryPassword \}\);/);
  assert.match(source, /temporarySecrets\.add\(\{ id, username, password: response\.data\.temporaryPassword \}\);/);
  assert.equal(source.match(/temporarySecrets\.add\(/g)?.length, 2);
  assert.match(source, /¿Restablecer la contraseña de «\$\{username\}»\?/);
  assert.match(source, /closeTemporaryPassword\(secret: TemporarySecret\)/);
  assert.match(source, /ngOnDestroy\(\) \{[\s\S]*this\.temporarySecrets\.clear\(\)/);
  assert.doesNotMatch(source, /private navigate\(query: AdminUserQuery\) \{\s*this\.closeTemporaryPassword/);
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
