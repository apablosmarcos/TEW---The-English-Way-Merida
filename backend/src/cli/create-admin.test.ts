import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { minimumPasswordLength } from "../modules/academy/password.ts";
import { runCreateAdmin } from "./create-admin.ts";
import { readPassword } from "./tty-password.ts";

class Output {
  isTTY = true;
  value = "";
  write(chunk: string) { this.value += chunk; return true; }
}

class Input extends EventEmitter {
  isTTY = true;
  modes: boolean[] = [];
  flow: string[] = [];
  setRawMode(mode: boolean) { this.modes.push(mode); return this; }
  resume() { this.flow.push("resume"); return this; }
  pause() { this.flow.push("pause"); return this; }
}

function answers(values: string[]) {
  return async () => {
    const value = values.shift();
    if (value === undefined) throw new Error("Missing test answer");
    return value;
  };
}

function tty() { return { isTTY: true } as NodeJS.ReadStream; }

const validPassword = "x".repeat(minimumPasswordLength);

test("rejects non-TTY in Spanish before prompting or preparing storage", async () => {
  const output = new Output();
  let prepared = false;
  let prompted = false;

  const exitCode = await runCreateAdmin({
    input: { isTTY: false } as NodeJS.ReadStream,
    output,
    ask: async () => { prompted = true; return ""; },
    readPassword: async () => { prompted = true; return ""; },
    prepareStorage: async () => { prepared = true; },
  });

  assert.equal(exitCode, 1);
  assert.equal(prompted, false);
  assert.equal(prepared, false);
  assert.match(output.value, /contraseña.*oculta/is);
  assert.match(output.value, /ssh -t <host> 'cd \/opt\/tewacademy && docker compose exec backend node backend\/dist\/cli\/create-admin\.js'/);
  assert.match(output.value, /terminal interactivo/i);
  assert.match(output.value, /no.*-T.*tuberías/is);
});

test("explains every rule and retries invalid values with specific Spanish feedback", async () => {
  const output = new Output();

  const exitCode = await runCreateAdmin({
    input: tty(),
    output,
    ask: answers(["", "Ada Lovelace", "Admin User", "abc", "adal"]),
    readPassword: answers(["short", validPassword, "different", validPassword]),
    env: { SQLITE_DB_PATH: ":memory:", FILE_STORAGE_PATH: tmpdir() },
    prepareStorage: async () => {},
  });

  assert.equal(exitCode, 0);
  assert.match(output.value, /nombre visible.*obligatorio/is);
  assert.match(output.value, /usuario.*4.*30.*minúsculas.*números.*\..*_.*-/is);
  assert.match(output.value, new RegExp(`contraseña.*${minimumPasswordLength}.*oculta.*dos veces`, "is"));
  assert.match(output.value, /nombre visible no puede estar vacío/i);
  assert.match(output.value, /usuario.*solo.*minúsculas.*números.*\..*_.*-/is);
  assert.match(output.value, /usuario.*3 caracteres.*entre 4 y 30/i);
  assert.match(output.value, new RegExp(`contraseña.*5 caracteres.*mínimo.*${minimumPasswordLength}`, "i"));
  assert.match(output.value, /contraseñas no coinciden/i);
  assert.equal(output.value.includes("short"), false);
  assert.equal(output.value.includes(validPassword), false);
});

test("rejects uppercase letters, spaces, and unsupported username characters", async (context) => {
  for (const invalidUsername of ["Admin", " adal ", "ad@l"]) await context.test(invalidUsername, async () => {
    const output = new Output();
    assert.equal(await runCreateAdmin({
      input: tty(),
      output,
      ask: answers(["Ada Lovelace", invalidUsername, "adal"]),
      readPassword: answers([validPassword, validPassword]),
      env: { SQLITE_DB_PATH: ":memory:", FILE_STORAGE_PATH: tmpdir() },
      prepareStorage: async () => {},
    }), 0);
    assert.match(output.value, /usuario.*solo.*minúsculas.*números.*\..*_.*-/is);
  });
});

test("reports empty username, password, and confirmation before retrying each field", async () => {
  const output = new Output();

  assert.equal(await runCreateAdmin({
    input: tty(),
    output,
    ask: answers(["Ada Lovelace", "", "adal"]),
    readPassword: answers(["", validPassword, "", validPassword]),
    env: { SQLITE_DB_PATH: ":memory:", FILE_STORAGE_PATH: tmpdir() },
    prepareStorage: async () => {},
  }), 0);

  assert.match(output.value, /usuario no puede estar vacío/i);
  assert.match(output.value, /contraseña no puede estar vacía/i);
  assert.match(output.value, /confirmación no puede estar vacía/i);
});

