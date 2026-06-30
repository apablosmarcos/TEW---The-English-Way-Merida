import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AdminApiService } from '../../core/services/admin-api.service';
import { readAdminSessionToken, writeAdminSessionToken } from '../../core/services/admin-session';
import {
  SITE_CONFIG_LOAD_ERROR_MESSAGE,
  SiteConfigService,
} from '../../core/services/site-config.service';

@Component({
  selector: 'app-admin-login',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <main class="page">
      <section class="card">
        <p class="eyebrow">Admin TEW</p>
        <h1>Acceso al backoffice</h1>
        <p class="copy">Login minimo para revisar y actualizar leads del MVP.</p>

        <div class="notice error" *ngIf="configErrorMessage">{{ configErrorMessage }}</div>
        <div class="notice error" *ngIf="errorMessage">{{ errorMessage }}</div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Usuario</span>
            <input type="text" formControlName="username" />
          </label>

          <label class="field">
            <span>Contrasena</span>
            <input type="password" formControlName="password" />
          </label>

          <button type="submit" [disabled]="isSubmitting || !apiBaseUrl || form.invalid">
            {{ isSubmitting ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>
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
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
    }

    .card {
      width: min(100%, 420px);
      padding: 32px;
      border-radius: 24px;
      background: #fff;
      box-shadow: var(--shadow);
    }

    .eyebrow {
      margin: 0 0 8px;
      color: var(--accent-dark);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.8rem;
    }

    h1,
    .copy {
      margin: 0;
    }

    .copy {
      margin-top: 12px;
      color: var(--muted);
      line-height: 1.6;
    }

    form,
    .field {
      display: grid;
      gap: 12px;
    }

    form {
      margin-top: 24px;
    }

    .field span {
      font-weight: 600;
    }

    .field input {
      width: 100%;
      padding: 14px 16px;
      border: 1px solid var(--line);
      border-radius: 14px;
    }

    button {
      min-height: 48px;
      border: 0;
      border-radius: 14px;
      background: var(--accent);
      color: #fff;
      font-weight: 700;
      cursor: pointer;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .notice {
      margin-top: 16px;
      padding: 12px 14px;
      border-radius: 14px;
    }

    .error {
      background: #fdeeee;
      color: #8d2020;
    }
  `,
})
export class LoginComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly siteConfigService = inject(SiteConfigService);
  private readonly router = inject(Router);

  readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  apiBaseUrl = '';
  configErrorMessage = '';
  errorMessage = '';
  isSubmitting = false;

  async ngOnInit() {
    if (readAdminSessionToken()) {
      await this.router.navigateByUrl('/admin/leads');
      return;
    }

    const configState = await firstValueFrom(this.siteConfigService.load());

    if (configState.status === 'error') {
      this.configErrorMessage = SITE_CONFIG_LOAD_ERROR_MESSAGE;
      return;
    }

    if (!configState.config.apiBaseUrl) {
      this.configErrorMessage = 'El admin requiere un apiBaseUrl valido.';
      return;
    }

    this.apiBaseUrl = configState.config.apiBaseUrl;
  }

  async submit() {
    if (this.form.invalid || !this.apiBaseUrl || this.isSubmitting) {
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;

    try {
      const value = this.form.getRawValue();
      const response = await firstValueFrom(
        this.adminApi.login(this.apiBaseUrl, value.username, value.password),
      );

      writeAdminSessionToken(undefined, response.token);
      await this.router.navigateByUrl('/admin/leads');
    } catch (error) {
      this.errorMessage = error instanceof HttpErrorResponse && error.status === 401
        ? 'Credenciales invalidas.'
        : 'No se pudo iniciar sesion.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
