import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import {
  buildAdminLeadDetailEndpoint,
  buildAdminLeadsEndpoint,
  buildAdminLoginEndpoint,
} from './admin-endpoint';

export type AdminLeadStatus =
  | 'new'
  | 'contacted'
  | 'pending_info'
  | 'interview'
  | 'enrolled'
  | 'discarded';

export type AdminLead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  interestType: string | null;
  source: string;
  studentName: string;
  studentSurname: string;
  birthDate: string;
  address: string;
  school: string;
  currentCourse: string;
  primaryContactName: string;
  primaryContactSurname: string;
  primaryContactRelationship: string;
  secondaryContactName: string | null;
  secondaryContactSurname: string | null;
  secondaryContactRelationship: string | null;
  pickupContact: string | null;
  paymentMethod: string;
  paymentAccountHolder: string | null;
  paymentIban: string | null;
  observations: string;
  status: AdminLeadStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminLoginResponse = {
  ok: true;
  token: string;
  expiresAt: string;
};

export type AdminLeadsResponse = {
  ok: true;
  leads: AdminLead[];
};

export type AdminLeadResponse = {
  ok: true;
  lead: AdminLead;
};

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);

  login(apiBaseUrl: string, username: string, password: string) {
    return this.http.post<AdminLoginResponse>(buildAdminLoginEndpoint(apiBaseUrl), {
      username,
      password,
    });
  }

  listLeads(apiBaseUrl: string, token: string) {
    return this.http.get<AdminLeadsResponse>(buildAdminLeadsEndpoint(apiBaseUrl), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  deleteLead(apiBaseUrl: string, token: string, leadId: string) {
    return this.http.delete<{ ok: true }>(buildAdminLeadDetailEndpoint(apiBaseUrl, leadId), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  updateLead(apiBaseUrl: string, token: string, leadId: string, payload: { status: AdminLeadStatus; notes: string }) {
    return this.http.patch<AdminLeadResponse>(buildAdminLeadDetailEndpoint(apiBaseUrl, leadId), payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}
