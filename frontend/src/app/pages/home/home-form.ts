import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { firstValueFrom, type Observable } from 'rxjs';

export interface CreateLeadPayload {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export interface CreateLeadResponse {
  ok: true;
  leadId: string;
}

export const DEMO_MODE_MESSAGE = 'Demo visual: este formulario no envia datos en GitHub Pages.';
export const LEAD_VALIDATION_ERROR_MESSAGE =
  'Revisa el formulario: el nombre debe tener al menos 2 caracteres y el mensaje al menos 5.';
const GENERIC_LEAD_ERROR_MESSAGE =
  'No hemos podido enviar tu solicitud. Escribenos al email de contacto.';
const LEAD_NAME_MIN_LENGTH = 2;
const LEAD_MESSAGE_MIN_LENGTH = 5;

export type LeadForm = FormGroup<{
  name: FormControl<string>;
  email: FormControl<string>;
  phone: FormControl<string>;
  message: FormControl<string>;
}>;

export function createLeadForm(): LeadForm {
  return new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(LEAD_NAME_MIN_LENGTH)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phone: new FormControl('', { nonNullable: true }),
    message: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(LEAD_MESSAGE_MIN_LENGTH)],
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
