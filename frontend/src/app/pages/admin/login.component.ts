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
        <div class="brand-lockup">
          <div class="brand-mark">
            <img src="assets/img/2.png" alt="Identidad TEW" />
          </div>
          <img class="brand-logo" src="assets/img/TEW.png" alt="The English Way" />
        </div>

        <p class="eyebrow">Secure Portal</p>
        <h1>Acceso al backoffice</h1>
        <p class="copy">Entra para revisar las solicitudes recibidas por la academia y tramitar las que ya has gestionado.</p>

        <div class="notice error" *ngIf="configErrorMessage" role="alert" aria-live="assertive">{{ configErrorMessage }}</div>
        <div class="notice error" *ngIf="errorMessage" role="alert" aria-live="assertive">{{ errorMessage }}</div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Usuario</span>
            <input type="text" formControlName="username" placeholder="Usuario o email" autocomplete="username" />
          </label>

          <label class="field">
            <span>Contrasena</span>
            <input type="password" formControlName="password" placeholder="Contrasena" autocomplete="current-password" />
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
      background:
        radial-gradient(circle at top left, rgba(229, 57, 53, 0.14), transparent 24%),
        radial-gradient(circle at top right, rgba(63, 169, 245, 0.12), transparent 22%),
        linear-gradient(180deg, #fffdfb 0%, #f7f0ea 55%, #ffffff 100%);
    }

    .page {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
    }

    .card {
      width: min(100%, 460px);
      padding: 34px;
      border-radius: 28px;
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid rgba(17, 17, 17, 0.08);
      box-shadow: 0 28px 60px rgba(17, 17, 17, 0.14);
    }

    .brand-lockup {
      display: grid;
      justify-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .brand-mark {
      display: grid;
      place-items: center;
      width: 84px;
      height: 84px;
      border-radius: 24px;
      background: linear-gradient(180deg, #111111 0%, #272727 100%);
      box-shadow: 0 20px 40px rgba(17, 17, 17, 0.16);
    }

    .brand-mark img {
      width: 58px;
      height: 58px;
      object-fit: contain;
    }

    .brand-logo {
      display: block;
      width: min(100%, 240px);
      height: auto;
    }

    .eyebrow {
      margin: 0 0 8px;
      color: var(--accent-dark);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.8rem;
      font-family: var(--display-font);
    }

    h1,
    .copy {
      margin: 0;
    }

    h1 {
      font-family: var(--display-font);
      font-size: clamp(2rem, 7vw, 2.8rem);
      line-height: 0.95;
      letter-spacing: -0.03em;
      text-transform: uppercase;
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
      background: linear-gradient(180deg, #fff 0%, #fbf8f4 100%);
      transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
    }

    .field input:focus {
      outline: 0;
      border-color: rgba(229, 57, 53, 0.44);
      box-shadow: 0 0 0 4px rgba(229, 57, 53, 0.08);
      transform: translateY(-1px);
    }

    button {
      min-height: 52px;
      border: 0;
      border-radius: 14px;
      background: linear-gradient(180deg, #f04843 0%, var(--accent) 100%);
      color: #fff;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 18px 36px rgba(229, 57, 53, 0.22);
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

    @media (max-width: 640px) {
      .card {
        padding: 26px;
      }

      .brand-mark {
        width: 72px;
        height: 72px;
      }

      .brand-mark img {
        width: 48px;
        height: 48px;
      }
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
