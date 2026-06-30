import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';

import { toSiteConfigErrorState, toSiteConfigReadyState, type SiteConfig, type SiteConfigState } from './site-config-state';

export {
  DEFAULT_SITE_CONFIG,
  SITE_CONFIG_LOAD_ERROR_MESSAGE,
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
        .get<Partial<SiteConfig>>('assets/config/site.config.json')
        .pipe(
          map((config) => toSiteConfigReadyState(config)),
          catchError(() => of(toSiteConfigErrorState())),
          shareReplay(1),
        );
    }

    return this.config$;
  }
}
