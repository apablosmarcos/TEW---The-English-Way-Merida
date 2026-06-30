import { Router } from 'express';

import { InvalidLeadPayloadError, parseCreateLeadInput } from '../modules/leads/lead-schema.ts';
import { createLead } from '../modules/leads/lead-repository.ts';

export const leadsRouter = Router();

leadsRouter.post('/leads', async (req, res) => {
  try {
    const input = parseCreateLeadInput(req.body);
    const { id } = await createLead(input);

    res.status(201).json({ ok: true, leadId: id });
  } catch (error) {
    if (error instanceof InvalidLeadPayloadError) {
      res.status(400).json({ ok: false, error: 'Invalid lead payload' });
      return;
    }

    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});
