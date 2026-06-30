function normalizeApiBaseUrl(apiBaseUrl: string) {
  return apiBaseUrl.trim().replace(/\/+$/, '');
}

export function buildAdminLoginEndpoint(apiBaseUrl: string) {
  return `${normalizeApiBaseUrl(apiBaseUrl)}/admin/login`;
}

export function buildAdminLeadsEndpoint(apiBaseUrl: string) {
  return `${normalizeApiBaseUrl(apiBaseUrl)}/admin/leads`;
}

export function buildAdminLeadDetailEndpoint(apiBaseUrl: string, leadId: string) {
  return `${buildAdminLeadsEndpoint(apiBaseUrl)}/${leadId}`;
}
