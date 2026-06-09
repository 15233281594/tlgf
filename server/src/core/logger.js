function write(level, message, meta = {}) {
  const event = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta
  };

  const line = JSON.stringify(event);

  if (level === 'error') {
    console.error(line);
    return;
  }

  console.log(line);
}

export const logger = {
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta)
};
