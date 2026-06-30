import test from 'node:test';
import assert from 'node:assert/strict';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

import { createLead, listLeads, updateLead } from './lead-repository.ts';

test('createLead stores a new lead with empty notes', async () => {
  const leadsFilePath = join(tmpdir(), `tew-leads-${randomUUID()}.json`);
  process.env.LEADS_FILE_PATH = leadsFilePath;

  try {
    const result = await createLead({
      name: 'Ana Perez',
      email: 'ana@example.com',
      phone: '600000000',
      message: 'Quiero informacion',
      interestType: 'primary',
      source: 'public-site',
    });

    assert.equal(typeof result.id, 'string');
    assert.notEqual(result.id, '');

    const leads = await listLeads();
    const lead = leads.find((entry: { id: string }) => entry.id === result.id);

    assert.ok(lead);
    assert.equal(lead.status, 'new');
    assert.equal(lead.notes, '');
  } finally {
    delete process.env.LEADS_FILE_PATH;
    await rm(leadsFilePath, { force: true });
  }
});

test('updateLead persists status and notes for an existing lead', async () => {
  const leadsFilePath = join(tmpdir(), `tew-leads-${randomUUID()}.json`);
  process.env.LEADS_FILE_PATH = leadsFilePath;

  try {
    const created = await createLead({
      name: 'Ana Perez',
      email: 'ana@example.com',
      phone: '600000000',
      message: 'Quiero informacion',
      interestType: 'primary',
      source: 'public-site',
    });

    const updated = await updateLead(created.id, {
      status: 'contacted',
      notes: 'Llamada realizada',
    });

    assert.ok(updated);
    assert.equal(updated.status, 'contacted');
    assert.equal(updated.notes, 'Llamada realizada');

    const [storedLead] = await listLeads();

    assert.equal(storedLead.id, created.id);
    assert.equal(storedLead.status, 'contacted');
    assert.equal(storedLead.notes, 'Llamada realizada');
    assert.notEqual(storedLead.updatedAt, storedLead.createdAt);
  } finally {
    delete process.env.LEADS_FILE_PATH;
    await rm(leadsFilePath, { force: true });
  }
});
