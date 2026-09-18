import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AcademySessionStore } from '../../core/academy/academy-session.store';
import { SiteConfigService } from '../../core/services/site-config.service';

@Component({
  selector: 'app-academy-shell', standalone: true, imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `<a class="skip" href="#academy-content">Saltar al contenido</a><header>
    <a routerLink="/academia" class="brand"><img src="assets/img/TEW.png" alt="The English Way" /><span>Academia</span></a>
    <div class="identity" *ngIf="session.user() as user"><strong>{{ user.displayName }}</strong><span>{{ user.role === 'admin' ? 'Administración' : 'Familia' }}</span></div>
    <nav aria-label="Navegación de la academia" *ngIf="session.user() as user">
      <a routerLink="/academia" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Publicaciones</a>
      <a *ngIf="user.role === 'admin'" routerLink="/academia/admin/publicaciones" routerLinkActive="active">Gestionar publicaciones</a>
      <a *ngIf="user.role === 'admin'" routerLink="/academia/admin/usuarios" routerLinkActive="active">Usuarios</a>
      <button type="button" (click)="logout()">Salir</button>
    </nav>
  </header><main id="academy-content" tabindex="-1"><router-outlet /></main>`,
  styles: `:host{display:block;min-height:100vh;background:#FFFDFB;color:#111}.skip{position:fixed;top:8px;left:8px;padding:10px;background:#111;color:#FFF;transform:translateY(-150%);z-index:2}.skip:focus{transform:translateY(0)}header{display:flex;align-items:center;gap:18px;padding:16px max(24px,calc((100% - 1100px)/2));border-bottom:1px solid #E6D9CF;background:#FFF}.brand{display:flex;align-items:center;gap:10px;font-family:var(--display-font);text-transform:uppercase}.brand img{width:110px}.identity{display:grid;margin-left:auto;color:#5B4F44;font-size:.85rem}nav{display:flex;align-items:center;gap:8px}nav a,button{display:inline-grid;place-items:center;min-height:44px;padding:8px 10px;border:0;background:transparent;color:#111;font:inherit;transition:color 150ms ease}nav a:hover{color:#B71C1C}nav a.active{border-bottom:3px solid #E53935;color:#B71C1C}button{background:#111;color:#FFF;cursor:pointer;transition:transform 150ms ease}button:hover{transform:translateY(-2px)}a:focus-visible,button:focus-visible{outline:3px solid #B71C1C;outline-offset:2px}main{width:min(1100px,calc(100% - 32px));margin:28px auto}@media(max-width:820px){header{align-items:flex-start;flex-wrap:wrap}.identity{margin-left:0}nav{width:100%;flex-wrap:wrap}}@media(max-width:640px){header{padding:14px 16px}.brand img{width:90px}nav a,button{flex:1}}@media(prefers-reduced-motion:reduce){*{transition:none!important}}`,
})
export class AcademyShellComponent {
  readonly session = inject(AcademySessionStore); private readonly config = inject(SiteConfigService); private readonly router = inject(Router);
  async logout() { const state = await firstValueFrom(this.config.load()); await firstValueFrom(this.session.logout(state.config.apiBaseUrl)); await this.router.navigateByUrl('/academia/acceso'); }
}