test("stops after three attempts for every field without preparing storage", async (context) => {
  const cases = [
    { name: "nombre visible", ask: ["", "", ""], passwords: [] },
    { name: "usuario", ask: ["Ada", "", "", ""], passwords: [] },
    { name: "contraseña", ask: ["Ada", "adal"], passwords: ["x", "x", "x"] },
    { name: "confirmación", ask: ["Ada", "adal"], passwords: [validPassword, "no", "no", "no"] },
  ];

  for (const testCase of cases) await context.test(testCase.name, async () => {
    const output = new Output();
    let prepared = false;
    assert.equal(await runCreateAdmin({
      input: tty(),
      output,
      ask: answers([...testCase.ask]),
      readPassword: answers([...testCase.passwords]),
      prepareStorage: async () => { prepared = true; },
    }), 1);
    assert.equal(prepared, false);
    assert.match(output.value, new RegExp(`agotado.*3 intentos.*${testCase.name}`, "is"));
  });
});

test("cancels input cleanly in Spanish without exposing the rejected value", async () => {
  const output = new Output();
  const secret = "do-not-print-this";

  assert.equal(await runCreateAdmin({
    input: tty(),
    output,
    ask: answers(["Ada", "adal"]),
    readPassword: async () => { throw new Error(`Input interrupted: ${secret}`); },
  }), 1);

  assert.match(output.value, /entrada cancelada/i);
  assert.equal(output.value.includes(secret), false);
});

