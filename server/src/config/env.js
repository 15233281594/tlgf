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

export function readBooleanEnv(name, fallback) {
  const value = readEnv(name, String(fallback)).toLowerCase();

  if (['1', 'true', 'yes', 'on'].includes(value)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(value)) {
    return false;
  }

  throw new Error(`Invalid boolean for ${name}: ${value}`);
}
