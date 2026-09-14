import { CommonModule, DatePipe } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { firstValueFrom, Subscription } from "rxjs";

import { AcademyApiService } from "../../core/academy/academy-api.service";
import { AcademySessionStore } from "../../core/academy/academy-session.store";
import type { AcademyAdminUserList } from "../../core/academy/academy-types";
import { SiteConfigService } from "../../core/services/site-config.service";
import {
  adminUserQuery,
  adminUserQueryParams,
  withAdminUserFilters,
  withAdminUserPage,
  type AdminUserQuery,
} from "./academy-list-state";

@Component({
  selector: "app-admin-users",
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `<section class="users" [attr.aria-busy]="loading"><header><p class="eyebrow">Administración</p><h1>Usuarios</h1><p>Busca y revisa las cuentas de la academia.</p></header>
    <form class="create" (submit)="$event.preventDefault(); createUser()"><h2>Crear cuenta familiar</h2><label for="user-name">Nombre<input id="user-name" [value]="createDisplayName" (input)="createDisplayName = $any($event.target).value" required /></label><label for="user-username">Usuario<input id="user-username" [value]="createUsername" (input)="createUsername = $any($event.target).value" required /></label><button type="submit">Crear cuenta</button><p *ngIf="createError" role="alert">{{ createError }}</p></form>
    <aside *ngIf="temporaryPassword" class="temporary-password" role="alert"><p>Contraseña temporal para {{ temporaryPassword.username }}</p><code>{{ temporaryPassword.password }}</code><button type="button" (click)="closeTemporaryPassword()">He anotado la contraseña</button></aside>
    <form class="filters" (submit)="$event.preventDefault(); applyFilters()"><label for="user-search">Buscar por nombre, usuario o UUID</label><input id="user-search" type="search" [value]="search" (input)="search = $any($event.target).value" /><div class="filter-row"><label for="user-role">Filtro de rol<select id="user-role" [value]="role ?? ''" (change)="role = roleValue($any($event.target).value)"><option value="">Todos</option><option value="parent">Familias</option><option value="admin">Administradores</option></select></label><label for="user-state">Filtro de estado<select id="user-state" [value]="state ?? ''" (change)="state = stateValue($any($event.target).value)"><option value="">Todos</option><option value="active">Activos</option><option value="disabled">Desactivados</option><option value="deleted">Eliminados</option></select></label><button type="submit">Aplicar filtros</button></div></form>
    <p *ngIf="loading" role="status">Cargando usuarios…</p><p *ngIf="error" role="alert">{{ error }}</p><p *ngIf="lifecycleError" role="alert">{{ lifecycleError }}</p>
    <ng-container *ngIf="!loading && !error && users as current"><p class="count">{{ current.pagination.total }} usuarios</p><div class="list" *ngIf="current.items.length; else empty"><article *ngFor="let user of current.items"><div><h2>{{ user.displayName }}</h2><p>{{ user.username }} · {{ user.role === 'admin' ? 'Administrador' : 'Familia' }}</p></div><span [class]="'state ' + user.state">{{ stateLabel(user.state) }}</span><p class="uuid">{{ user.id }}</p><time [attr.datetime]="user.updatedAt">Actualizado {{ user.updatedAt | date:'shortDate' }}</time><div class="actions" *ngIf="user.state !== 'deleted'"><button type="button" (click)="resetPassword(user.id, user.username)">Restablecer contraseña</button><button type="button" *ngIf="user.state === 'active'" (click)="disableUser(user.id)">Desactivar</button><button type="button" *ngIf="user.state === 'disabled'" (click)="enableUser(user.id)">Activar</button><button type="button" (click)="deleteUser(user.id)">Eliminar</button></div></article></div><ng-template #empty><p class="empty">No hay usuarios con estos filtros.</p></ng-template><nav *ngIf="current.pagination.pageCount > 1" class="pagination" aria-label="Paginación de usuarios"><button type="button" [disabled]="query.page === 1" (click)="goToPage(query.page - 1)">Anterior</button><span>Página {{ current.pagination.page }} de {{ current.pagination.pageCount }}</span><button type="button" [disabled]="query.page === current.pagination.pageCount" (click)="goToPage(query.page + 1)">Siguiente</button></nav></ng-container></section>`,
  styles: `:host{display:block}.users{max-width:920px;margin:auto}.eyebrow{color:#B71C1C;font-weight:700;letter-spacing:.08em;text-transform:uppercase;border-bottom:3px solid #E53935;padding-bottom:8px}h1,h2{font-family:var(--display-font);text-transform:uppercase}h1{font-size:clamp(2rem,6vw,4rem);margin:.25rem 0}.filters,.create,.temporary-password{margin:28px 0;padding:20px;border:1px solid #E6D9CF;background:#FFF}.filters label,.create label{display:grid;gap:6px;font-weight:700}.create{display:grid;gap:12px}.temporary-password code{display:block;margin:8px 0;font-size:1.1rem;overflow-wrap:anywhere}.filters>input{width:100%;box-sizing:border-box;margin:8px 0 16px}.filter-row{display:grid;grid-template-columns:1fr 1fr auto;gap:12px;align-items:end}input,select,button{min-height:44px;padding:10px;border:1px solid #D8C9BD;background:#FFF;color:#111;font:inherit}button{cursor:pointer}.list{display:grid;gap:12px}article,.empty{display:grid;grid-template-columns:1fr auto;gap:8px;padding:18px;border:1px solid #E6D9CF;background:#FFF;box-shadow:5px 5px 0 #E6D9CF}h2,p{margin:0}.uuid,time,.count{color:#5B4F44;font-size:.85rem}.uuid{grid-column:1/-1;font-family:monospace;overflow-wrap:anywhere}.state{padding:4px 8px;height:max-content;font-size:.8rem;font-weight:700}.state.active{background:#E4F3E8}.state.disabled,.state.deleted{background:#F8E1DF}.pagination,.actions{display:flex;justify-content:center;align-items:center;gap:12px;margin:28px 0}.actions{grid-column:1/-1;justify-content:flex-start;margin:0;flex-wrap:wrap}button:disabled{cursor:not-allowed;opacity:.5}input:focus-visible,select:focus-visible,button:focus-visible{outline:3px solid #B71C1C;outline-offset:2px}@media(max-width:640px){.filters,.create,.temporary-password{padding:16px}.filter-row{grid-template-columns:1fr}article{grid-template-columns:1fr}.pagination{justify-content:space-between;gap:8px}.actions{align-items:stretch;flex-direction:column}.actions button{width:100%}}`,
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  private readonly api = inject(AcademyApiService);
  private readonly config = inject(SiteConfigService);
  private readonly session = inject(AcademySessionStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  query: AdminUserQuery = { search: "", role: null, state: null, page: 1 };
  search = "";
  role: AdminUserQuery["role"] = null;
  state: AdminUserQuery["state"] = null;
  users?: AcademyAdminUserList;
  loading = true;
  error = "";
  createDisplayName = "";
  createUsername = "";
  createError = "";
  lifecycleError = "";
  temporaryPassword?: { username: string; password: string };
  private subscription?: Subscription;
  private loadGeneration = 0;

  ngOnInit() {
    this.subscription = this.route.queryParamMap.subscribe((params) => {
      this.query = adminUserQuery(params);
      ({
        search: this.search,
        role: this.role,
        state: this.state,
      } = this.query);
      void this.load();
    });
  }
  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.temporaryPassword = undefined;
  }
  applyFilters() {
    this.navigate(
      withAdminUserFilters(this.query, this.search, this.role, this.state),
    );
  }
  goToPage(page: number) {
    this.navigate(withAdminUserPage(this.query, page));
  }
  closeTemporaryPassword() {
    this.temporaryPassword = undefined;
  }
  async createUser() {
    this.createError = "";
    try {
      const { apiBaseUrl, token } = await this.credentials();
      const response = await firstValueFrom(this.api.createAdminUser(apiBaseUrl, token, { displayName: this.createDisplayName, username: this.createUsername }));
      this.createDisplayName = "";
      this.createUsername = "";
      this.temporaryPassword = { username: response.data.user.username, password: response.data.temporaryPassword };
      await this.load();
    } catch (error) {
      this.createError = this.message(error);
    }
  }
  async resetPassword(id: string, username: string) {
    this.lifecycleError = "";
    try {
      const { apiBaseUrl, token } = await this.credentials();
      const response = await firstValueFrom(this.api.resetAdminUserPassword(apiBaseUrl, token, id));
      this.temporaryPassword = { username, password: response.data.temporaryPassword };
    } catch (error) {
      this.lifecycleError = this.message(error);
    }
  }
  disableUser(id: string) { void this.mutate((apiBaseUrl, token) => this.api.disableAdminUser(apiBaseUrl, token, id)); }
  enableUser(id: string) { void this.mutate((apiBaseUrl, token) => this.api.enableAdminUser(apiBaseUrl, token, id)); }
  deleteUser(id: string) { void this.mutate((apiBaseUrl, token) => this.api.deleteAdminUser(apiBaseUrl, token, id)); }
  roleValue(value: string): AdminUserQuery["role"] {
    return value === "parent" || value === "admin" ? value : null;
  }
  stateValue(value: string): AdminUserQuery["state"] {
    return value === "active" || value === "disabled" || value === "deleted"
      ? value
      : null;
  }
  stateLabel(state: AdminUserQuery["state"]) {
    return state === "active"
      ? "Activo"
      : state === "disabled"
        ? "Desactivado"
        : "Eliminado";
  }

  private async mutate(action: (apiBaseUrl: string, token: string) => ReturnType<AcademyApiService["enableAdminUser"]>) {
    this.lifecycleError = "";
    try {
      const { apiBaseUrl, token } = await this.credentials();
      await firstValueFrom(action(apiBaseUrl, token));
      await this.load();
    } catch (error) {
      this.lifecycleError = this.message(error);
    }
  }
  private async credentials() {
    const config = await firstValueFrom(this.config.load()), token = this.session.token;
    if (config.status === "error" || !config.config.apiBaseUrl || !token) throw new Error();
    return { apiBaseUrl: config.config.apiBaseUrl, token };
  }
  private message(error: unknown) {
    return (error as { error?: { error?: string } }).error?.error === "LAST_ACTIVE_ADMIN"
      ? "No se puede desactivar ni eliminar al último administrador activo."
      : "No se pudo guardar el cambio.";
  }
  private navigate(query: AdminUserQuery) {
    this.closeTemporaryPassword();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: adminUserQueryParams(query),
    });
  }
  private async load() {
    const generation = ++this.loadGeneration,
      query = this.query;
    this.loading = true;
    this.error = "";
    const config = await firstValueFrom(this.config.load()),
      token = this.session.token;
    if (generation !== this.loadGeneration) return;
    if (config.status === "error" || !config.config.apiBaseUrl || !token) {
      this.error = "No se pudieron cargar los usuarios.";
      this.loading = false;
      return;
    }
    try {
      const response = await firstValueFrom(
        this.api.listAdminUsers(config.config.apiBaseUrl, token, query),
      );
      if (generation !== this.loadGeneration) return;
      this.users = response.data;
    } catch {
      if (generation === this.loadGeneration)
        this.error = "No se pudieron cargar los usuarios.";
    } finally {
      if (generation === this.loadGeneration) this.loading = false;
    }
  }
}
