import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { EventEmitter } from "node:events";
import { DatabaseSync } from "node:sqlite";

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
  setRawMode(mode: boolean) { this.modes.push(mode); return this; }
  resume() { return this; }
}

function answers(values: string[]) {
  return async () => {
    const value = values.shift();
    if (value === undefined) throw new Error("Missing test answer");
    return value;
  };
}

function tty() { return { isTTY: true } as NodeJS.ReadStream; }

test("rejects non-TTY before prompting or preparing storage", async () => {
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
  assert.match(output.value, /TTY stdin and stdout/);
});

test("rejects passwords shorter than ten characters before preparing storage", async () => {
  for (const [password, expectedCode] of [["123456789", 1], ["1234567890", 0]] as const) {
    let prepared = false;
    const output = new Output();

    const exitCode = await runCreateAdmin({
      input: tty(),
      output,
      ask: answers(["Ada Lovelace", `ada${password.length}`]),
      readPassword: answers([password, password]),
      env: { SQLITE_DB_PATH: ":memory:", FILE_STORAGE_PATH: tmpdir() },
      prepareStorage: async () => { prepared = true; },
    });

    assert.equal(exitCode, expectedCode);
    assert.equal(prepared, password.length === 10);
  }
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
    assert.match(output.value, /Administrator created/);
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

test("rejects validation, mismatch, and duplicate usernames without adding users", async () => {
  const directory = await mkdtemp(join(tmpdir(), "academy-create-admin-"));
  const databasePath = join(directory, "academy.sqlite");
  const env = { SQLITE_DB_PATH: databasePath, FILE_STORAGE_PATH: join(directory, "uploads") };

  try {
    for (const values of [["", "adal", "valid-password", "valid-password"], ["Ada", "adal", "valid-password", "different-password"]]) {
      const output = new Output();
      assert.equal(await runCreateAdmin({ input: tty(), output, ask: answers(values.slice(0, 2)), readPassword: answers(values.slice(2)), env }), 1);
      assert.match(output.value, /invalid|match/i);
      const database = new DatabaseSync(databasePath);
      try {
        assert.equal((database.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name = 'users'").get() as { count: number }).count, 0);
      } finally {
        database.close();
      }
    }

    assert.equal(await runCreateAdmin({ input: tty(), output: new Output(), ask: answers(["Ada", "adal"]), readPassword: answers(["valid-password", "valid-password"]), env }), 0);
    const output = new Output();
    assert.equal(await runCreateAdmin({ input: tty(), output, ask: answers(["Other", "adal"]), readPassword: answers(["valid-password", "valid-password"]), env }), 1);
    assert.match(output.value, /already in use/i);
    const database = new DatabaseSync(databasePath);
    try {
      assert.equal((database.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number }).count, 1);
      assert.equal((database.prepare("SELECT COUNT(*) AS count FROM audit_log").get() as { count: number }).count, 1);
    } finally {
      database.close();
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("restores terminal mode after password entry, interruption, and input errors", async () => {
  for (const event of ["secret\r", "\u0003"]) {
    const input = new Input();
    const output = new Output();
    const result = readPassword(input as unknown as NodeJS.ReadStream, output as unknown as NodeJS.WriteStream, "Password: ");
    input.emit("data", Buffer.from(event));
    if (event === "secret\r") assert.equal(await result, "secret");
    else await assert.rejects(result, /interrupted/);
    assert.deepEqual(input.modes, [true, false]);
    assert.equal(output.value.includes("secret"), false);
  }

  const input = new Input();
  const result = readPassword(input as unknown as NodeJS.ReadStream, new Output() as unknown as NodeJS.WriteStream, "Password: ");
  input.emit("error", new Error("unexpected"));
  await assert.rejects(result, /unexpected/);
  assert.deepEqual(input.modes, [true, false]);
});
