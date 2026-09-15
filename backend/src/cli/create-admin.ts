import { createInterface } from "node:readline/promises";

import { AcademyUserError } from "../modules/academy/academy-errors.ts";
import { AuditRepository } from "../modules/academy/audit-repository.ts";
import { UserRepository } from "../modules/academy/user-repository.ts";
import { UserService } from "../modules/academy/user-service.ts";
import { applyAcademyMigrations } from "../modules/storage/academy-migrations.ts";
import { ensureStorageDirectories, openDatabase } from "../modules/storage/sqlite.ts";
import { readPassword as readTtyPassword } from "./tty-password.ts";

type CliInput = { isTTY?: boolean };
type CliOutput = { isTTY?: boolean; write(message: string): void };
type Prompter = (prompt: string) => Promise<string>;

type CreateAdminOptions = {
  input?: CliInput;
  output?: CliOutput;
  env?: NodeJS.ProcessEnv;
  ask?: Prompter;
  readPassword?: Prompter;
  prepareStorage?: (env: NodeJS.ProcessEnv) => Promise<unknown>;
};

export async function runCreateAdmin(options: CreateAdminOptions = {}) {
  const input = options.input ?? process.stdin;
  const output = options.output ?? process.stdout;
  if (!input.isTTY || !output.isTTY) return failure(output, "academy:create-admin requires TTY stdin and stdout.");

  const ask = options.ask ?? ((prompt) => askLine(input, output, prompt));
  const readPassword: Prompter = options.readPassword ?? (async (prompt): Promise<string> => String(await readTtyPassword(input as NodeJS.ReadStream & { setRawMode(mode: boolean): unknown }, output, prompt)));
  let displayName: string;
  let username: string;
  let password: string;
  try {
    displayName = (await ask("Display name: ")).trim();
    username = (await ask("Username: ")).trim().normalize("NFC");
    password = await readPassword("Password: ");
    const confirmation = await readPassword("Confirm password: ");
    if (!displayName || !/^[a-z0-9._-]{4,30}$/.test(username) || !password) throw new InputError("Invalid display name, username, or password.");
    if (password !== confirmation) throw new InputError("Passwords do not match.");
  } catch (error) {
    return failure(output, error instanceof InputError ? error.message : "Unable to read administrator details.");
  }

  let database: ReturnType<typeof openDatabase> | undefined;
  try {
    await (options.prepareStorage ?? ensureStorageDirectories)(options.env ?? process.env);
    database = openDatabase(options.env ?? process.env);
    applyAcademyMigrations(database);
    await new UserService(new UserRepository(database), new AuditRepository(database)).createActiveAdministrator({ displayName, username, password });
    output.write("Administrator created.\n");
    return 0;
  } catch (error) {
    return failure(output, error instanceof AcademyUserError && error.code === "USERNAME_TAKEN" ? "Username is already in use." : "Unable to create administrator.");
  } finally {
    database?.close();
  }
}

async function askLine(input: CliInput, output: CliOutput, prompt: string) {
  const line = createInterface({ input: input as NodeJS.ReadStream, output: output as NodeJS.WriteStream });
  try {
    return await line.question(prompt);
  } finally {
    line.close();
  }
}

function failure(output: CliOutput, message: string) {
  output.write(`Error: ${message}\n`);
  return 1;
}

class InputError extends Error {}

if (import.meta.main) {
  void runCreateAdmin().then((exitCode) => { process.exitCode = exitCode; });
}
