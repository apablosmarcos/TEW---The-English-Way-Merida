import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { retryAfterSeconds } from '../../core/academy/academy-http-policy';
import { AcademySessionStore } from '../../core/academy/academy-session.store';
import type { AcademyUser } from '../../core/academy/academy-types';
import { SITE_CONFIG_LOAD_ERROR_MESSAGE, SiteConfigService } from '../../core/services/site-config.service';

export function academyDestination(user: AcademyUser) {
  if (user.mustChangePassword) return '/academia/cambiar-contrasena';
  return user.role === 'admin' ? '/academia/admin/publicaciones' : '/academia';
}

@Component({
  selector: 'app-academy-access', standalone: true, imports: [CommonModule, ReactiveFormsModule],
  template: `<main><section class="card" [attr.aria-busy]="isLoading || isSubmitting">
    <img src="assets/img/TEW.png" alt="The English Way" /><p class="rule">Área privada</p><h1>Acceso academia</h1>
    <p>Entra con tu usuario de TEW.</p><p *ngIf="errorMessage" class="academy-error" role="alert">{{ errorMessage }}</p>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <label>Usuario<input formControlName="username" autocomplete="username" /></label>
      <label>Contraseña<input type="password" formControlName="password" autocomplete="current-password" /></label>
      <button class="primary" [disabled]="isLoading || isSubmitting || form.invalid || !apiBaseUrl">{{ isSubmitting ? 'Entrando…' : 'Entrar' }}</button>
    </form><p *ngIf="isLoading" role="status">Preparando acceso…</p>
  </section></main>`,
  styles: `:host,main{display:grid;min-height:100vh;background:#FFFDFB;color:#111}main{place-items:center;padding:24px}.card{width:min(100%,430px);padding:32px;background:#FFF;border:1px solid #E6D9CF;box-shadow:0 18px 50px #1112}.card img{width:150px;height:auto}.rule{border-block:3px solid #E53935;padding:8px 0;color:#B71C1C;font-weight:700}h1{font-family:var(--display-font);text-transform:uppercase;margin:18px 0 8px}p{color:#5B4F44}form,label{display:grid;gap:8px}form{margin-top:20px;gap:16px}input,button{min-height:44px;padding:10px;border:1px solid #E6D9CF;background:#FFF}.primary{background:#B71C1C;color:#FFF;font-weight:700;cursor:pointer}input:focus-visible,button:focus-visible{outline:3px solid #B71C1C;outline-offset:2px}@media(max-width:640px){.card{padding:24px}}@media(prefers-reduced-motion:reduce){*{transition:none!important}}`,
})
export class AccessComponent implements OnInit {
  private readonly config = inject(SiteConfigService); private readonly router = inject(Router);
  readonly session = inject(AcademySessionStore);
  readonly form = new FormGroup({ username: new FormControl('', { nonNullable: true, validators: [Validators.required] }), password: new FormControl('', { nonNullable: true, validators: [Validators.required] }) });
  apiBaseUrl = ''; errorMessage = ''; isLoading = true; isSubmitting = false;

  async ngOnInit() {
    const state = await firstValueFrom(this.config.load());
    if (state.status === 'error' || !state.config.apiBaseUrl) this.errorMessage = state.status === 'error' ? SITE_CONFIG_LOAD_ERROR_MESSAGE : 'El acceso no está disponible.';
    else { this.apiBaseUrl = state.config.apiBaseUrl; const session = await firstValueFrom(this.session.restore(this.apiBaseUrl)); if (session) await this.router.navigateByUrl(academyDestination(session.user)); }
    this.isLoading = false;
  }
  async submit() {
    if (!this.apiBaseUrl) { this.errorMessage = 'El acceso no está disponible.'; return; }
    if (this.form.invalid || this.isSubmitting) return;
    this.isSubmitting = true; this.errorMessage = '';
    try { const value = this.form.getRawValue(); const session = await firstValueFrom(this.session.login(this.apiBaseUrl, value.username, value.password)); await this.router.navigateByUrl(academyDestination(session.user)); }
    catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.errorMessage = 'Credenciales incorrectas.';
      } else if (error instanceof HttpErrorResponse && error.status === 429) {
        const wait = retryAfterSeconds(error.headers.get('Retry-After'));
        this.errorMessage = wait === null
          ? 'Demasiados intentos. Espera unos momentos antes de volver a intentarlo.'
          : `Demasiados intentos. Espera ${wait} segundos antes de volver a intentarlo.`;
      } else {
        this.errorMessage = 'No se pudo iniciar sesión.';
      }
    }
    finally { this.isSubmitting = false; }
  }
}
