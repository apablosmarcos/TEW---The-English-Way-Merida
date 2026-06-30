import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';

export interface SiteConfig {
  brandName: string;
  apiBaseUrl: string;
  contactEmail: string;
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  brandName: 'TEW - The English Way Merida',
  apiBaseUrl: '',
  contactEmail: 'theenglishway.tew@gmail.com',
};

@Injectable({ providedIn: 'root' })
export class SiteConfigService {
  private readonly http = inject(HttpClient);
  private config$?: Observable<SiteConfig>;

  load() {
    if (!this.config$) {
      this.config$ = this.http
        .get<Partial<SiteConfig>>('assets/config/site.config.json')
        .pipe(
          map((config) => ({
            ...DEFAULT_SITE_CONFIG,
            ...config,
            apiBaseUrl: (config.apiBaseUrl ?? '').trim(),
          })),
          catchError(() => of(DEFAULT_SITE_CONFIG)),
          shareReplay(1),
        );
    }

    return this.config$;
  }
}
