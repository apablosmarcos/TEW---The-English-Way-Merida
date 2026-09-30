import { createApp } from './app.ts';
import { getPort } from './config/env.ts';
import { applyAcademyMigrations } from './modules/storage/academy-migrations.ts';
import { ensureStorageDirectories, openDatabase } from './modules/storage/sqlite.ts';
import { startupDiagnostic } from './startup-diagnostic.ts';

async function start() {
  await ensureStorageDirectories(process.env);

  const database = openDatabase(process.env);
  try {
    applyAcademyMigrations(database);
  } finally {
    database.close();
  }

  createApp().listen(getPort(), () => {
    console.log(`API listening on http://localhost:${getPort()}`);
  });
}

void start().catch((error: unknown) => {
  console.error(JSON.stringify(startupDiagnostic(error)));
  process.exitCode = 1;
});
