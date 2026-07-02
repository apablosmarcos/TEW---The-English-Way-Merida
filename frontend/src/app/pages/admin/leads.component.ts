import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AdminApiService, type AdminLead } from '../../core/services/admin-api.service';
import { clearAdminSession, readAdminSessionToken } from '../../core/services/admin-session';
import {
  SITE_CONFIG_LOAD_ERROR_MESSAGE,
  SiteConfigService,
} from '../../core/services/site-config.service';
import { removeLeadFromState } from './leads-state';

@Component({
  selector: 'app-admin-leads',
  imports: [CommonModule],
  template: `
    <main class="page">
      <header class="topbar">
        <div class="topbar-copy">
          <div class="brand-row">
            <img class="brand-logo" src="assets/img/TEW.png" alt="The English Way" />
            <span class="brand-chip">TEW Admin</span>
          </div>
          <p class="eyebrow">Backoffice TEW</p>
          <h1>Leads captados</h1>
          <p class="copy">Consulta rapida de formularios entrantes y limpieza de la bandeja cuando ya estan tramitados.</p>
        </div>

        <button class="secondary" type="button" (click)="logout()">Salir</button>
      </header>

      <div class="notice error" *ngIf="errorMessage" role="alert" aria-live="assertive">{{ errorMessage }}</div>
      <div class="notice success" *ngIf="successMessage" role="status" aria-live="polite">{{ successMessage }}</div>
      <div class="notice" *ngIf="isLoading">Cargando leads...</div>

      <section class="layout" *ngIf="!isLoading && !errorMessage">
        <aside class="list list-panel">
          <div class="list-head">
            <p class="list-title">Matrículas pendientes</p>
            <p class="list-count">{{ leads.length }} abiertas</p>
          </div>

          <button
            *ngFor="let lead of leads"
            type="button"
            class="lead-card"
            [class.active]="selectedLead?.id === lead.id"
            (click)="selectLead(lead)"
          >
            <strong class="lead-title">{{ lead.name }}</strong>
            <span class="preview lead-preview">{{ previewMessage(lead.message) }}</span>
            <span class="lead-email">{{ lead.email }}</span>
            <span class="meta lead-meta">{{ lead.phone ? lead.phone : formatDate(lead.createdAt) }}</span>
          </button>

          <p class="notice" *ngIf="!leads.length">No hay leads pendientes.</p>
        </aside>

        <section class="detail" *ngIf="selectedLead as lead">
          <div class="panel lead-summary">
            <p class="label">Detalle de solicitud</p>
            <h2>{{ lead.studentName }} {{ lead.studentSurname }}</h2>
            <p>{{ lead.email }}<span *ngIf="lead.phone"> · {{ lead.phone }}</span></p>
            <p class="meta">Recibido el {{ formatDate(lead.createdAt) }}</p>
          </div>

          <div class="panel">
            <p class="label">Información del alumno</p>
            <p class="message"><strong>Fecha de nacimiento:</strong> {{ lead.birthDate }}</p>
            <p class="message"><strong>Domicilio:</strong> {{ lead.address }}</p>
          </div>

          <div class="panel">
            <p class="label">Centro educativo</p>
            <p class="message"><strong>Centro educativo:</strong> {{ lead.school }}</p>
            <p class="message"><strong>Curso actual:</strong> {{ lead.currentCourse }}</p>
          </div>

          <div class="panel">
            <p class="label">Familia</p>
            <p class="message">
              <strong>Responsable principal:</strong>
              {{ lead.primaryContactName }} {{ lead.primaryContactSurname }} · {{ lead.primaryContactRelationship }}
            </p>
            <p class="message" *ngIf="lead.secondaryContactName || lead.secondaryContactSurname || lead.secondaryContactRelationship">
              <strong>Segundo contacto:</strong>
              {{ lead.secondaryContactName }} {{ lead.secondaryContactSurname }} · {{ lead.secondaryContactRelationship }}
            </p>
            <p class="message" *ngIf="lead.pickupContact"><strong>Recogida autorizada:</strong> {{ lead.pickupContact }}</p>
          </div>

          <div class="panel">
            <p class="label">Cuota</p>
            <p class="message"><strong>Forma de pago:</strong> {{ lead.paymentMethod }}</p>
            <p class="message" *ngIf="lead.paymentAccountHolder"><strong>Titular:</strong> {{ lead.paymentAccountHolder }}</p>
            <p class="message" *ngIf="lead.paymentIban"><strong>IBAN:</strong> {{ lead.paymentIban }}</p>
          </div>

          <div class="panel">
            <p class="label">Observaciones</p>
            <p class="message">{{ lead.observations }}</p>
          </div>

          <div class="panel actions">
            <p class="label">Gestion</p>
            <p class="copy action-copy">Cuando ya lo hayas gestionado, quitalo de la bandeja.</p>
            <button type="button" [disabled]="isDeleting" (click)="removeSelectedLead()">
              {{ isDeleting ? 'Eliminando...' : 'Eliminar lead tramitado' }}
            </button>
          </div>
        </section>
      </section>

      <section class="detail" *ngIf="!isLoading && !errorMessage && !selectedLead && !leads.length">
        <div class="panel empty-state">
          <h2>Bandeja vacia</h2>
          <p>No quedan formularios pendientes por revisar.</p>
        </div>
      </section>
    </main>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      background:
        radial-gradient(circle at top left, rgba(229, 57, 53, 0.1), transparent 24%),
        radial-gradient(circle at top right, rgba(63, 169, 245, 0.08), transparent 18%),
        linear-gradient(180deg, #fffdfb 0%, #f8f1eb 42%, #ffffff 100%);
    }

    .page {
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
      padding: 28px 0 44px;
    }

    .topbar,
    .layout {
      display: grid;
      gap: 18px;
    }

    .topbar {
      grid-template-columns: 1fr auto;
      align-items: center;
      margin-bottom: 26px;
    }

    .eyebrow,
    h1,
    h2,
    p {
      margin: 0;
    }

    .brand-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .brand-logo {
      display: block;
      width: min(180px, 100%);
      height: auto;
    }

    .brand-chip {
      display: inline-flex;
      align-items: center;
      padding: 8px 12px;
      border-radius: 999px;
      background: #111111;
      color: #fff;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-family: var(--display-font);
    }

    .eyebrow {
      color: var(--accent-dark);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.8rem;
      font-family: var(--display-font);
    }

    h1,
    h2,
    .list-title,
    .label {
      font-family: var(--display-font);
      text-transform: uppercase;
    }

    h1 {
      font-size: clamp(2.2rem, 5vw, 3rem);
      line-height: 0.94;
      letter-spacing: -0.03em;
      margin-top: 6px;
    }

    .copy {
      margin-top: 12px;
      color: var(--muted);
      line-height: 1.65;
      max-width: 58ch;
    }

    .layout {
      grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
      align-items: start;
      gap: 20px;
    }

    .list,
    .detail,
    .actions {
      display: grid;
      gap: 12px;
    }

    .lead-card,
    .panel,
    button {
      border-radius: 18px;
    }

    .lead-card,
    .panel {
      padding: 18px;
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid rgba(17, 17, 17, 0.08);
      box-shadow: var(--shadow);
    }

    .list-panel {
      position: sticky;
      top: 92px;
      align-content: start;
      padding: 0;
      background: transparent;
      border: 0;
      box-shadow: none;
    }

    .list-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 8px;
      padding: 0 4px;
    }

    .lead-card {
      display: grid;
      gap: 8px;
      text-align: left;
      cursor: pointer;
      transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
      padding: 16px 16px 14px;
    }

    .lead-title {
      font-size: 1.18rem;
      line-height: 1.05;
      letter-spacing: -0.02em;
      color: var(--text);
    }

    .lead-email,
    .list-count {
      font-size: 0.84rem;
      color: var(--muted);
    }

    .lead-email {
      order: 3;
      font-weight: 600;
    }

    .list-count {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(17, 17, 17, 0.06);
      font-weight: 600;
      white-space: nowrap;
    }

    .list-title,
    .label {
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent-dark);
    }

    .lead-card.active {
      border-color: rgba(229, 57, 53, 0.4);
      background: linear-gradient(180deg, #fff 0%, #fff3f1 100%);
      box-shadow: 0 18px 34px rgba(183, 28, 28, 0.12);
      transform: translateY(-2px);
    }

    .lead-card:not(.active) {
      box-shadow: 0 10px 22px rgba(17, 17, 17, 0.07);
    }

    .meta,
    .preview,
    .message,
    .notice {
      color: var(--muted);
    }

    .lead-meta {
      order: 4;
      font-size: 0.8rem;
      letter-spacing: 0.02em;
    }

    .preview {
      order: 2;
      display: -webkit-box;
      overflow: hidden;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      line-height: 1.5;
      font-size: 0.94rem;
      color: var(--text);
    }

    .message {
      line-height: 1.6;
      white-space: pre-wrap;
    }

    button {
      width: 100%;
      padding: 14px 16px;
      border: 0;
      font: inherit;
    }

    button {
      background: linear-gradient(180deg, #f04843 0%, var(--accent) 100%);
      color: #fff;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 16px 34px rgba(229, 57, 53, 0.2);
    }

    button.secondary {
      width: auto;
      background: #fff;
      color: var(--text);
      border: 1px solid rgba(17, 17, 17, 0.08);
      box-shadow: none;
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

    .notice.success {
      background: #edf8ef;
      color: #216a2c;
    }

    .empty-state {
      max-width: 520px;
    }

    .action-copy {
      margin-top: 0;
      margin-bottom: 4px;
    }

    .lead-summary h2 {
      margin-bottom: 6px;
    }

    @media (max-width: 820px) {
      .topbar,
      .layout {
        grid-template-columns: 1fr;
      }

      .list-panel {
        position: static;
      }

      .brand-row {
        align-items: flex-start;
        flex-direction: column;
      }

      .brand-logo {
        width: min(160px, 100%);
      }
    }
  `,
})
export class LeadsComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly siteConfigService = inject(SiteConfigService);
  private readonly router = inject(Router);

  apiBaseUrl = '';
  token = '';
  leads: AdminLead[] = [];
  selectedLead: AdminLead | null = null;
  errorMessage = '';
  successMessage = '';
  isLoading = true;
  isDeleting = false;

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
    this.successMessage = '';
  }

  formatDate(value: string) {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  previewMessage(message: string) {
    return message.length > 96 ? `${message.slice(0, 93).trimEnd()}...` : message;
  }

  async removeSelectedLead() {
    if (!this.selectedLead || this.isDeleting) {
      return;
    }

    if (!confirm(`Eliminar el lead de ${this.selectedLead.name}?`)) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const currentLeadId = this.selectedLead.id;
      await firstValueFrom(
        this.adminApi.deleteLead(this.apiBaseUrl, this.token, currentLeadId),
      );

      const nextState = removeLeadFromState(this.leads, this.selectedLead, currentLeadId);
      this.leads = nextState.leads;
      this.selectedLead = nextState.selectedLead;
      this.successMessage = 'Lead eliminado correctamente.';
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.logout();
        return;
      }

      this.errorMessage = 'No se pudo eliminar el lead.';
    } finally {
      this.isDeleting = false;
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
