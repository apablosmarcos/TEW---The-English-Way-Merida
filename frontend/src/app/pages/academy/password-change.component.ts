import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AcademyApiService } from '../../core/academy/academy-api.service';
import { AcademySessionStore } from '../../core/academy/academy-session.store';
import { SITE_CONFIG_LOAD_ERROR_MESSAGE, SiteConfigService } from '../../core/services/site-config.service';

@Component({
  selector: 'app-password-change', standalone: true, imports: [CommonModule, ReactiveFormsModule],
  template: `<main><section class="card" [attr.aria-busy]="isLoading || isSubmitting">
    <img src="assets/img/TEW.png" alt="The English Way" /><p class="rule">Primer acceso</p><h1>Cambia tu contraseña</h1><p>Elige una contraseña de 10 a 128 caracteres.</p>
    <p *ngIf="errorMessage" class="academy-error" role="alert">{{ errorMessage }}</p><form [formGroup]="form" (ngSubmit)="submit()">
      <label>Contraseña actual<input type="password" formControlName="currentPassword" autocomplete="current-password" /></label>
      <label>Nueva contraseña<input type="password" formControlName="newPassword" autocomplete="new-password" /></label>
      <label>Confirma la contraseña<input type="password" formControlName="confirmPassword" autocomplete="new-password" /></label>
      <button class="primary" [disabled]="isLoading || isSubmitting || form.invalid || !apiBaseUrl">{{ isSubmitting ? 'Guardando…' : 'Guardar contraseña' }}</button>
    </form><button type="button" class="exit" (click)="exit()">Salir</button><p *ngIf="isLoading" role="status">Preparando cambio…</p>
  </section></main>`,
  styles: `:host,main{display:grid;min-height:100vh;background:#FFFDFB;color:#111}main{place-items:center;padding:24px}.card{width:min(100%,430px);padding:32px;background:#FFF;border:1px solid #E6D9CF;box-shadow:0 18px 50px #1112}.card img{width:150px}.rule{border-block:3px solid #E53935;padding:8px 0;color:#B71C1C;font-weight:700}h1{font-family:var(--display-font);text-transform:uppercase;margin:18px 0 8px}p{color:#5B4F44}form,label{display:grid;gap:8px}form{margin-top:20px;gap:16px}input,button{min-height:44px;padding:10px;border:1px solid #E6D9CF;background:#FFF}.primary{background:#B71C1C;color:#FFF;font-weight:700;cursor:pointer}.exit{margin-top:16px;color:#B71C1C;font-weight:700;cursor:pointer}input:focus-visible,button:focus-visible{outline:3px solid #B71C1C;outline-offset:2px}@media(max-width:640px){.card{padding:24px}}@media(prefers-reduced-motion:reduce){*{transition:none!important}}`,
})
export class PasswordChangeComponent implements OnInit {
  private readonly api = inject(AcademyApiService); private readonly config = inject(SiteConfigService); private readonly router = inject(Router);
  readonly session = inject(AcademySessionStore);
  readonly form = new FormGroup({ currentPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }), newPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10), Validators.maxLength(128)] }), confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }) });
  apiBaseUrl = ''; errorMessage = ''; isLoading = true; isSubmitting = false;

  async ngOnInit() { const state = await firstValueFrom(this.config.load()); this.apiBaseUrl = state.config.apiBaseUrl; this.errorMessage = state.status === 'error' ? SITE_CONFIG_LOAD_ERROR_MESSAGE : !this.apiBaseUrl ? 'El acceso no está disponible.' : ''; this.isLoading = false; }
  async submit() {
    const value = this.form.getRawValue();
    if (!this.apiBaseUrl) { this.errorMessage = 'El acceso no está disponible.'; return; }
    const token = this.session.token;
    if (!token) { await this.exit(); return; }
    if (this.form.invalid || this.isSubmitting) return;
    if (value.newPassword !== value.confirmPassword) { this.errorMessage = 'Las contraseñas no coinciden.'; return; }
    this.isSubmitting = true; this.errorMessage = '';
    try { await firstValueFrom(this.api.changePassword(this.apiBaseUrl, token, value.currentPassword, value.newPassword)); await this.exit(); }
    catch { this.errorMessage = 'No se pudo cambiar la contraseña.'; }
    finally { this.isSubmitting = false; }
  }
  async exit() {
    const token = this.session.token;
    if (!token || !this.apiBaseUrl) this.session.clear();
    else { try { await firstValueFrom(this.session.logout(this.apiBaseUrl)); } finally { await this.router.navigateByUrl('/academia/acceso'); } return; }
    await this.router.navigateByUrl('/academia/acceso');
  }
}
