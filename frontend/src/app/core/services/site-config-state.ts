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

export const SITE_CONFIG_LOAD_ERROR_MESSAGE =
  'No hemos podido cargar la configuracion del sitio. Recarga la pagina o contacta con TEW.';

export const SITE_CONFIG_URL = '/assets/config/site.config.json';

export type SiteConfigState =
  | {
      status: 'ready';
      config: SiteConfig;
    }
  | {
      status: 'error';
      config: SiteConfig;
      message: string;
    };

export function toSiteConfigReadyState(config: Partial<SiteConfig>): SiteConfigState {
  return {
    status: 'ready',
    config: {
      ...DEFAULT_SITE_CONFIG,
      ...config,
      apiBaseUrl: (config.apiBaseUrl ?? '').trim(),
    },
  };
}

export function toSiteConfigErrorState(): SiteConfigState {
  return {
    status: 'error',
    config: DEFAULT_SITE_CONFIG,
    message: SITE_CONFIG_LOAD_ERROR_MESSAGE,
  };
}
