const DEFAULT_PORT = 3000;

export function getPort() {
  const value = Number.parseInt(process.env.PORT ?? '', 10);

  return Number.isNaN(value) ? DEFAULT_PORT : value;
}
