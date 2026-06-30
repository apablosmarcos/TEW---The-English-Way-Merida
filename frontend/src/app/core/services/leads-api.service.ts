import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import type { CreateLeadPayload, CreateLeadResponse } from '../../pages/home/home-form';

@Injectable({ providedIn: 'root' })
export class LeadsApiService {
  private readonly http = inject(HttpClient);

  createLead(apiBaseUrl: string, payload: CreateLeadPayload) {
    const normalizedBaseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`;

    return this.http.post<CreateLeadResponse>(new URL('leads', normalizedBaseUrl).toString(), payload);
  }
}
