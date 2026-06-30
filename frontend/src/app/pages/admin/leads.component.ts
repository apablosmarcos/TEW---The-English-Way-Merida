import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AdminApiService, type AdminLead, type AdminLeadStatus } from '../../core/services/admin-api.service';
import { clearAdminSession, readAdminSessionToken } from '../../core/services/admin-session';
import {
  SITE_CONFIG_LOAD_ERROR_MESSAGE,
  SiteConfigService,
} from '../../core/services/site-config.service';

const ADMIN_LEAD_STATUSES: AdminLeadStatus[] = [
  'new',
  'contacted',
  'pending_info',
  'interview',
  'enrolled',
  'discarded',
];

@Component({
  selector: 'app-admin-leads',
  imports: [CommonModule],
  template: `
    <main class="page">
      <header class="topbar">
        <div>
          <p class="eyebrow">Backoffice TEW</p>
          <h1>Leads captados</h1>
        </div>

        <button class="secondary" type="button" (click)="logout()">Salir</button>
      </header>

      <div class="notice error" *ngIf="errorMessage">{{ errorMessage }}</div>
      <div class="notice" *ngIf="isLoading">Cargando leads...</div>

      <section class="layout" *ngIf="!isLoading && !errorMessage">
        <aside class="list">
          <button
            *ngFor="let lead of leads"
            type="button"
            class="lead-card"
            [class.active]="selectedLead?.id === lead.id"
            (click)="selectLead(lead)"
          >
            <strong>{{ lead.name }}</strong>
            <span>{{ lead.email }}</span>
            <span class="meta">{{ lead.status }}</span>
          </button>
        </aside>

        <section class="detail" *ngIf="selectedLead as lead">
          <div class="panel">
            <h2>{{ lead.name }}</h2>
            <p>{{ lead.email }}<span *ngIf="lead.phone"> · {{ lead.phone }}</span></p>
            <p class="message">{{ lead.message }}</p>
          </div>

          <div class="panel editor">
            <label class="field">
              <span>Estado</span>
              <select [value]="draftStatus" (change)="draftStatus = $any($event.target).value">
                <option *ngFor="let status of statuses" [value]="status">{{ status }}</option>
              </select>
            </label>

            <label class="field">
              <span>Notas</span>
              <textarea [value]="draftNotes" (input)="draftNotes = $any($event.target).value"></textarea>
            </label>

            <button type="button" [disabled]="isSaving" (click)="save()">
              {{ isSaving ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </div>
        </section>
      </section>
    </main>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(180deg, #f4efe7 0%, #ffffff 100%);
    }

    .page {
      width: min(1120px, calc(100% - 32px));
      margin: 0 auto;
      padding: 24px 0 40px;
    }

    .topbar,
    .layout {
      display: grid;
      gap: 18px;
    }

    .topbar {
      grid-template-columns: 1fr auto;
      align-items: center;
      margin-bottom: 24px;
    }

    .eyebrow,
    h1,
    h2,
    p {
      margin: 0;
    }

    .eyebrow {
      color: var(--accent-dark);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.8rem;
    }

    .layout {
      grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
      align-items: start;
    }

    .list,
    .detail,
    .editor,
    .field {
      display: grid;
      gap: 14px;
    }

    .lead-card,
    .panel,
    button,
    select,
    textarea {
      border-radius: 18px;
    }

    .lead-card,
    .panel {
      padding: 18px;
      background: #fff;
      border: 1px solid rgba(17, 17, 17, 0.08);
      box-shadow: var(--shadow);
    }

    .lead-card {
      display: grid;
      gap: 6px;
      text-align: left;
      cursor: pointer;
    }

    .lead-card.active {
      border-color: rgba(194, 11, 11, 0.36);
      box-shadow: 0 18px 50px rgba(146, 0, 0, 0.12);
    }

    .meta,
    .message,
    .notice {
      color: var(--muted);
    }

    .message {
      margin-top: 12px;
      line-height: 1.6;
    }

    .field span {
      font-weight: 600;
    }

    select,
    textarea,
    button {
      width: 100%;
      border: 1px solid var(--line);
      padding: 14px 16px;
      font: inherit;
    }

    textarea {
      min-height: 180px;
      resize: vertical;
    }

    button {
      background: var(--accent);
      border: 0;
      color: #fff;
      font-weight: 700;
      cursor: pointer;
    }

    button.secondary {
      width: auto;
      background: #fff;
      color: var(--text);
      border: 1px solid rgba(17, 17, 17, 0.08);
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .notice {
      margin-bottom: 16px;
      padding: 12px 14px;
      background: #fff;
      border-radius: 14px;
    }

    .notice.error {
      background: #fdeeee;
      color: #8d2020;
    }

    @media (max-width: 820px) {
      .topbar,
      .layout {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class LeadsComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly siteConfigService = inject(SiteConfigService);
  private readonly router = inject(Router);

  readonly statuses = ADMIN_LEAD_STATUSES;

  apiBaseUrl = '';
  token = '';
  leads: AdminLead[] = [];
  selectedLead: AdminLead | null = null;
  draftStatus: AdminLeadStatus = 'new';
  draftNotes = '';
  errorMessage = '';
  isLoading = true;
  isSaving = false;

  async ngOnInit() {
    this.token = readAdminSessionToken() ?? '';

    if (!this.token) {
      await this.router.navigateByUrl('/admin');
      return;
    }

    const configState = await firstValueFrom(this.siteConfigService.load());

    if (configState.status === 'error') {
      this.errorMessage = SITE_CONFIG_LOAD_ERROR_MESSAGE;
      this.isLoading = false;
      return;
    }

    if (!configState.config.apiBaseUrl) {
      this.errorMessage = 'El admin requiere un apiBaseUrl valido.';
      this.isLoading = false;
      return;
    }

    this.apiBaseUrl = configState.config.apiBaseUrl;
    await this.loadLeads();
  }

  selectLead(lead: AdminLead) {
    this.selectedLead = lead;
    this.draftStatus = lead.status;
    this.draftNotes = lead.notes;
  }

  async save() {
    if (!this.selectedLead || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    try {
      const response = await firstValueFrom(
        this.adminApi.updateLead(this.apiBaseUrl, this.token, this.selectedLead.id, {
          status: this.draftStatus,
          notes: this.draftNotes,
        }),
      );

      this.leads = this.leads.map((lead) => (lead.id === response.lead.id ? response.lead : lead));
      this.selectLead(response.lead);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.logout();
        return;
      }

      this.errorMessage = 'No se pudo guardar el lead.';
    } finally {
      this.isSaving = false;
    }
  }

  async logout() {
    clearAdminSession();
    await this.router.navigateByUrl('/admin');
  }

  private async loadLeads() {
    this.errorMessage = '';

    try {
      const response = await firstValueFrom(this.adminApi.listLeads(this.apiBaseUrl, this.token));
      this.leads = response.leads;

      if (this.leads[0]) {
        this.selectLead(this.leads[0]);
      }
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        await this.logout();
        return;
      }

      this.errorMessage = 'No se pudieron cargar los leads.';
    } finally {
      this.isLoading = false;
    }
  }
}
