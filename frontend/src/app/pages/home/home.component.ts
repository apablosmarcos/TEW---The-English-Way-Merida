import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { LeadsApiService } from '../../core/services/leads-api.service';
import {
  DEFAULT_SITE_CONFIG,
  SITE_CONFIG_LOAD_ERROR_MESSAGE,
  SiteConfigService,
  type SiteConfig,
} from '../../core/services/site-config.service';
import { DEMO_MODE_MESSAGE, createLeadForm, submitLeadForm } from './home-form';

@Component({
  selector: 'app-home',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styles: `
    :host {
      display: block;
    }

    .page {
      min-height: 100vh;
    }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 10;
      border-bottom: 1px solid rgba(17, 17, 17, 0.08);
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(12px);
    }

    .shell {
      width: min(1120px, calc(100% - 32px));
      margin: 0 auto;
    }

    .topbar .shell,
    .hero,
    .sections,
    .contact {
      display: grid;
      gap: 24px;
    }

    .topbar .shell {
      grid-template-columns: 1fr auto;
      align-items: center;
      padding: 18px 0;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
      font-weight: 800;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    .brand-mark {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: var(--text);
      color: #fff;
    }

    nav {
      display: flex;
      gap: 18px;
      font-size: 0.95rem;
      color: var(--muted);
    }

    .hero {
      grid-template-columns: minmax(0, 1.05fr) minmax(320px, 420px);
      align-items: start;
      padding: 56px 0 32px;
    }

    .hero-copy,
    .panel,
    .form-card,
    .info-card {
      border-radius: 28px;
      background: var(--surface);
      box-shadow: var(--shadow);
    }

    .hero-copy {
      padding: 36px;
      background: linear-gradient(145deg, #111111 0%, #1f1f1f 62%, #3b0d0d 100%);
      color: #fff;
    }

    .eyebrow,
    .mode-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 999px;
      font-size: 0.82rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .eyebrow {
      background: rgba(255, 255, 255, 0.12);
    }

    .mode-pill {
      justify-self: start;
      background: #fdf1f1;
      color: var(--accent-dark);
    }

    .mode-pill.live {
      background: #eff8ef;
      color: #216a2c;
    }

    h1,
    h2,
    h3,
    p {
      margin: 0;
    }

    h1 {
      margin-top: 18px;
      font-size: clamp(2.6rem, 6vw, 4.7rem);
      line-height: 0.95;
      text-transform: uppercase;
    }

    .hero-copy p {
      margin-top: 18px;
      max-width: 56ch;
      color: rgba(255, 255, 255, 0.82);
      line-height: 1.75;
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      margin-top: 28px;
    }

    .button {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      min-height: 48px;
      padding: 0 18px;
      border: 0;
      border-radius: 14px;
      font-weight: 700;
      cursor: pointer;
    }

    .button.primary {
      background: var(--accent);
      color: #fff;
    }

    .button.secondary {
      background: #fff;
      color: var(--text);
    }

    .hero-points,
    .mini-grid,
    .contact-grid {
      display: grid;
      gap: 14px;
    }

    .hero-points {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      margin-top: 26px;
    }

    .point,
    .panel,
    .info-card {
      padding: 22px;
    }

    .point {
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.08);
    }

    .form-card {
      padding: 28px;
      background: linear-gradient(180deg, #ffffff 0%, #fbf8f3 100%);
    }

    .mini-grid,
    .contact-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .sections,
    .contact {
      padding: 0 0 32px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }

    .panel p,
    .info-card p,
    .copy-muted,
    li,
    label {
      color: var(--muted);
      line-height: 1.65;
    }

    ul {
      margin: 0;
      padding-left: 20px;
    }

    form {
      display: grid;
      gap: 14px;
      margin-top: 20px;
    }

    .field {
      display: grid;
      gap: 8px;
    }

    .field input,
    .field textarea {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 14px 16px;
      background: #fff;
      color: var(--text);
    }

    .field textarea {
      min-height: 140px;
      resize: vertical;
    }

    .field input.ng-invalid.ng-touched,
    .field textarea.ng-invalid.ng-touched {
      border-color: var(--accent);
    }

    .error,
    .success,
    .helper {
      padding: 12px 14px;
      border-radius: 14px;
      font-size: 0.94rem;
    }

    .helper {
      background: #f5f0e8;
      color: #5b4f44;
    }

    .error {
      background: #fdecec;
      color: #8d1f1f;
    }

    .success {
      background: #edf8ef;
      color: #216a2c;
    }

    .contact {
      grid-template-columns: 1.1fr 0.9fr;
    }

    footer {
      padding: 0 0 40px;
      color: var(--muted);
      font-size: 0.95rem;
      text-align: center;
    }

    @media (max-width: 900px) {
      .hero,
      .contact,
      .grid-3,
      .grid-2,
      .hero-points,
      .mini-grid,
      .contact-grid,
      .topbar .shell {
        grid-template-columns: 1fr;
      }

      nav {
        flex-wrap: wrap;
      }

      .hero {
        padding-top: 28px;
      }
    }
  `,
})
export class HomeComponent implements OnInit {
  private readonly siteConfigService = inject(SiteConfigService);
  private readonly leadsApi = inject(LeadsApiService);

  protected readonly form = createLeadForm();
  protected readonly demoMessage = DEMO_MODE_MESSAGE;
  protected siteConfig: SiteConfig = DEFAULT_SITE_CONFIG;
  protected isLoadingConfig = true;
  protected isSubmitting = false;
  protected configErrorMessage = '';
  protected successMessage = '';
  protected errorMessage = '';

  ngOnInit() {
    this.siteConfigService.load().subscribe((state) => {
      this.siteConfig = state.config;
      this.configErrorMessage = state.status === 'error' ? state.message : '';
      this.isLoadingConfig = false;
    });
  }

  protected async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.successMessage = '';
    this.errorMessage = '';

    if (this.configErrorMessage) {
      this.errorMessage = SITE_CONFIG_LOAD_ERROR_MESSAGE;
      return;
    }

    const result = submitLeadForm(this.form, this.siteConfig.apiBaseUrl, (payload) =>
      this.leadsApi.createLead(this.siteConfig.apiBaseUrl, payload),
    );

    if (result.mode === 'demo') {
      this.successMessage = result.message;
      return;
    }

    this.isSubmitting = true;

    try {
      await result.request;
      this.form.reset({ name: '', email: '', phone: '', message: '' });
      this.successMessage = 'Gracias. Hemos recibido tu solicitud y te responderemos pronto.';
    } catch {
      this.errorMessage = 'No hemos podido enviar tu solicitud. Escribenos al email de contacto.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
