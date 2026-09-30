import { CommonModule, DatePipe } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { firstValueFrom, Subscription } from "rxjs";

import { AcademyApiService } from "../../core/academy/academy-api.service";
import { AcademySessionStore } from "../../core/academy/academy-session.store";
import type {
  AcademyParentAttachment,
  AcademyParentPostDetail,
} from "../../core/academy/academy-types";
import { SiteConfigService } from "../../core/services/site-config.service";
import { attachmentName as formatAttachmentName } from "./attachment-name";

@Component({
  selector: "app-post-detail",
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  template: `<section class="detail" [attr.aria-busy]="loading"><a routerLink="/academia" class="back">← Volver a publicaciones</a><p *ngIf="loading" role="status">Cargando publicación…</p><p *ngIf="error" class="academy-error" role="alert">{{ error }}</p>
    <article *ngIf="!loading && !error && post as current"><p *ngIf="current.category" class="category">{{ current.category.displayName }}</p><h1>{{ current.title }}</h1><p class="dates"><time [attr.datetime]="current.publishedAt">Publicado {{ current.publishedAt | date:'longDate' }}</time><time [attr.datetime]="current.updatedAt">Actualizado {{ current.updatedAt | date:'longDate' }}</time></p><div class="content" [innerHTML]="current.renderedMarkdown"></div>
      <section *ngIf="current.attachments.length" class="materials" aria-labelledby="materials-title"><h2 id="materials-title">Materiales</h2><ul><li *ngFor="let attachment of current.attachments"><span>{{ attachmentName(attachment) }}</span><div><button type="button" [attr.aria-label]="'Vista previa de ' + attachmentName(attachment)" (click)="preview(attachment)">Vista previa</button><button type="button" [attr.aria-label]="'Descargar ' + attachmentName(attachment)" (click)="download(attachment)">Descargar</button></div></li></ul></section><p *ngIf="actionError" class="academy-error" role="alert">{{ actionError }}</p></article></section>`,
  styles: `:host{display:block}.detail{max-width:920px;margin:auto}.back{display:inline-block;color:#B71C1C;font-weight:700;margin-bottom:22px}.category{color:#B71C1C;font-weight:700;text-transform:uppercase;letter-spacing:.08em;border-bottom:3px solid #E53935;padding-bottom:8px}h1,h2{font-family:var(--display-font);text-transform:uppercase}h1{font-size:clamp(1.8rem,4vw,3rem);margin:.25rem 0}.dates{display:flex;flex-wrap:wrap;gap:12px;color:#5B4F44}.content{margin-top:28px;font-size:1.05rem;line-height:1.7}.content :is(img,video){max-width:100%;height:auto}.materials{margin-top:32px;padding:22px;border:1px solid #E6D9CF;background:#FFF;box-shadow:5px 5px 0 #E6D9CF}.materials h2{font-size:1.35rem;margin-top:0}.materials ul{list-style:none;margin:0;padding:0}.materials li{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 0;border-top:1px solid #E6D9CF}.materials div{display:flex;gap:8px}button{min-height:44px;padding:10px;border:1px solid #D8C9BD;background:#FFF;color:#111;font:inherit;cursor:pointer}button:hover{border-color:#B71C1C;color:#B71C1C}a:focus-visible,button:focus-visible{outline:3px solid #B71C1C;outline-offset:2px}@media(max-width:640px){.materials{padding:16px}.materials li{align-items:flex-start;flex-direction:column;gap:8px}}`,
})
export class PostDetailComponent implements OnInit, OnDestroy {
  private readonly api = inject(AcademyApiService);
  private readonly config = inject(SiteConfigService);
  private readonly session = inject(AcademySessionStore);
  private readonly route = inject(ActivatedRoute);
  private readonly objectUrls = new Set<string>();
  private subscription?: Subscription;
  private destroyed = false;
  private loadGeneration = 0;
  post?: AcademyParentPostDetail;
  loading = true;
  error = "";
  actionError = "";

