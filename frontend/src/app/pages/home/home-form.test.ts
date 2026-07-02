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
  assert.equal(form.controls.studentName.valid, false);
  assert.equal(form.controls.studentSurname.valid, false);
  assert.equal(form.controls.birthDate.valid, false);
  assert.equal(form.controls.address.valid, false);
  assert.equal(form.controls.email.valid, false);
  assert.equal(form.controls.school.valid, false);
  assert.equal(form.controls.currentCourse.valid, false);
  assert.equal(form.controls.primaryContactName.valid, false);
  assert.equal(form.controls.primaryContactSurname.valid, false);
  assert.equal(form.controls.primaryContactRelationship.valid, false);
  assert.equal(form.controls.paymentMethod.valid, false);
  assert.equal(form.controls.observations.valid, true);
});

test('lead form matches backend minimum lengths for student and family text fields', () => {
  const form = createLeadForm();
  form.setValue({
    studentName: 'A',
    studentSurname: 'B',
    birthDate: '2014-05-10',
    address: 'C',
    email: 'ada@example.com',
    phone: '',
    school: 'D',
    currentCourse: 'E',
    primaryContactName: 'F',
    primaryContactSurname: 'G',
    primaryContactRelationship: 'H',
    secondaryContactName: '',
    secondaryContactSurname: '',
    secondaryContactRelationship: '',
    pickupContact: '',
    paymentMethod: 'bizum',
    paymentAccountHolder: '',
    paymentIban: '',
    observations: '',
  });

  assert.equal(form.valid, false);
  assert.equal(form.controls.studentName.hasError('minlength'), true);
  assert.equal(form.controls.studentSurname.hasError('minlength'), true);
  assert.equal(form.controls.address.hasError('minlength'), true);
  assert.equal(form.controls.school.hasError('minlength'), true);
  assert.equal(form.controls.currentCourse.hasError('minlength'), true);
  assert.equal(form.controls.primaryContactName.hasError('minlength'), true);
  assert.equal(form.controls.primaryContactSurname.hasError('minlength'), true);
  assert.equal(form.controls.primaryContactRelationship.hasError('minlength'), true);
  assert.equal(form.controls.observations.valid, true);
});

test('lead form calls API when apiBaseUrl exists', async () => {
  const form = createLeadForm();
  form.setValue({
    studentName: 'Ada',
    studentSurname: 'Lovelace',
    birthDate: '2014-05-10',
    address: 'Calle Mayor 1, Merida',
    email: 'ada@example.com',
    phone: '600000000',
    school: 'Colegio Ejemplo',
    currentCourse: '5 Primaria',
    primaryContactName: 'Laura',
    primaryContactSurname: 'Lovelace',
    primaryContactRelationship: 'Madre',
    secondaryContactName: 'Juan',
    secondaryContactSurname: 'Lovelace',
    secondaryContactRelationship: 'Padre',
    pickupContact: 'Rocio Lovelace - Tia',
    paymentMethod: 'bizum',
    paymentAccountHolder: 'Laura Lovelace',
    paymentIban: 'ES7620770024003102575766',
    observations: 'Alergia alimentaria',
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
    studentName: 'Ada',
    studentSurname: 'Lovelace',
    birthDate: '2014-05-10',
    address: 'Calle Mayor 1, Merida',
    email: 'ada@example.com',
    phone: '600000000',
    school: 'Colegio Ejemplo',
    currentCourse: '5 Primaria',
    primaryContactName: 'Laura',
    primaryContactSurname: 'Lovelace',
    primaryContactRelationship: 'Madre',
    secondaryContactName: '',
    secondaryContactSurname: '',
    secondaryContactRelationship: '',
    pickupContact: '',
    paymentMethod: 'bizum',
    paymentAccountHolder: '',
    paymentIban: '',
    observations: 'Sin observaciones relevantes',
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
