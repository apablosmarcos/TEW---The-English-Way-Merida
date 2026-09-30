import { existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { DatabaseSync } from "node:sqlite";

import { AcademyUserError } from "../modules/academy/academy-errors.ts";
import { AuditRepository } from "../modules/academy/audit-repository.ts";
import { minimumPasswordLength } from "../modules/academy/password.ts";
import { UserRepository } from "../modules/academy/user-repository.ts";
import { UserService } from "../modules/academy/user-service.ts";
import { applyAcademyMigrations } from "../modules/storage/academy-migrations.ts";
import { ensureStorageDirectories, openDatabase, resolveDatabasePath } from "../modules/storage/sqlite.ts";
import { readPassword as readTtyPassword } from "./tty-password.ts";

type CliInput = { isTTY?: boolean };
type CliOutput = { isTTY?: boolean; write(message: string): void };
type Prompter = (prompt: string) => Promise<string>;
type UsernameAvailability = (username: string) => boolean | Promise<boolean>;

type CreateAdminOptions = {
  input?: CliInput;
  output?: CliOutput;
  env?: NodeJS.ProcessEnv;
  ask?: Prompter;
  readPassword?: Prompter;
  isUsernameTaken?: UsernameAvailability;
  prepareStorage?: (env: NodeJS.ProcessEnv) => Promise<unknown>;
};

export async function runCreateAdmin(options: CreateAdminOptions = {}) {
  const input = options.input ?? process.stdin;
  const output = options.output ?? process.stdout;
  if (!input.isTTY || !output.isTTY) {
    return failure(output, "La contraseña se introduce oculta. Ejecute este comando desde un terminal interactivo: ssh -t <host> 'cd /opt/tewacademy && docker compose exec backend node backend/dist/cli/create-admin.js'. No use -T ni tuberías.");
  }

  const ask = options.ask ?? ((prompt) => askLine(input, output, prompt));
  const readPassword: Prompter = options.readPassword ?? ((prompt) => readTtyPassword(input as NodeJS.ReadStream & { setRawMode(mode: boolean): void }, output, prompt));
  const usernameTaken = options.isUsernameTaken ?? ((username: string) => isUsernameTaken(options.env ?? process.env, username));
  output.write(`Crear administrador\nReglas:\n- El nombre visible es obligatorio.\n- El usuario debe tener entre 4 y 30 caracteres: minúsculas, números y . _ -.\n- La contraseña debe tener al menos ${minimumPasswordLength} caracteres; se introduce oculta dos veces.\n`);

  let displayName: string | undefined;
  let username: string | undefined;
  let password: string | undefined;
  try {
    displayName = await promptWithRetries(ask, "Nombre visible: ", "nombre visible", output, (value) => {
      const name = value.trim();
      return name ? undefined : "El nombre visible no puede estar vacío.";
    });
    if (displayName === undefined) return 1;
    displayName = displayName.trim();

    username = await promptWithRetries(ask, "Usuario: ", "usuario", output, async (value) => {
      const user = value.normalize("NFC");
      if (!user.trim()) return "El usuario no puede estar vacío.";
      if (!/^[a-z0-9._-]+$/.test(user)) return "El usuario solo puede contener minúsculas, números y . _ -.";
      if (user.length < 4 || user.length > 30) return `El usuario tiene ${user.length} caracteres; debe tener entre 4 y 30.`;
      return await usernameTaken(user) ? usernameTakenMessage(user) : undefined;
    });
    if (username === undefined) return 1;
    username = username.normalize("NFC");

    password = await promptWithRetries(readPassword, "Contraseña: ", "contraseña", output, (value) => {
      if (!value) return "La contraseña no puede estar vacía.";
      return value.length < minimumPasswordLength ? `La contraseña tiene ${value.length} caracteres; el mínimo es ${minimumPasswordLength}.` : undefined;
    });
    if (password === undefined) return 1;

    const confirmation = await promptWithRetries(readPassword, "Confirmar contraseña: ", "confirmación", output, (value) => {
      if (!value) return "La confirmación no puede estar vacía.";
      return value === password ? undefined : "Las contraseñas no coinciden.";
    });
    if (confirmation === undefined) return 1;
  } catch {
    return failure(output, "Entrada cancelada.");
  }

  let database: ReturnType<typeof openDatabase> | undefined;
  try {
    await (options.prepareStorage ?? ensureStorageDirectories)(options.env ?? process.env);
    database = openDatabase(options.env ?? process.env);
    applyAcademyMigrations(database);
    await new UserService(new UserRepository(database), new AuditRepository(database)).createActiveAdministrator({ displayName, username, password });
    output.write(`Administrador «${username}» creado. Ya puede entrar en /academia/acceso.\n`);
    return 0;
  } catch (error) {
    return failure(output, error instanceof AcademyUserError && error.code === "USERNAME_TAKEN" ? usernameTakenMessage(username) : "No se ha podido crear el administrador.");
  } finally {
    database?.close();
  }
}

async function promptWithRetries(read: Prompter, prompt: string, field: string, output: CliOutput, validate: (value: string) => string | undefined | Promise<string | undefined>) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const value = await read(prompt);
    const message = await validate(value);
    if (!message) return value;
    output.write(`Error: ${message}\n`);
  }
  failure(output, `Se ha agotado el límite de 3 intentos para ${field}.`);
  return undefined;
}

function usernameTakenMessage(username: string) {
  return `El usuario «${username}» ya existe. Puede elegir otro nombre o restablecer la contraseña de esa cuenta desde Administración › Usuarios.`;
}

function isUsernameTaken(env: NodeJS.ProcessEnv, username: string) {
  const path = resolveDatabasePath(env);
  if (path === ":memory:" || !existsSync(path)) return false;

  const database = new DatabaseSync(path, { readOnly: true });
  try {
    if (!database.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'users'").get()) return false;
    const columns = new Set((database.prepare("PRAGMA table_info(users)").all() as { name: string }[]).map(({ name }) => name));
    if (!columns.has("normalizedUsername") || !columns.has("deletedAt")) return false;
    return !!database.prepare("SELECT 1 FROM users WHERE normalizedUsername = ? AND deletedAt IS NULL").get(username);
  } finally {
    database.close();
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

if (import.meta.main) {
  void runCreateAdmin().then((exitCode) => { process.exit(exitCode); }).catch(() => { process.exit(1); });
}
