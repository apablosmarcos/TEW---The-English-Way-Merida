import assert from 'node:assert/strict';
import test from 'node:test';

import type { AdminLead } from '../../core/services/admin-api.service.ts';
import { removeLeadFromState } from './leads-state.ts';

function makeLead(id: string): AdminLead {
  return {
    id,
    name: `Lead ${id}`,
    email: `${id}@example.com`,
    phone: null,
    message: `Mensaje ${id}`,
    interestType: null,
    source: 'public-site',
    status: 'new',
    notes: '',
    createdAt: '2026-07-02T00:00:00.000Z',
    updatedAt: '2026-07-02T00:00:00.000Z',
  };
}

test('removeLeadFromState removes the selected lead and selects the next one', () => {
  const leadA = makeLead('a');
  const leadB = makeLead('b');
  const leadC = makeLead('c');

  const result = removeLeadFromState([leadA, leadB, leadC], leadB, 'b');

  assert.deepEqual(result.leads.map((lead) => lead.id), ['a', 'c']);
  assert.equal(result.selectedLead?.id, 'c');
});

test('removeLeadFromState keeps the current selection when deleting another lead', () => {
  const leadA = makeLead('a');
  const leadB = makeLead('b');

  const result = removeLeadFromState([leadA, leadB], leadA, 'b');

  assert.deepEqual(result.leads.map((lead) => lead.id), ['a']);
  assert.equal(result.selectedLead?.id, 'a');
});

test('removeLeadFromState clears the selection when the last lead is removed', () => {
  const leadA = makeLead('a');

  const result = removeLeadFromState([leadA], leadA, 'a');

  assert.deepEqual(result.leads, []);
  assert.equal(result.selectedLead, null);
});
