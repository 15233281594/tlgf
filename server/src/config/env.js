export function readEnv(name, fallback) {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

export function readNumberEnv(name, fallback) {
  const value = readEnv(name, String(fallback));
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid number for ${name}: ${value}`);
  }

  return parsed;
}
