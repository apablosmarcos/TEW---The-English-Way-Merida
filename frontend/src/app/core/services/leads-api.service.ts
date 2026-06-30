import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { buildLeadsEndpoint } from './leads-endpoint';
import type { CreateLeadPayload, CreateLeadResponse } from '../../pages/home/home-form';

@Injectable({ providedIn: 'root' })
export class LeadsApiService {
  private readonly http = inject(HttpClient);

  createLead(apiBaseUrl: string, payload: CreateLeadPayload) {
    return this.http.post<CreateLeadResponse>(buildLeadsEndpoint(apiBaseUrl), payload);
  }
}
