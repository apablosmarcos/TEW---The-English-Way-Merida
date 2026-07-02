import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { firstValueFrom, type Observable } from 'rxjs';

export interface CreateLeadPayload {
  studentName: string;
  studentSurname: string;
  birthDate: string;
  address: string;
  email: string;
  phone: string;
  school: string;
  currentCourse: string;
  primaryContactName: string;
  primaryContactSurname: string;
  primaryContactRelationship: string;
  secondaryContactName: string;
  secondaryContactSurname: string;
  secondaryContactRelationship: string;
  pickupContact: string;
  paymentMethod: string;
  paymentAccountHolder: string;
  paymentIban: string;
  observations: string;
}

export interface CreateLeadResponse {
  ok: true;
  leadId: string;
}

export const DEMO_MODE_MESSAGE = 'Demo visual: este formulario no envia datos en GitHub Pages.';
export const LEAD_VALIDATION_ERROR_MESSAGE =
  'Revisa el formulario: faltan datos obligatorios o hay campos demasiado cortos.';
const GENERIC_LEAD_ERROR_MESSAGE =
  'No hemos podido enviar tu solicitud. Escribenos al email de contacto.';
const LEAD_TEXT_MIN_LENGTH = 2;
const LEAD_ADDRESS_MIN_LENGTH = 5;

export type LeadForm = FormGroup<{
  studentName: FormControl<string>;
  studentSurname: FormControl<string>;
  birthDate: FormControl<string>;
  address: FormControl<string>;
  email: FormControl<string>;
  phone: FormControl<string>;
  school: FormControl<string>;
  currentCourse: FormControl<string>;
  primaryContactName: FormControl<string>;
  primaryContactSurname: FormControl<string>;
  primaryContactRelationship: FormControl<string>;
  secondaryContactName: FormControl<string>;
  secondaryContactSurname: FormControl<string>;
  secondaryContactRelationship: FormControl<string>;
  pickupContact: FormControl<string>;
  paymentMethod: FormControl<string>;
  paymentAccountHolder: FormControl<string>;
  paymentIban: FormControl<string>;
  observations: FormControl<string>;
}>;

export function createLeadForm(): LeadForm {
  return new FormGroup({
    studentName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(LEAD_TEXT_MIN_LENGTH)],
    }),
    studentSurname: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(LEAD_TEXT_MIN_LENGTH)],
    }),
    birthDate: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    address: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(LEAD_ADDRESS_MIN_LENGTH)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phone: new FormControl('', { nonNullable: true }),
    school: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(LEAD_TEXT_MIN_LENGTH)],
    }),
    currentCourse: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(LEAD_TEXT_MIN_LENGTH)],
    }),
    primaryContactName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(LEAD_TEXT_MIN_LENGTH)],
    }),
    primaryContactSurname: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(LEAD_TEXT_MIN_LENGTH)],
    }),
    primaryContactRelationship: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(LEAD_TEXT_MIN_LENGTH)],
    }),
    secondaryContactName: new FormControl('', { nonNullable: true }),
    secondaryContactSurname: new FormControl('', { nonNullable: true }),
    secondaryContactRelationship: new FormControl('', { nonNullable: true }),
    pickupContact: new FormControl('', { nonNullable: true }),
    paymentMethod: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    paymentAccountHolder: new FormControl('', { nonNullable: true }),
    paymentIban: new FormControl('', { nonNullable: true }),
    observations: new FormControl('', {
      nonNullable: true,
      validators: [],
    }),
  });
}

export function toLeadSubmitErrorMessage(error: unknown) {
  if (error instanceof HttpErrorResponse && error.status === 400) {
    return LEAD_VALIDATION_ERROR_MESSAGE;
  }

  return GENERIC_LEAD_ERROR_MESSAGE;
}

export function submitLeadForm(
  form: LeadForm,
  apiBaseUrl: string,
  createLead: (payload: CreateLeadPayload) => Observable<CreateLeadResponse>,
) {
  if (apiBaseUrl.trim()) {
    return {
      mode: 'api' as const,
      request: firstValueFrom(createLead(form.getRawValue())),
    };
  }

  return {
    mode: 'demo' as const,
    message: DEMO_MODE_MESSAGE,
  };
}
