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
    <form class="filters" (submit)="$event.preventDefault(); applyFilters()"><label for="user-search">Buscar por nombre, usuario o UUID</label><input id="user-search" type="search" [value]="search" (input)="search = $any($event.target).value" /><div class="filter-row"><label for="user-role">Filtro de rol<select id="user-role" [value]="role ?? ''" (change)="role = roleValue($any($event.target).value)"><option value="">Todos</option><option value="parent">Familias</option><option value="admin">Administradores</option></select></label><label for="user-state">Filtro de estado<select id="user-state" [value]="state ?? ''" (change)="state = stateValue($any($event.target).value)"><option value="">Todos</option><option value="active">Activos</option><option value="disabled">Desactivados</option><option value="deleted">Eliminados</option></select></label><button type="submit">Aplicar filtros</button></div></form>
    <p *ngIf="loading" role="status">Cargando usuarios…</p><p *ngIf="error" role="alert">{{ error }}</p>
    <ng-container *ngIf="!loading && !error && users as current"><p class="count">{{ current.pagination.total }} usuarios</p><div class="list" *ngIf="current.items.length; else empty"><article *ngFor="let user of current.items"><div><h2>{{ user.displayName }}</h2><p>{{ user.username }} · {{ user.role === 'admin' ? 'Administrador' : 'Familia' }}</p></div><span [class]="'state ' + user.state">{{ stateLabel(user.state) }}</span><p class="uuid">{{ user.id }}</p><time [attr.datetime]="user.updatedAt">Actualizado {{ user.updatedAt | date:'shortDate' }}</time></article></div><ng-template #empty><p class="empty">No hay usuarios con estos filtros.</p></ng-template><nav *ngIf="current.pagination.pageCount > 1" class="pagination" aria-label="Paginación de usuarios"><button type="button" [disabled]="query.page === 1" (click)="goToPage(query.page - 1)">Anterior</button><span>Página {{ current.pagination.page }} de {{ current.pagination.pageCount }}</span><button type="button" [disabled]="query.page === current.pagination.pageCount" (click)="goToPage(query.page + 1)">Siguiente</button></nav></ng-container></section>`,
  styles: `:host{display:block}.users{max-width:920px;margin:auto}.eyebrow{color:#B71C1C;font-weight:700;letter-spacing:.08em;text-transform:uppercase;border-bottom:3px solid #E53935;padding-bottom:8px}h1,h2{font-family:var(--display-font);text-transform:uppercase}h1{font-size:clamp(2rem,6vw,4rem);margin:.25rem 0}.filters{margin:28px 0;padding:20px;border:1px solid #E6D9CF;background:#FFF}.filters label{display:grid;gap:6px;font-weight:700}.filters>input{width:100%;box-sizing:border-box;margin:8px 0 16px}.filter-row{display:grid;grid-template-columns:1fr 1fr auto;gap:12px;align-items:end}input,select,button{min-height:44px;padding:10px;border:1px solid #D8C9BD;background:#FFF;color:#111;font:inherit}button{cursor:pointer}.list{display:grid;gap:12px}article,.empty{display:grid;grid-template-columns:1fr auto;gap:8px;padding:18px;border:1px solid #E6D9CF;background:#FFF;box-shadow:5px 5px 0 #E6D9CF}h2,p{margin:0}.uuid,time,.count{color:#5B4F44;font-size:.85rem}.uuid{grid-column:1/-1;font-family:monospace;overflow-wrap:anywhere}.state{padding:4px 8px;height:max-content;font-size:.8rem;font-weight:700}.state.active{background:#E4F3E8}.state.disabled,.state.deleted{background:#F8E1DF}.pagination{display:flex;justify-content:center;align-items:center;gap:12px;margin:28px 0}button:disabled{cursor:not-allowed;opacity:.5}input:focus-visible,select:focus-visible,button:focus-visible{outline:3px solid #B71C1C;outline-offset:2px}@media(max-width:640px){.filters{padding:16px}.filter-row{grid-template-columns:1fr}article{grid-template-columns:1fr}.pagination{justify-content:space-between;gap:8px}}`,
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
  }
  applyFilters() {
    this.navigate(
      withAdminUserFilters(this.query, this.search, this.role, this.state),
    );
  }
  goToPage(page: number) {
    this.navigate(withAdminUserPage(this.query, page));
  }
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

  private navigate(query: AdminUserQuery) {
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