  ngOnInit() {
    this.subscription = this.route.paramMap.subscribe(
      (params) => void this.load(params.get("id") || ""),
    );
  }
  ngOnDestroy() {
    this.destroyed = true;
    this.subscription?.unsubscribe();
    this.revokeObjectUrls();
  }
  attachmentName(attachment: AcademyParentAttachment) {
    return formatAttachmentName(attachment.visibleTitle, attachment.materialOrdinal, mimeExtension(attachment.mimeType));
  }
  async preview(attachment: AcademyParentAttachment) {
    const popup = window.open();
    if (!popup) {
      this.actionError = "No se pudo abrir la vista previa.";
      return;
    }
    popup.opener = null;
    await this.useAttachment(
      attachment,
      "preview",
      (url) => { popup.location.href = url; },
      () => popup.close(),
    );
  }
  async download(attachment: AcademyParentAttachment) {
    await this.useAttachment(attachment, "download", (url) => {
      const link = document.createElement("a");
      link.href = url;
      link.download = this.attachmentName(attachment);
      document.body.append(link);
      link.click();
      link.remove();
    });
  }

  private async load(id: string) {
    const generation = ++this.loadGeneration;
    this.loading = true;
    this.error = "";
    this.actionError = "";
    this.post = undefined;
    const state = await firstValueFrom(this.config.load()),
      token = this.session.token;
    if (generation !== this.loadGeneration) return;
    if (state.status === "error" || !state.config.apiBaseUrl || !token) {
      this.error = "No se pudo cargar la publicación.";
      this.loading = false;
      return;
    }
    try {
      const response = await firstValueFrom(
        this.api.getParentPost(state.config.apiBaseUrl, token, id),
      );
      if (generation !== this.loadGeneration) return;
      this.post = response.data;
    } catch (error) {
      if (generation === this.loadGeneration)
        this.error =
          error instanceof HttpErrorResponse && error.status === 404
            ? "Esta publicación ya no está disponible."
            : "No se pudo cargar la publicación.";
    } finally {
      if (generation === this.loadGeneration) this.loading = false;
    }
  }
  private async useAttachment(
    attachment: AcademyParentAttachment,
    action: "preview" | "download",
    use: (url: string) => void,
    onError?: () => void,
  ) {
    const generation = this.loadGeneration;
    this.actionError = "";
    try {
      const state = await firstValueFrom(this.config.load()),
        token = this.session.token;
          if (generation !== this.loadGeneration || this.destroyed) {
            onError?.();
            return;
          }
          if (state.status === "error" || !state.config.apiBaseUrl || !token)
        throw new Error("unavailable");
      const blob = await firstValueFrom(
        action === "preview"
          ? this.api.previewAttachment(
              state.config.apiBaseUrl,
              token,
              attachment.id,
            )
          : this.api.downloadAttachment(
              state.config.apiBaseUrl,
              token,
              attachment.id,
            ),
      );
          if (generation !== this.loadGeneration || this.destroyed) {
            onError?.();
            return;
          }
          const url = URL.createObjectURL(blob);
          this.objectUrls.add(url);
          try {
            use(url);
          } catch (error) {
            this.releaseObjectUrl(url);
            throw error;
          }
          window.setTimeout(() => this.releaseObjectUrl(url), 60_000);
    } catch {
      if (generation !== this.loadGeneration || this.destroyed) return;
      onError?.();
      this.actionError =
        action === "preview"
          ? "No se pudo abrir la vista previa."
          : "No se pudo descargar el material.";
    }
  }
  private releaseObjectUrl(url: string) {
    URL.revokeObjectURL(url);
    this.objectUrls.delete(url);
  }
  private revokeObjectUrls() {
    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.objectUrls.clear();
  }
}

function mimeExtension(mimeType: AcademyParentAttachment["mimeType"]) {
  return mimeType === "application/pdf"
    ? "pdf"
    : mimeType === "image/jpeg"
      ? "jpg"
      : mimeType === "image/png"
        ? "png"
        : "webp";
}
