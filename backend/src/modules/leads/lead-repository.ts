import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

import type { CreateLeadInput, Lead } from './lead-types.ts';

const defaultLeadsFileUrl = new URL('../../../data/leads.json', import.meta.url);

let writeQueue = Promise.resolve();

export function createLead(input: CreateLeadInput): Promise<{ id: string }> {
  return enqueueWrite(async () => {
    const leads = await readLeads();
    const timestamp = new Date().toISOString();
    const lead: Lead = {
      id: randomUUID(),
      ...input,
      status: 'new',
      notes: '',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    leads.push(lead);
    await writeLeads(leads);

    return { id: lead.id };
  });
}

export async function listLeads(): Promise<Lead[]> {
  return readLeads();
}

function enqueueWrite<T>(operation: () => Promise<T>) {
  const next = writeQueue.then(operation, operation);
  writeQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

async function readLeads() {
  try {
    const file = await readFile(resolveLeadsFilePath(), 'utf8');
    const parsed = JSON.parse(file);

    return Array.isArray(parsed) ? (parsed as Lead[]) : [];
  } catch (error) {
    if (isMissingFileError(error)) {
      return [];
    }

    throw error;
  }
}

async function writeLeads(leads: Lead[]) {
  const filePath = resolveLeadsFilePath();
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(leads, null, 2));
}

function resolveLeadsFilePath() {
  return process.env.LEADS_FILE_PATH ?? fileURLToPath(defaultLeadsFileUrl);
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}
