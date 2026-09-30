export function isAcademyRequest(
  url: string,
  apiBaseUrl: string,
  origin = globalThis.location.origin,
) {
  const target = new URL(url, origin);
  const base = new URL(apiBaseUrl || "/api", origin);
  const academyPath = `${base.pathname.replace(/\/+$/, "")}/academy/`;
  return target.origin === base.origin && target.pathname.startsWith(academyPath);
}

export function retryAfterSeconds(value: string | null, now = Date.now()) {
  if (!value) return null;
  if (/^\d+$/.test(value.trim())) return Number(value);
  const retryAt = Date.parse(value);
  return Number.isNaN(retryAt) ? null : Math.max(0, Math.ceil((retryAt - now) / 1000));
}
