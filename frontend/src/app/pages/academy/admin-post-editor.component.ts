import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AcademyApiService } from '../../core/academy/academy-api.service';
import { renderAcademyMarkdown } from '../../core/academy/academy-markdown';
import { AcademySessionStore } from '../../core/academy/academy-session.store';
import type { AcademyAdminAttachment, AcademyCategory, AcademyPostVisibility } from '../../core/academy/academy-types';
import { SiteConfigService } from '../../core/services/site-config.service';

@Component({
  selector: 'app-admin-post-editor',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `<section class="editor" [attr.aria-busy]="loading"><a routerLink="/academia/admin/publicaciones">← Volver a publicaciones</a><header><p class="eyebrow">Administración</p><h1>{{ id ? 'Editar publicación' : 'Nueva publicación' }}</h1></header>
    <p *ngIf="loading" role="status">Cargando publicación…</p><p *ngIf="error" role="alert">{{ error }}</p>
    <form *ngIf="!loading" (submit)="$event.preventDefault(); save()"><label>Título<input name="title" [value]="title" (input)="title = $any($event.target).value" required [disabled]="deleted" /></label><label>Categoría<select name="category" [value]="categoryId || ''" (change)="categoryId = $any($event.target).value || null" [disabled]="deleted"><option value="">Sin categoría</option><option *ngFor="let category of categories" [value]="category.id">{{ category.displayName }}</option></select></label>
      <div class="modes" role="group" aria-label="Modo de edición"><button type="button" [attr.aria-pressed]="mode === 'visual'" (click)="mode = 'visual'">Visual</button><button type="button" [attr.aria-pressed]="mode === 'source'" (click)="mode = 'source'">Código fuente</button></div>
      <div class="tools" *ngIf="mode === 'visual'"><button type="button" (click)="format(source, '**', '**')">Negrita</button><button type="button" (click)="format(source, '*', '*')">Cursiva</button><button type="button" (click)="format(source, '[', '](https://)')">Enlace</button></div>
      <label>Contenido Markdown<textarea #source name="markdown" [class.source]="mode === 'source'" [value]="markdownSource" (input)="markdownSource = $any($event.target).value" [disabled]="deleted"></textarea></label><section *ngIf="mode === 'visual'" class="preview" aria-label="Vista previa"><h2>Vista previa</h2><div [innerHTML]="preview"></div></section>
      <section *ngIf="id" class="materials" aria-labelledby="materials-title"><h2 id="materials-title">Materiales</h2><p *ngIf="attachmentError" role="alert">{{ attachmentError }}</p><div *ngIf="!deleted" class="upload"><label>Archivo<input type="file" accept=".pdf,image/jpeg,image/png,image/webp" (change)="attachmentFile = $any($event.target).files[0] || null" /></label><label>Nombre visible (opcional)<input [value]="attachmentTitle" (input)="attachmentTitle = $any($event.target).value" /></label><button type="button" (click)="uploadAttachment()">Subir material</button></div><h3>Activos</h3><article *ngFor="let attachment of activeAttachments"><span>{{ attachmentName(attachment) }}</span><label>Nombre visible<input #rename [value]="attachment.visibleTitle || ''" /></label><div class="actions"><button type="button" (click)="attachmentAction(attachment, 'preview')">Vista previa</button><button type="button" (click)="attachmentAction(attachment, 'download')">Descargar</button><button type="button" (click)="renameAttachment(attachment.id, rename.value)">Guardar nombre</button><button type="button" (click)="deleteAttachment(attachment.id)">Eliminar material</button></div></article><p *ngIf="!activeAttachments.length">No hay materiales activos.</p><h3>Eliminados (retenidos)</h3><article *ngFor="let attachment of deletedAttachments"><span>{{ attachmentName(attachment) }}</span><div class="actions"><button type="button" (click)="attachmentAction(attachment, 'preview')">Vista previa</button><button type="button" (click)="attachmentAction(attachment, 'download')">Descargar</button></div></article><p *ngIf="!deletedAttachments.length">No hay materiales eliminados.</p></section>
      <div class="actions"><button type="submit" [disabled]="deleted">{{ id ? 'Guardar cambios' : 'Crear publicación' }}</button><button *ngIf="id && !deleted" type="button" (click)="setVisibility(visibility === 'visible' ? 'hide' : 'show')">{{ visibility === 'visible' ? 'Ocultar' : 'Mostrar' }}</button><button *ngIf="id && !deleted" type="button" (click)="remove()">Eliminar publicación</button></div></form></section>`,
  styles: `:host{display:block}.editor{max-width:920px;margin:auto}.editor>a{color:#B71C1C;font-weight:700}.eyebrow{color:#B71C1C;font-weight:700;letter-spacing:.08em;text-transform:uppercase;border-bottom:3px solid #E53935;padding-bottom:8px}h1,h2{font-family:var(--display-font);text-transform:uppercase}h1{font-size:clamp(2rem,6vw,4rem);margin:.25rem 0 24px}form{display:grid;gap:18px}label{display:grid;gap:6px;font-weight:700}input,select,textarea,button{min-height:44px;padding:10px;border:1px solid #D8C9BD;background:#FFF;color:#111;font:inherit}textarea{min-height:220px;resize:vertical;line-height:1.5}.modes,.tools,.actions{display:flex;gap:8px;flex-wrap:wrap}.materials{padding:20px;border:1px solid #E6D9CF;background:#FFF}.materials article,.upload{display:flex;gap:8px;align-items:end;padding:12px 0;border-top:1px solid #E6D9CF}.materials article>span{flex:1}.materials label{min-width:160px}.modes{border-bottom:1px solid #E6D9CF;padding-bottom:10px}.modes [aria-pressed=true]{border-color:#B71C1C;color:#B71C1C;font-weight:700}.preview{padding:20px;border:1px solid #E6D9CF;background:#FFFDFB;line-height:1.7}.preview :is(img,video){max-width:100%;height:auto}.preview a{color:#B71C1C}button{cursor:pointer}button[disabled]{cursor:not-allowed;opacity:.6}input:focus-visible,select:focus-visible,textarea:focus-visible,button:focus-visible{outline:3px solid #B71C1C;outline-offset:2px}@media(max-width:640px){.preview{padding:16px}.actions button{width:100%}}`,
})
export class AdminPostEditorComponent implements OnInit, OnDestroy {
  private readonly api = inject(AcademyApiService);
  private readonly config = inject(SiteConfigService);
  private readonly session = inject(AcademySessionStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  id = this.route.snapshot.paramMap.get('id');
  categories: AcademyCategory[] = [];
  attachments: AcademyAdminAttachment[] = [];
  attachmentFile: File | null = null;
  attachmentTitle = '';
  attachmentError = '';
  private readonly objectUrls = new Set<string>();
  title = '';
  markdownSource = '';
  categoryId: string | null = null;
  visibility: AcademyPostVisibility = 'visible';
  mode: 'visual' | 'source' = 'visual';
  loading = true;
  error = '';

  get deleted() { return this.visibility === 'deleted'; }
  get preview() { return renderAcademyMarkdown(this.markdownSource); }
  get activeAttachments() { return this.attachments.filter((attachment) => !attachment.deletedAt); }
  get deletedAttachments() { return this.attachments.filter((attachment) => attachment.deletedAt); }
  ngOnDestroy() { this.objectUrls.forEach((url) => URL.revokeObjectURL(url)); }
  async ngOnInit() {
    try {
      const { apiBaseUrl, token } = await this.credentials();
      const categories = await firstValueFrom(this.api.listCategories(apiBaseUrl, token));
      this.categories = categories.data.items;
      if (this.id) {
        const post = (await firstValueFrom(this.api.getAdminPost(apiBaseUrl, token, this.id))).data;
        Object.assign(this, post);
      }
    } catch { this.error = 'No se pudo cargar la publicación.'; }
    finally { this.loading = false; }
  }
  format(textarea: HTMLTextAreaElement, prefix: string, suffix: string) {
    textarea.setRangeText(`${prefix}${textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)}${suffix}`, textarea.selectionStart, textarea.selectionEnd, 'end');
    this.markdownSource = textarea.value;
    textarea.focus();
  }
  async save() {
    try {
      const { apiBaseUrl, token } = await this.credentials();
      const input = { title: this.title, markdownSource: this.markdownSource, categoryId: this.categoryId };
      const post = this.id ? await firstValueFrom(this.api.updateAdminPost(apiBaseUrl, token, this.id, input)) : await firstValueFrom(this.api.createAdminPost(apiBaseUrl, token, input));
      if (!this.id) await this.router.navigateByUrl(`/academia/admin/publicaciones/${post.data.id}`);
    } catch (error) { this.error = this.message(error); }
  }
  async setVisibility(action: 'show' | 'hide') {
    try {
      const { apiBaseUrl, token } = await this.credentials();
      this.visibility = (await firstValueFrom(this.api.setAdminPostVisibility(apiBaseUrl, token, this.id!, action))).data.visibility;
    } catch (error) { this.error = this.message(error); }
  }
  async remove() {
    try {
      const { apiBaseUrl, token } = await this.credentials();
      await firstValueFrom(this.api.deleteAdminPost(apiBaseUrl, token, this.id!));
      this.visibility = 'deleted';
    } catch (error) { this.error = this.message(error); }
  }
  attachmentName(attachment: AcademyAdminAttachment) { return `${attachment.visibleTitle || `Material ${attachment.materialOrdinal}`}.${attachment.extension}`; }
  async uploadAttachment() {
    if (!this.attachmentFile) { this.attachmentError = 'Selecciona un archivo para subir.'; return; }
    try {
      const { apiBaseUrl, token } = await this.credentials(), form = new FormData();
      form.append('file', this.attachmentFile);
      if (this.attachmentTitle) form.append('title', this.attachmentTitle);
      this.attachments = [...this.attachments, (await firstValueFrom(this.api.uploadAdminAttachment(apiBaseUrl, token, this.id!, form))).data];
      this.attachmentFile = null; this.attachmentTitle = ''; this.attachmentError = '';
    } catch (error) { this.attachmentError = this.attachmentMessage(error); }
  }
  async renameAttachment(id: string, title: string) {
    try {
      const { apiBaseUrl, token } = await this.credentials(), updated = (await firstValueFrom(this.api.renameAdminAttachment(apiBaseUrl, token, id, title))).data;
      this.attachments = this.attachments.map((attachment) => attachment.id === id ? updated : attachment); this.attachmentError = '';
    } catch (error) { this.attachmentError = this.attachmentMessage(error); }
  }
  async deleteAttachment(id: string) {
    try {
      const { apiBaseUrl, token } = await this.credentials();
      await firstValueFrom(this.api.deleteAdminAttachment(apiBaseUrl, token, id));
      this.attachments = this.attachments.map((attachment) => attachment.id === id ? { ...attachment, deletedAt: new Date().toISOString() } : attachment); this.attachmentError = '';
    } catch (error) { this.attachmentError = this.attachmentMessage(error); }
  }
  async attachmentAction(attachment: AcademyAdminAttachment, action: 'preview' | 'download') {
    try {
      const { apiBaseUrl, token } = await this.credentials(), blob = await firstValueFrom(action === 'preview' ? this.api.previewAttachment(apiBaseUrl, token, attachment.id) : this.api.downloadAttachment(apiBaseUrl, token, attachment.id)), url = URL.createObjectURL(blob);
      this.objectUrls.add(url);
      const link = document.createElement('a'); link.href = url;
      if (action === 'preview') { link.target = '_blank'; link.rel = 'noopener'; }
      else link.download = this.attachmentName(attachment);
      document.body.append(link); link.click(); link.remove();
      window.setTimeout(() => { URL.revokeObjectURL(url); this.objectUrls.delete(url); }, 60_000);
    } catch { this.attachmentError = action === 'preview' ? 'No se pudo abrir la vista previa.' : 'No se pudo descargar el material.'; }
  }
  private async credentials() {
    const state = await firstValueFrom(this.config.load()), token = this.session.token;
    if (state.status === 'error' || !state.config.apiBaseUrl || !token) throw new Error();
    return { apiBaseUrl: state.config.apiBaseUrl, token };
  }
  private message(error: unknown) { return this.code(error) === 'RESOURCE_STATE_CONFLICT' || this.code(error) === 'POST_DELETED' ? 'Las publicaciones eliminadas no se pueden modificar.' : 'No se pudo guardar la publicación.'; }
  private attachmentMessage(error: unknown) {
    const code = this.code(error);
    return code === 'ATTACHMENT_LIMIT' ? 'Esta publicación ya tiene 10 materiales.' : code === 'UPLOAD_TOO_LARGE' ? 'El archivo supera el máximo de 20 MiB.' : code === 'UNSUPPORTED_FILE_TYPE' ? 'Solo se admiten PDF, JPEG, PNG o WebP.' : code === 'POST_DELETED' || code === 'ATTACHMENT_DELETED' ? 'Este material ya no se puede modificar.' : 'No se pudo guardar el material.';
  }
  private code(error: unknown) { return (error as { error?: { error?: { code?: string } } }).error?.error?.code; }
}
