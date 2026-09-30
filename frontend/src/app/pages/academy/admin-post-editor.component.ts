import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AcademyApiService } from '../../core/academy/academy-api.service';
import { renderAcademyMarkdown } from '../../core/academy/academy-markdown';
import { AcademySessionStore } from '../../core/academy/academy-session.store';
import { ExclusiveMutation, canMutateEditor, type EditorLoadState, reservePreviewWindow, runAttachmentUpload } from './admin-post-interactions';
import { attachmentName as formatAttachmentName } from './attachment-name';
import type { AcademyAdminAttachment, AcademyCategory, AcademyPostVisibility } from '../../core/academy/academy-types';
import { SiteConfigService } from '../../core/services/site-config.service';

@Component({
  selector: 'app-admin-post-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `<section class="editor" [attr.aria-busy]="loading"><a routerLink="/academia/admin/publicaciones">← Volver a publicaciones</a><header><p class="eyebrow">Administración</p><h1>{{ id ? 'Editar publicación' : 'Nueva publicación' }}</h1></header>
    <p *ngIf="loading" role="status">Cargando publicación…</p><div *ngIf="loadState === 'error'"><p class="academy-error" role="alert">{{ loadError }}</p><button type="button" class="btn" (click)="load()">Reintentar</button></div>
    <form *ngIf="ready" (submit)="$event.preventDefault(); save()"><p *ngIf="mutationError" class="academy-error" role="alert">{{ mutationError }}</p><p *ngIf="mutationSuccess" role="status">{{ mutationSuccess }}</p><label>Título<input name="title" [value]="title" (input)="title = $any($event.target).value" required [disabled]="deleted || mutationPending" /></label><label>Categoría<select name="category" [(ngModel)]="categoryId" [disabled]="deleted || mutationPending"><option [ngValue]="null">Sin categoría</option><option *ngFor="let category of categories" [ngValue]="category.id">{{ category.displayName }}</option></select></label>
      <div class="modes" role="group" aria-label="Modo de edición"><button type="button" class="btn" [attr.aria-pressed]="mode === 'source'" (click)="mode = 'source'">Editar Markdown</button><button type="button" class="btn" [attr.aria-pressed]="mode === 'visual'" (click)="mode = 'visual'">Vista previa</button></div>
      <ng-container *ngIf="mode === 'source'"><div class="tools"><button type="button" class="btn" (click)="format(source, '**', '**')">Negrita</button><button type="button" class="btn" (click)="format(source, '*', '*')">Cursiva</button><button type="button" class="btn" (click)="format(source, '[', '](https://)')">Enlace</button></div>
      <label>Contenido Markdown<textarea #source name="markdown" [value]="markdownSource" (input)="markdownSource = $any($event.target).value" [disabled]="deleted || mutationPending"></textarea></label></ng-container><section *ngIf="mode === 'visual'" class="preview" aria-label="Vista previa"><h2>Vista previa</h2><div [innerHTML]="preview"></div></section>
      <section *ngIf="id" class="materials" aria-labelledby="materials-title" [attr.aria-busy]="mutationPending"><h2 id="materials-title">Materiales</h2><p *ngIf="attachmentError" class="academy-error" role="alert">{{ attachmentError }}</p><p *ngIf="attachmentSuccess" role="status">{{ attachmentSuccess }}</p><div *ngIf="!deleted" class="upload"><label>Archivo<input #attachmentInput type="file" accept=".pdf,image/jpeg,image/png,image/webp" [disabled]="mutationPending" (change)="attachmentFile = $any($event.target).files[0] || null" /></label><label>Nombre visible (opcional)<input [value]="attachmentTitle" [disabled]="mutationPending" (input)="attachmentTitle = $any($event.target).value" /></label><button type="button" class="btn primary" [disabled]="mutationPending" (click)="uploadAttachment(attachmentInput)">{{ uploading ? 'Subiendo…' : 'Subir material' }}</button></div><h3>Activos</h3><article *ngFor="let attachment of activeAttachments"><span>{{ attachmentName(attachment) }}</span><label>Nombre visible<input #rename [value]="attachment.visibleTitle || ''" [disabled]="mutationPending" /></label><div class="actions"><button type="button" class="btn" (click)="attachmentAction(attachment, 'preview')">Vista previa</button><button type="button" class="btn" (click)="attachmentAction(attachment, 'download')">Descargar</button><button type="button" class="btn" [disabled]="mutationPending" (click)="renameAttachment(attachment.id, rename.value)">Guardar nombre</button><button type="button" class="btn danger" [disabled]="mutationPending" (click)="deleteAttachmentConfirmed(attachment.id)">Eliminar material</button></div></article><p *ngIf="!activeAttachments.length">No hay materiales activos.</p><h3>Eliminados (retenidos)</h3><article *ngFor="let attachment of deletedAttachments"><span>{{ attachmentName(attachment) }}</span><div class="actions"><button type="button" class="btn" (click)="attachmentAction(attachment, 'preview')">Vista previa</button><button type="button" class="btn" (click)="attachmentAction(attachment, 'download')">Descargar</button></div></article><p *ngIf="!deletedAttachments.length">No hay materiales eliminados.</p></section>
      <div class="actions"><button type="submit" class="btn primary" [disabled]="deleted || mutationPending">{{ saving ? 'Guardando…' : (id ? 'Guardar cambios' : 'Crear publicación') }}</button><button *ngIf="id && !deleted" type="button" class="btn" [disabled]="mutationPending" (click)="setVisibility(visibility === 'visible' ? 'hide' : 'show')">{{ visibility === 'visible' ? 'Ocultar' : 'Mostrar' }}</button><button *ngIf="id && !deleted" type="button" class="btn danger" [disabled]="mutationPending" (click)="confirmRemove()">Eliminar publicación</button></div></form></section>`,
  styles: `:host{display:block}.editor{max-width:920px;margin:auto;min-width:0}.editor>a{color:#B71C1C;font-weight:700}.eyebrow{color:#B71C1C;font-weight:700;letter-spacing:.08em;text-transform:uppercase;border-bottom:3px solid #E53935;padding-bottom:8px}h1,h2{font-family:var(--display-font);text-transform:uppercase}h1{font-size:clamp(2rem,6vw,4rem);margin:.25rem 0 24px}form{display:grid;gap:18px;min-width:0}label{display:grid;gap:6px;font-weight:700;min-width:0}input,select,textarea{box-sizing:border-box;width:100%;max-width:100%;min-width:0;min-height:44px;padding:10px;border:1px solid #D8C9BD;background:#FFF;color:#111;font:inherit}textarea{min-height:220px;resize:vertical;line-height:1.5}.modes,.tools,.actions{display:flex;gap:8px;flex-wrap:wrap}.materials{padding:20px;border:1px solid #E6D9CF;background:#FFF;min-width:0}.materials article,.upload{display:flex;gap:8px;align-items:end;padding:12px 0;border-top:1px solid #E6D9CF;min-width:0;flex-wrap:wrap}.materials article>span{flex:1 1 220px;min-width:0;overflow-wrap:anywhere}.materials label,.upload label{flex:1 1 220px;min-width:0}.materials .actions{flex:1 1 100%;min-width:0}.modes{border-bottom:1px solid #E6D9CF;padding-bottom:10px}.modes [aria-pressed=true]{border-color:#B71C1C;color:#B71C1C;background:#FDECEA}.preview{padding:20px;border:1px solid #E6D9CF;background:#FFFDFB;line-height:1.7;min-width:0;overflow-wrap:anywhere}.preview :is(img,video){max-width:100%;height:auto}input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid #B71C1C;outline-offset:2px}@media(max-width:640px){.materials{padding:16px}.materials article,.upload{align-items:stretch;flex-direction:column}.materials article>span,.materials label,.upload label,.materials .actions{flex-basis:auto;width:100%}.materials .actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.preview{padding:16px}.actions .btn,.upload>.btn{width:100%}}`,
})
export class AdminPostEditorComponent implements OnInit, OnDestroy {
  private readonly api = inject(AcademyApiService);
  private readonly config = inject(SiteConfigService);
  private readonly session = inject(AcademySessionStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly mutations = new ExclusiveMutation();
  id = this.route.snapshot.paramMap.get('id');
  categories: AcademyCategory[] = [];
  attachments: AcademyAdminAttachment[] = [];
  attachmentFile: File | null = null;
  attachmentTitle = '';
  attachmentError = '';
  attachmentSuccess = '';
  attachmentSaving = false;
  uploading = false;
  private readonly objectUrls = new Set<string>();
  title = '';
  markdownSource = '';
  categoryId: string | null = null;
  visibility: AcademyPostVisibility = 'visible';
  mode: 'visual' | 'source' = 'source';
  loadState: EditorLoadState = 'loading';
  loadError = '';
  mutationError = '';
  mutationSuccess = '';
  saving = false;

  get loading() { return this.loadState === 'loading'; }
  get ready() { return canMutateEditor(this.loadState); }
  get deleted() { return this.visibility === 'deleted'; }
  get mutable() { return this.ready && !this.deleted; }
  get mutationPending() { return this.mutations.active; }
  get preview() { return renderAcademyMarkdown(this.markdownSource); }
  get activeAttachments() { return this.attachments.filter((attachment) => !attachment.deletedAt); }
  get deletedAttachments() { return this.attachments.filter((attachment) => attachment.deletedAt); }
  ngOnDestroy() { this.objectUrls.forEach((url) => URL.revokeObjectURL(url)); }
  ngOnInit() { void this.load(); }
  async load() {
    this.loadState = 'loading';
    this.loadError = '';
    try {
      const { apiBaseUrl, token } = await this.credentials();
      const categories = await firstValueFrom(this.api.listCategories(apiBaseUrl, token));
      const post = this.id ? (await firstValueFrom(this.api.getAdminPost(apiBaseUrl, token, this.id))).data : null;
      this.categories = categories.data.items;
      if (post) Object.assign(this, post);
      this.loadState = 'ready';
    } catch {
      this.loadError = 'No se pudo cargar la publicación.';
      this.loadState = 'error';
    }
  }
  format(textarea: HTMLTextAreaElement, prefix: string, suffix: string) {
    textarea.setRangeText(`${prefix}${textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)}${suffix}`, textarea.selectionStart, textarea.selectionEnd, 'end');
    this.markdownSource = textarea.value;
    textarea.focus();
  }
  async save() {
    if (!this.mutable) return;
    return this.mutations.run(async () => {
      this.mutationError = '';
      this.mutationSuccess = '';
      this.saving = true;
      try {
        const { apiBaseUrl, token } = await this.credentials();
        const input = { title: this.title, markdownSource: this.markdownSource, categoryId: this.categoryId };
        const post = this.id ? await firstValueFrom(this.api.updateAdminPost(apiBaseUrl, token, this.id, input)) : await firstValueFrom(this.api.createAdminPost(apiBaseUrl, token, input));
        this.mutationSuccess = this.id ? 'Publicación guardada.' : 'Publicación creada.';
        if (!this.id) await this.router.navigateByUrl(`/academia/admin/publicaciones/${post.data.id}`);
      } catch (error) { this.mutationError = this.message(error); }
      finally { this.saving = false; }
    });
  }
  async setVisibility(action: 'show' | 'hide') {
    if (!this.mutable) return;
    return this.mutations.run(async () => {
      this.mutationError = '';
      this.mutationSuccess = '';
      this.saving = true;
      try {
        const { apiBaseUrl, token } = await this.credentials();
        this.visibility = (await firstValueFrom(this.api.setAdminPostVisibility(apiBaseUrl, token, this.id!, action))).data.visibility;
        this.mutationSuccess = this.visibility === 'visible' ? 'Publicación visible.' : 'Publicación oculta.';
      } catch (error) { this.mutationError = this.message(error); }
      finally { this.saving = false; }
    });
  }
  async remove() {
    if (!this.mutable) return;
    return this.mutations.run(async () => {
      this.mutationError = '';
      this.mutationSuccess = '';
      this.saving = true;
      try {
        const { apiBaseUrl, token } = await this.credentials();
        await firstValueFrom(this.api.deleteAdminPost(apiBaseUrl, token, this.id!));
        this.visibility = 'deleted';
        this.mutationSuccess = 'Publicación eliminada.';
      } catch (error) { this.mutationError = this.message(error); }
      finally { this.saving = false; }
    });
  }
  confirmRemove() {
    if (confirm('¿Eliminar esta publicación? Esta acción no se puede deshacer.')) void this.remove();
  }
  deleteAttachmentConfirmed(id: string) {
    if (confirm('¿Eliminar este material? Esta acción no se puede deshacer.')) void this.deleteAttachment(id);
  }
  attachmentName(attachment: AcademyAdminAttachment) { return formatAttachmentName(attachment.visibleTitle, attachment.materialOrdinal, attachment.extension); }
  async uploadAttachment(input: HTMLInputElement) {
    if (!this.mutable) return;
    const file = this.attachmentFile;
    if (!file) { this.attachmentError = 'Selecciona un archivo para subir.'; return; }
    return this.mutations.run(async () => {
      this.attachmentError = '';
      this.attachmentSuccess = '';
      this.attachmentSaving = true;
      this.uploading = true;
      const result = await runAttachmentUpload(this, input, async () => {
        const { apiBaseUrl, token } = await this.credentials(), form = new FormData();
        form.append('file', file);
        if (this.attachmentTitle) form.append('title', this.attachmentTitle);
        return (await firstValueFrom(this.api.uploadAdminAttachment(apiBaseUrl, token, this.id!, form))).data;
      }, (error) => this.attachmentMessage(error));
      if (result.ok) this.attachments = [...this.attachments, result.value];
      this.attachmentSaving = false;
      this.uploading = false;
    });
  }
  async renameAttachment(id: string, title: string) {
    if (!this.mutable) return;
    return this.mutations.run(async () => {
      this.attachmentError = '';
      this.attachmentSuccess = '';
      this.attachmentSaving = true;
      try {
        const { apiBaseUrl, token } = await this.credentials(), updated = (await firstValueFrom(this.api.renameAdminAttachment(apiBaseUrl, token, id, title))).data;
        this.attachments = this.attachments.map((attachment) => attachment.id === id ? updated : attachment);
        this.attachmentSuccess = 'Nombre guardado.';
      } catch (error) { this.attachmentError = this.attachmentMessage(error); }
      finally { this.attachmentSaving = false; }
    });
  }
  async deleteAttachment(id: string) {
    if (!this.mutable) return;
    return this.mutations.run(async () => {
      this.attachmentError = '';
      this.attachmentSuccess = '';
      this.attachmentSaving = true;
      try {
        const { apiBaseUrl, token } = await this.credentials();
        await firstValueFrom(this.api.deleteAdminAttachment(apiBaseUrl, token, id));
        this.attachments = this.attachments.map((attachment) => attachment.id === id ? { ...attachment, deletedAt: new Date().toISOString() } : attachment);
        this.attachmentSuccess = 'Material eliminado.';
      } catch (error) { this.attachmentError = this.attachmentMessage(error); }
      finally { this.attachmentSaving = false; }
    });
  }
  async attachmentAction(attachment: AcademyAdminAttachment, action: 'preview' | 'download') {
    if (!this.ready) return;
    this.attachmentError = '';
    const previewWindow = action === 'preview' ? reservePreviewWindow(() => window.open()) : null;
    if (action === 'preview' && !previewWindow) { this.attachmentError = 'El navegador bloqueó la vista previa.'; return; }
    try {
      const { apiBaseUrl, token } = await this.credentials(), blob = await firstValueFrom(action === 'preview' ? this.api.previewAttachment(apiBaseUrl, token, attachment.id) : this.api.downloadAttachment(apiBaseUrl, token, attachment.id)), url = URL.createObjectURL(blob);
      this.objectUrls.add(url);
      window.setTimeout(() => { URL.revokeObjectURL(url); this.objectUrls.delete(url); }, 60_000);
      if (previewWindow) previewWindow.location.href = url;
      else {
        const link = document.createElement('a');
        link.href = url;
        link.download = this.attachmentName(attachment);
        document.body.append(link);
        link.click();
        link.remove();
      }
    } catch {
      previewWindow?.close();
      this.attachmentError = action === 'preview' ? 'No se pudo abrir la vista previa.' : 'No se pudo descargar el material.';
    }
  }
  private async credentials() {
    const state = await firstValueFrom(this.config.load()), token = this.session.token;
    if (state.status === 'error' || !state.config.apiBaseUrl || !token) throw new Error();
    return { apiBaseUrl: state.config.apiBaseUrl, token };
  }
  private message(error: unknown) { return this.code(error) === 'POST_DELETED' ? 'Las publicaciones eliminadas no se pueden modificar.' : 'No se pudo guardar la publicación.'; }
  private attachmentMessage(error: unknown) {
    const code = this.code(error);
    return code === 'ATTACHMENT_LIMIT' ? 'Esta publicación ya tiene 10 materiales.' : code === 'UPLOAD_TOO_LARGE' ? 'El archivo supera el máximo de 20 MiB.' : code === 'UNSUPPORTED_FILE_TYPE' ? 'Solo se admiten PDF, JPEG, PNG o WebP.' : code === 'POST_DELETED' || code === 'ATTACHMENT_DELETED' ? 'Este material ya no se puede modificar.' : 'No se pudo guardar el material.';
  }
  private code(error: unknown) { return (error as { error?: { error?: { code?: string } } }).error?.error?.code; }
}
