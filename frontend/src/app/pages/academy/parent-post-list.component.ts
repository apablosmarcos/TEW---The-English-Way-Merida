import { CommonModule, DatePipe } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { firstValueFrom, Subscription } from "rxjs";

import { AcademyApiService } from "../../core/academy/academy-api.service";
import { AcademySessionStore } from "../../core/academy/academy-session.store";
import type { AcademyParentPostList } from "../../core/academy/academy-types";
import { SiteConfigService } from "../../core/services/site-config.service";
import {
  parentPostQuery,
  parentPostQueryParams,
  withParentPostFilters,
  withParentPostPage,
  type ParentPostQuery,
} from "./academy-list-state";

@Component({
  selector: "app-parent-post-list",
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `<section class="feed" [attr.aria-busy]="loading"><header><p class="eyebrow">Academia TEW</p><h1>Cuaderno de familia</h1><p>Noticias y recursos del aula.</p></header>
    <form class="filters" (submit)="$event.preventDefault(); applySearch()"><label for="post-search">Buscar publicaciones</label><div><input id="post-search" type="search" [value]="search" (input)="search = $any($event.target).value" /><button type="submit">Buscar</button></div>
      <fieldset><legend>Categorías</legend><button type="button" [class.selected]="!query.categoryId" [attr.aria-pressed]="!query.categoryId" aria-label="Todas las categorías" (click)="selectCategory(null)">Todas</button><button *ngFor="let category of feed?.categories" type="button" [class.selected]="query.categoryId === category.id" [attr.aria-pressed]="query.categoryId === category.id" (click)="selectCategory(category.id)">{{ category.displayName }}</button></fieldset></form>
    <p *ngIf="loading" role="status">Cargando publicaciones…</p><p *ngIf="error" role="alert">{{ error }}</p>
    <ng-container *ngIf="!loading && !error && feed as current"><p class="count">{{ current.pagination.total }} publicaciones</p><div class="posts" *ngIf="current.items.length; else empty"><article *ngFor="let post of current.items"><p class="category">{{ post.category?.displayName || 'Academia' }}</p><h2>{{ post.title }}</h2><time [attr.datetime]="post.publishedAt">{{ post.publishedAt | date:'longDate' }}</time></article></div><ng-template #empty><p class="empty">No hay publicaciones con estos filtros.</p></ng-template>
      <nav *ngIf="current.pagination.pageCount > 1" class="pagination" aria-label="Paginación"><button type="button" [disabled]="query.page === 1" (click)="goToPage(query.page - 1)">Anterior</button><span>Página {{ current.pagination.page }} de {{ current.pagination.pageCount }}</span><button type="button" [disabled]="query.page === current.pagination.pageCount" (click)="goToPage(query.page + 1)">Siguiente</button></nav></ng-container></section>`,
  styles: `:host{display:block}.feed{max-width:920px;margin:auto}.eyebrow,.category{color:#B71C1C;font-weight:700;text-transform:uppercase;letter-spacing:.08em}.eyebrow{border-bottom:3px solid #E53935;padding-bottom:8px}h1,h2{font-family:var(--display-font);text-transform:uppercase}h1{font-size:clamp(2rem,6vw,4rem);margin:.25rem 0}.filters{margin:28px 0;padding:20px;border:1px solid #E6D9CF;background:#FFF}.filters label,.filters legend{font-weight:700}.filters>div{display:flex;gap:8px;margin:8px 0 18px}input{min-width:0;flex:1}input,button{min-height:44px;padding:10px;border:1px solid #D8C9BD;background:#FFF;color:#111;font:inherit}button{cursor:pointer}.filters button.selected,.pagination button:not(:disabled){border-color:#B71C1C;color:#B71C1C;font-weight:700}fieldset{display:flex;gap:8px;flex-wrap:wrap;border:0;padding:0}.posts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}article,.empty{padding:22px;border:1px solid #E6D9CF;background:#FFF;box-shadow:5px 5px 0 #E6D9CF}h2{margin:10px 0;font-size:1.35rem}h2 a{color:inherit;text-decoration-thickness:2px;text-decoration-color:#E53935}time,.count{color:#5B4F44}.pagination{display:flex;justify-content:center;align-items:center;gap:12px;margin:28px 0}button:disabled{cursor:not-allowed;opacity:.5}input:focus-visible,button:focus-visible,a:focus-visible{outline:3px solid #B71C1C;outline-offset:2px}@media(max-width:640px){.filters{padding:16px}.posts{grid-template-columns:1fr}.pagination{justify-content:space-between;gap:8px}}`,
})
export class ParentPostListComponent implements OnInit, OnDestroy {
  private readonly api = inject(AcademyApiService);
  private readonly config = inject(SiteConfigService);
  private readonly session = inject(AcademySessionStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  query: ParentPostQuery = { search: "", categoryId: null, page: 1 };
  search = "";
  feed?: AcademyParentPostList;
  loading = true;
  error = "";
  private subscription?: Subscription;
  private loadGeneration = 0;

  ngOnInit() {
    this.subscription = this.route.queryParamMap.subscribe((params) => {
      this.query = parentPostQuery(params);
      this.search = this.query.search;
      void this.load();
    });
  }
  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
  applySearch() {
    this.navigate(
      withParentPostFilters(this.query, this.search, this.query.categoryId),
    );
  }
  selectCategory(categoryId: string | null) {
    this.navigate(withParentPostFilters(this.query, this.search, categoryId));
  }
  goToPage(page: number) {
    this.navigate(withParentPostPage(this.query, page));
  }

  private navigate(query: ParentPostQuery) {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: parentPostQueryParams(query),
    });
  }
  private async load() {
    const generation = ++this.loadGeneration,
      query = this.query;
    this.loading = true;
    this.error = "";
    const state = await firstValueFrom(this.config.load()),
      token = this.session.token;
    if (generation !== this.loadGeneration) return;
    if (state.status === "error" || !state.config.apiBaseUrl || !token) {
      this.error = "No se pudieron cargar las publicaciones.";
      this.loading = false;
      return;
    }
    try {
      const response = await firstValueFrom(
        this.api.listParentPosts(state.config.apiBaseUrl, token, query),
      );
      if (generation !== this.loadGeneration) return;
      this.feed = response.data;
    } catch {
      if (generation === this.loadGeneration)
        this.error = "No se pudieron cargar las publicaciones.";
    } finally {
      if (generation === this.loadGeneration) this.loading = false;
    }
  }
}
