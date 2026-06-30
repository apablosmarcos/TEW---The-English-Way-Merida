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

export type LeadForm = FormGroup<{
  name: FormControl<string>;
  email: FormControl<string>;
  phone: FormControl<string>;
  message: FormControl<string>;
}>;

export function createLeadForm(): LeadForm {
  return new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phone: new FormControl('', { nonNullable: true }),
    message: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
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
