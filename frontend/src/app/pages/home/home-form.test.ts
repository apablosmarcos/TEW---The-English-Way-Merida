import assert from 'node:assert/strict';
import test from 'node:test';
import '@angular/compiler';
import { HttpErrorResponse } from '@angular/common/http';
import { of } from 'rxjs';

import { buildLeadsEndpoint } from '../../core/services/leads-endpoint.ts';
import {
  LEAD_VALIDATION_ERROR_MESSAGE,
  createLeadForm,
  submitLeadForm,
  toLeadSubmitErrorMessage,
} from './home-form.ts';

test('lead form is invalid without required fields', () => {
  const form = createLeadForm();

  assert.equal(form.valid, false);
  assert.equal(form.controls.name.valid, false);
  assert.equal(form.controls.email.valid, false);
  assert.equal(form.controls.message.valid, false);
});

test('lead form matches backend minimum lengths for name and message', () => {
  const form = createLeadForm();
  form.setValue({
    name: 'A',
    email: 'ada@example.com',
    phone: '',
    message: 'Hola',
  });

  assert.equal(form.valid, false);
  assert.equal(form.controls.name.hasError('minlength'), true);
  assert.equal(form.controls.message.hasError('minlength'), true);
});

test('lead form calls API when apiBaseUrl exists', async () => {
  const form = createLeadForm();
  form.setValue({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '',
    message: 'Quiero informacion sobre clases.',
  });

  let calledWith: unknown;
  const result = submitLeadForm(form, 'https://api.example.com', (payload) => {
    calledWith = payload;
    return of({ ok: true as const, leadId: 'lead_123' });
  });

  assert.equal(result.mode, 'api');
  assert.deepEqual(calledWith, form.getRawValue());
  assert.deepEqual(await result.request, { ok: true, leadId: 'lead_123' });
});

test('lead form shows demo-mode message when apiBaseUrl is empty', () => {
  const form = createLeadForm();
  form.setValue({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '',
    message: 'Quiero informacion sobre clases.',
  });

  const result = submitLeadForm(form, '', () => {
    throw new Error('API should not be called in demo mode');
  });

  assert.equal(result.mode, 'demo');
  assert.equal(
    result.message,
    'Demo visual: este formulario no envia datos en GitHub Pages.',
  );
});

test('lead endpoint supports relative apiBaseUrl values like /api', () => {
  assert.equal(buildLeadsEndpoint('/api'), '/api/leads');
});

test('lead endpoint keeps absolute apiBaseUrl support', () => {
  assert.equal(buildLeadsEndpoint('https://api.example.com'), 'https://api.example.com/leads');
});

test('lead submit keeps backend validation errors out of the generic technical message', () => {
  const error = new HttpErrorResponse({ status: 400 });

  assert.equal(toLeadSubmitErrorMessage(error), LEAD_VALIDATION_ERROR_MESSAGE);
});
