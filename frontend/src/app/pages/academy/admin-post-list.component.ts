import { CommonModule, DatePipe } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { firstValueFrom, type Observable } from "rxjs";

import { AcademyApiService } from "../../core/academy/academy-api.service";
import { AcademySessionStore } from "../../core/academy/academy-session.store";
import type { AcademyAdminPostList, AcademyCategory, AcademyPostVisibility } from "../../core/academy/academy-types";
import { SiteConfigService } from "../../core/services/site-config.service";

@Component({
  selector: "app-admin-post-list",
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `<section class="content" [attr.aria-busy]="loading"><header><p class="eyebrow">Administración</p><h1>Publicaciones</h1><p>Consulta el estado de cada publicación y organiza las categorías.</p></header>
    <div class="filter"><label for="post-status">Estado</label><select id="post-status" [value]="status ?? ''" (change)="setStatus($any($event.target).value)"><option value="">Todas</option><option value="visible">Visibles</option><option value="hidden">Ocultas</option><option value="deleted">Eliminadas</option></select></div>
    <p *ngIf="loading" role="status">Cargando contenido…</p><p *ngIf="error" role="alert">{{ error }}</p>
    <div class="posts" *ngIf="!loading && !error"><article *ngFor="let post of posts?.items"><div><p class="status">{{ statusLabel(post.visibility) }}</p><h2>{{ post.title }}</h2><p>{{ post.category?.displayName || 'Sin categoría' }}</p></div><time [attr.datetime]="post.updatedAt">Actualizado {{ post.updatedAt | date:'shortDate' }}</time></article><p *ngIf="!posts?.items?.length">No hay publicaciones en este estado.</p></div>
    <section class="categories" *ngIf="!loading && !error"><h2>Categorías</h2><form (submit)="$event.preventDefault(); createCategory()"><label for="category-name">Nueva categoría</label><input id="category-name" [value]="newCategory" (input)="newCategory = $any($event.target).value" required /><button type="submit">Crear categoría</button></form><p *ngIf="categoryError" role="alert">{{ categoryError }}</p><article *ngFor="let category of categories"><form (submit)="$event.preventDefault(); renameCategory(category.id, $any($event.target).elements.name.value)"><label><span class="sr-only">Nombre de {{ category.displayName }}</span><input name="name" [value]="category.displayName" required /></label><button type="submit">Guardar nombre</button></form><button type="button" (click)="deleteCategory(category.id)">Eliminar categoría</button></article></section></section>`,
  styles: `:host{display:block}.content{max-width:920px;margin:auto}.eyebrow,.status{color:#B71C1C;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.eyebrow{border-bottom:3px solid #E53935;padding-bottom:8px}h1,h2{font-family:var(--display-font);text-transform:uppercase}h1{font-size:clamp(2rem,6vw,4rem);margin:.25rem 0}.filter,.categories{margin:28px 0;padding:20px;border:1px solid #E6D9CF;background:#FFF}.filter label{display:grid;gap:6px;font-weight:700}.posts{display:grid;gap:12px}article{display:flex;justify-content:space-between;gap:12px;padding:18px;border:1px solid #E6D9CF;background:#FFF;box-shadow:5px 5px 0 #E6D9CF}.categories article{align-items:center;margin-top:10px;padding:10px;box-shadow:none}.categories form{display:flex;gap:8px;align-items:end}.categories form label{display:grid;gap:6px}.sr-only{position:absolute;overflow:hidden;clip:rect(0,0,0,0);width:1px;height:1px}input,select,button{min-height:44px;padding:10px;border:1px solid #D8C9BD;background:#FFF;color:#111;font:inherit}button{cursor:pointer}input:focus-visible,select:focus-visible,button:focus-visible{outline:3px solid #B71C1C;outline-offset:2px}@media(max-width:640px){.filter,.categories{padding:16px}article,.categories article,.categories form{align-items:stretch;flex-direction:column}.categories form input{width:100%;box-sizing:border-box}}`,
})
export class AdminPostListComponent implements OnInit {
  private readonly api = inject(AcademyApiService);
  private readonly config = inject(SiteConfigService);
  private readonly session = inject(AcademySessionStore);
  posts?: AcademyAdminPostList;
  categories: AcademyCategory[] = [];
  status: AcademyPostVisibility | null = null;
  newCategory = "";
  loading = true;
  error = "";
  categoryError = "";

  ngOnInit() { void this.load(); }
  setStatus(value: string) {
    this.status = value === "visible" || value === "hidden" || value === "deleted" ? value : null;
    void this.load();
  }
  async createCategory() {
    await this.categoryMutation((apiBaseUrl, token) => this.api.createCategory(apiBaseUrl, token, this.newCategory));
  }
  async renameCategory(id: string, displayName: string) {
    await this.categoryMutation((apiBaseUrl, token) => this.api.renameCategory(apiBaseUrl, token, id, displayName));
  }
  async deleteCategory(id: string) {
    await this.categoryMutation((apiBaseUrl, token) => this.api.deleteCategory(apiBaseUrl, token, id));
  }
  statusLabel(status: AcademyPostVisibility) { return status === "visible" ? "Visible" : status === "hidden" ? "Oculta" : "Eliminada"; }

  private async categoryMutation(action: (apiBaseUrl: string, token: string) => Observable<unknown>) {
    this.categoryError = "";
    try {
      const { apiBaseUrl, token } = await this.credentials();
      await firstValueFrom(action(apiBaseUrl, token));
      this.newCategory = "";
      await this.load();
    } catch (error) { this.categoryError = this.message(error); }
  }
  private async credentials() {
    const config = await firstValueFrom(this.config.load()), token = this.session.token;
    if (config.status === "error" || !config.config.apiBaseUrl || !token) throw new Error();
    return { apiBaseUrl: config.config.apiBaseUrl, token };
  }
  private async load() {
    this.loading = true;
    this.error = "";
    try {
      const { apiBaseUrl, token } = await this.credentials();
      const [posts, categories] = await Promise.all([
        firstValueFrom(this.api.listAdminPosts(apiBaseUrl, token, this.status)),
        firstValueFrom(this.api.listCategories(apiBaseUrl, token)),
      ]);
      this.posts = posts.data;
      this.categories = categories.data.items;
    } catch { this.error = "No se pudo cargar el contenido."; }
    finally { this.loading = false; }
  }
  private message(error: unknown) {
    return (error as { error?: { error?: { code?: string } } }).error?.error?.code === "CATEGORY_IN_USE"
      ? "No se puede eliminar una categoría que tiene publicaciones."
      : "No se pudo guardar la categoría.";
  }
}
