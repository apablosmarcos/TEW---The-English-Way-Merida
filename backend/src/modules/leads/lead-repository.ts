import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

import { ensureDatabaseDirectory, importLegacyLeadsIfNeeded, initializeDatabase, openDatabase } from '../storage/sqlite.ts';
import type { CreateLeadInput, Lead, UpdateLeadInput } from './lead-types.ts';

let writeQueue = Promise.resolve();

export async function listLeads(): Promise<Lead[]> {
  return withDatabase((database) =>
    database
      .prepare('SELECT * FROM leads ORDER BY createdAt DESC')
      .all()
      .map((row) => row as Lead),
  );
}

export function updateLead(id: string, input: UpdateLeadInput): Promise<Lead | null> {
  return enqueueWrite(async () => {
    return withDatabase((database) => {
      const currentLead = database.prepare('SELECT * FROM leads WHERE id = ?').get(id) as Lead | undefined;

      if (!currentLead) {
        return null;
      }

      const updatedLead: Lead = {
        ...currentLead,
        status: input.status ?? currentLead.status,
        notes: input.notes ?? currentLead.notes,
        updatedAt: new Date().toISOString(),
      };

      database.prepare(
        'UPDATE leads SET status = @status, notes = @notes, updatedAt = @updatedAt WHERE id = @id',
      ).run({
        id,
        status: updatedLead.status,
        notes: updatedLead.notes,
        updatedAt: updatedLead.updatedAt,
      });

      return updatedLead;
    });
  });
}

export function deleteLead(id: string): Promise<boolean> {
  return enqueueWrite(async () => {
    return withDatabase((database) => {
      const result = database.prepare('DELETE FROM leads WHERE id = ?').run(id);
      return Number(result.changes ?? 0) > 0;
    });
  });
}

function enqueueWrite<T>(operation: () => Promise<T>) {
  const next = writeQueue.then(operation, operation);
  writeQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

async function withDatabase<T>(action: (database: DatabaseSync) => T) {
  await ensureDatabaseDirectory(process.env);
  const database = openDatabase(process.env);

  try {
    initializeDatabase(database);
    importLegacyLeadsIfNeeded(database, process.env);
    return action(database);
  } finally {
    database.close();
  }
}

async function writeLead(lead: Lead) {
  return withDatabase((database) => {
    database.prepare(`
      INSERT INTO leads (
        id, name, email, phone, message, interestType, source,
        studentName, studentSurname, birthDate, address, school, currentCourse,
        primaryContactName, primaryContactSurname, primaryContactRelationship,
        secondaryContactName, secondaryContactSurname, secondaryContactRelationship,
        pickupContact, paymentMethod, paymentAccountHolder, paymentIban, observations,
        status, notes, createdAt, updatedAt
      ) VALUES (
        @id, @name, @email, @phone, @message, @interestType, @source,
        @studentName, @studentSurname, @birthDate, @address, @school, @currentCourse,
        @primaryContactName, @primaryContactSurname, @primaryContactRelationship,
        @secondaryContactName, @secondaryContactSurname, @secondaryContactRelationship,
        @pickupContact, @paymentMethod, @paymentAccountHolder, @paymentIban, @observations,
        @status, @notes, @createdAt, @updatedAt
      )
    `).run(lead);
  });
}

async function createStoredLead(input: CreateLeadInput) {
  const timestamp = new Date().toISOString();
  const lead: Lead = {
    id: randomUUID(),
    name: `${input.studentName} ${input.studentSurname}`.trim(),
    message: buildLeadSummary(input),
    interestType: null,
    ...input,
    status: 'new',
    notes: '',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await writeLead(lead);
  return lead;
}

export function createLead(input: CreateLeadInput): Promise<{ id: string }> {
  return enqueueWrite(async () => {
    const lead = await createStoredLead(input);
    return { id: lead.id };
  });
}

function buildLeadSummary(input: CreateLeadInput) {
  return [
    input.school,
    input.currentCourse,
    `${input.primaryContactRelationship}: ${input.primaryContactName} ${input.primaryContactSurname}`,
    `Pago: ${input.paymentMethod}`,
  ].join(' · ');
}

/*
  Old JSON helpers removed in favor of SQLite storage.
*/