test("creates a system active administrator after migrations without exposing secrets", async () => {
  const directory = await mkdtemp(join(tmpdir(), "academy-create-admin-"));
  const databasePath = join(directory, "academy.sqlite");
  const password = "chosen password";
  const output = new Output();

  try {
    const exitCode = await runCreateAdmin({
      input: tty(), output,
      ask: answers(["Ada Lovelace", "adal"]),
      readPassword: answers([password, password]),
      env: { SQLITE_DB_PATH: databasePath, FILE_STORAGE_PATH: join(directory, "uploads") },
    });

    assert.equal(exitCode, 0);
    assert.match(output.value, /Administrador «adal» creado\. Ya puede entrar en \/academia\/acceso\./);
    assert.equal(output.value.includes(password), false);
    assert.equal(output.value.includes("scrypt$"), false);

    const database = new DatabaseSync(databasePath);
    try {
      assert.equal(JSON.stringify(database.prepare("SELECT displayName, username, role, mustChangePassword, disabledAt, deletedAt FROM users").all()), JSON.stringify([{ displayName: "Ada Lovelace", username: "adal", role: "admin", mustChangePassword: 0, disabledAt: null, deletedAt: null }]));
      assert.equal(JSON.stringify(database.prepare("SELECT actorUserId, action FROM audit_log").all()), JSON.stringify([{ actorUserId: null, action: "user.created" }]));
      assert.equal(JSON.stringify(database.prepare("SELECT * FROM audit_log").all()).includes(password), false);
    } finally {
      database.close();
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("checks injectable username availability after format and before passwords", async () => {
  const output = new Output();
  const events: string[] = [];

  assert.equal(await runCreateAdmin({
    input: tty(),
    output,
    ask: answers(["Ada", "Admin", "admin", "adal"]),
    readPassword: async () => { events.push("password"); return validPassword; },
    isUsernameTaken: async (username) => { events.push(`check:${username}`); return username === "admin"; },
    env: { SQLITE_DB_PATH: ":memory:", FILE_STORAGE_PATH: tmpdir() },
    prepareStorage: async () => {},
  }), 0);

  assert.deepEqual(events, ["check:admin", "check:adal", "password", "password"]);
  assert.match(output.value, /El usuario «admin» ya existe/);
});

test("checks an existing username before passwords without changing data", async () => {
  const directory = await mkdtemp(join(tmpdir(), "academy-create-admin-"));
  const databasePath = join(directory, "academy.sqlite");
  const env = { SQLITE_DB_PATH: databasePath, FILE_STORAGE_PATH: join(directory, "uploads") };

  try {
    assert.equal(await runCreateAdmin({ input: tty(), output: new Output(), ask: answers(["Ada", "admin"]), readPassword: answers([validPassword, validPassword]), env }), 0);
    const output = new Output();
    let passwordPrompted = false;
    let prepared = false;
    assert.equal(await runCreateAdmin({
      input: tty(),
      output,
      ask: answers(["Other", "admin", "admin", "admin"]),
      readPassword: async () => { passwordPrompted = true; return validPassword; },
      prepareStorage: async () => { prepared = true; },
      env,
    }), 1);
    assert.equal(passwordPrompted, false);
    assert.equal(prepared, false);
    assert.match(output.value, /El usuario «admin» ya existe/);
    assert.match(output.value, /elegir otro nombre.*restablecer la contraseña de esa cuenta desde Administración › Usuarios/is);
    const database = new DatabaseSync(databasePath);
    try {
      assert.equal((database.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number }).count, 1);
      assert.equal((database.prepare("SELECT COUNT(*) AS count FROM audit_log").get() as { count: number }).count, 1);
      assert.equal((database.prepare("SELECT displayName FROM users WHERE username = 'admin'").get() as { displayName: string }).displayName, "Ada");
    } finally {
      database.close();
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("treats an existing unmigrated database as available", async () => {
  const directory = await mkdtemp(join(tmpdir(), "academy-create-admin-"));
  const databasePath = join(directory, "academy.sqlite");
  new DatabaseSync(databasePath).close();

  try {
    assert.equal(await runCreateAdmin({
      input: tty(), output: new Output(),
      ask: answers(["Ada", "adal"]),
      readPassword: answers([validPassword, validPassword]),
      env: { SQLITE_DB_PATH: databasePath, FILE_STORAGE_PATH: join(directory, "uploads") },
    }), 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("treats a database with an outdated users table as available", async () => {
  const directory = await mkdtemp(join(tmpdir(), "academy-create-admin-"));
  const databasePath = join(directory, "academy.sqlite");
  const database = new DatabaseSync(databasePath);
  database.exec("CREATE TABLE users (username TEXT)");
  database.close();
  let passwordPrompted = false;

  try {
    assert.equal(await runCreateAdmin({
      input: tty(), output: new Output(),
      ask: answers(["Ada", "adal"]),
      readPassword: async () => { passwordPrompted = true; throw new Error("cancelled"); },
      env: { SQLITE_DB_PATH: databasePath, FILE_STORAGE_PATH: join(directory, "uploads") },
    }), 1);
    assert.equal(passwordPrompted, true);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("treats a missing database as available without creating files or directories", async () => {
  const directory = await mkdtemp(join(tmpdir(), "academy-create-admin-"));
  const databasePath = join(directory, "missing", "academy.sqlite");
  let prepared = false;

  try {
    assert.equal(await runCreateAdmin({
      input: tty(),
      output: new Output(),
      ask: answers(["Ada", "adal"]),
      readPassword: async () => { throw new Error("cancelled"); },
      prepareStorage: async () => { prepared = true; },
      env: { SQLITE_DB_PATH: databasePath, FILE_STORAGE_PATH: join(directory, "uploads") },
    }), 1);
    assert.equal(prepared, false);
    await assert.rejects(access(databasePath));
    await assert.rejects(access(join(directory, "missing")));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("sanitizes unexpected storage errors", async () => {
  const output = new Output();
  const secret = "never-leak-this-password";

  assert.equal(await runCreateAdmin({
    input: tty(),
    output,
    ask: answers(["Ada", "adal"]),
    readPassword: answers([secret, secret]),
    prepareStorage: async () => { throw new Error(`SQL failed at /private/database.sqlite: ${secret}`); },
  }), 1);

  assert.match(output.value, /No se ha podido crear el administrador/i);
  assert.equal(output.value.includes("SQL"), false);
  assert.equal(output.value.includes("/private/database.sqlite"), false);
  assert.equal(output.value.includes(secret), false);
  assert.equal(output.value.includes("Error:"), true);
});

test("entrypoint exits explicitly on success and unexpected rejection", async () => {
  const source = await readFile(new URL("./create-admin.ts", import.meta.url), "utf8");
  const entrypoint = source.slice(source.indexOf("if (import.meta.main)"));
  assert.match(entrypoint, /process\.exit\(exitCode\)/);
  assert.match(entrypoint, /\.catch\(\(\) => \{ process\.exit\(1\); \}\)/);
  assert.doesNotMatch(entrypoint, /process\.exitCode/);
});

test("restores terminal mode after password entry, interruption, and input errors", async () => {
  for (const event of ["secret\r", "\u0003"]) {
    const input = new Input();
    const output = new Output();
    const result = readPassword(input as unknown as NodeJS.ReadStream, output as unknown as NodeJS.WriteStream, "Contraseña: ");
    input.emit("data", Buffer.from(event));
    if (event === "secret\r") assert.equal(await result, "secret");
    else await assert.rejects(result, /interrupted/);
    assert.deepEqual(input.modes, [true, false]);
    assert.deepEqual(input.flow, ["resume", "pause"]);
    assert.equal(output.value.includes("secret"), false);
  }

  const input = new Input();
  const result = readPassword(input as unknown as NodeJS.ReadStream, new Output() as unknown as NodeJS.WriteStream, "Contraseña: ");
  input.emit("error", new Error("unexpected"));
  await assert.rejects(result, /unexpected/);
  assert.deepEqual(input.modes, [true, false]);
  assert.deepEqual(input.flow, ["resume", "pause"]);
});
