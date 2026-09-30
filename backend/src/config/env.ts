const DEFAULT_PORT = 3000;
const MAX_TRUST_PROXY_HOPS = 2;

export function getTrustProxyHops() {
  const value = process.env.TRUST_PROXY_HOPS;

  if (!/^(?:0|[1-9]\d*)$/.test(value ?? '')) {
    return false;
  }

  const hops = Number(value);
  return hops <= MAX_TRUST_PROXY_HOPS ? hops : false;
}

export function getPort() {
  const value = Number.parseInt(process.env.PORT ?? '', 10);

  return Number.isNaN(value) ? DEFAULT_PORT : value;
}
