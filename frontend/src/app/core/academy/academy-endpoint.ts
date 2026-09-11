export function buildAcademyEndpoint(apiBaseUrl: string, path: string) {
  const base = apiBaseUrl.trim().replace(/\/+$/, '') || '/api';
  return `${base}/academy/${path}`;
}
