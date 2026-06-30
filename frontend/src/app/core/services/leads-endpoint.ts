export function buildLeadsEndpoint(apiBaseUrl: string) {
  const normalizedBaseUrl = apiBaseUrl.trim().replace(/\/+$/, '');

  return `${normalizedBaseUrl}/leads`;
}
