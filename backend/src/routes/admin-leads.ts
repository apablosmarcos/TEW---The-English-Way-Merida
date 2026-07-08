import { Router } from 'express';

import { isValidAdminSessionToken } from '../modules/auth/admin-session-repository.ts';
import { deleteLead, listLeads, updateLead } from '../modules/leads/lead-repository.ts';
import { leadStatuses, type LeadStatus } from '../modules/leads/lead-types.ts';

export const adminLeadsRouter = Router();

adminLeadsRouter.use('/admin/leads', (req, res, next) => {
  try {
    const token = readBearerToken(req.headers.authorization);

    if (!isValidAdminSessionToken(token, process.env)) {
      res.status(401).json({ ok: false });
      return;
    }

    next();
  } catch {
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

adminLeadsRouter.get('/admin/leads', async (_req, res) => {
  try {
    res.json({ ok: true, leads: await listLeads() });
  } catch {
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

adminLeadsRouter.patch('/admin/leads/:id', async (req, res) => {
  try {
    const input = parseUpdateLeadInput(req.body);
    const lead = await updateLead(req.params.id, input);

    if (!lead) {
      res.status(404).json({ ok: false, error: 'Lead not found' });
      return;
    }

    res.json({ ok: true, lead });
  } catch (error) {
    if (error instanceof InvalidAdminLeadPayloadError) {
      res.status(400).json({ ok: false, error: 'Invalid lead update payload' });
      return;
    }

    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

adminLeadsRouter.delete('/admin/leads/:id', async (req, res) => {
  try {
    const deleted = await deleteLead(req.params.id);

    if (!deleted) {
      res.status(404).json({ ok: false, error: 'Lead not found' });
      return;
    }

    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

class InvalidAdminLeadPayloadError extends Error {}

function readBearerToken(header: string | undefined) {
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
}

function parseUpdateLeadInput(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new InvalidAdminLeadPayloadError('Invalid payload');
  }

  const data = input as Record<string, unknown>;
  const status = readOptionalStatus(data.status);
  const notes = readOptionalNotes(data.notes);

  if (status === undefined && notes === undefined) {
    throw new InvalidAdminLeadPayloadError('Missing fields');
  }

  return { status, notes };
}

function readOptionalStatus(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string' || !leadStatuses.includes(value as LeadStatus)) {
    throw new InvalidAdminLeadPayloadError('Invalid status');
  }

  return value as LeadStatus;
}

function readOptionalNotes(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new InvalidAdminLeadPayloadError('Invalid notes');
  }

  return value.trim();
}
