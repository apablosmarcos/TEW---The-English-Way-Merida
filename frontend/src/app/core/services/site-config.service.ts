import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';

import {
  SITE_CONFIG_URL,
  toSiteConfigErrorState,
  toSiteConfigReadyState,
  type SiteConfig,
  type SiteConfigState,
} from './site-config-state';

export {
  DEFAULT_SITE_CONFIG,
  SITE_CONFIG_LOAD_ERROR_MESSAGE,
  SITE_CONFIG_URL,
  type SiteConfig,
  type SiteConfigState,
} from './site-config-state';

@Injectable({ providedIn: 'root' })
export class SiteConfigService {
  private readonly http = inject(HttpClient);
  private config$?: Observable<SiteConfigState>;

  load() {
    if (!this.config$) {
        this.config$ = this.http
          .get<Partial<SiteConfig>>(SITE_CONFIG_URL)
          .pipe(
          map((config) => toSiteConfigReadyState(config, globalThis.location?.hostname ?? '')),
          catchError(() => of(toSiteConfigErrorState())),
          shareReplay(1),
        );
    }

    return this.config$;
  }
}
