// 读写后台登录会话 Cookie。
import { config } from '../../config/index.js';

const sameSite = 'Lax';

export function readCookie(req, name) {
  const header = req.header('Cookie');

  if (!header) {
    return '';
  }

  const cookies = header.split(';').map((item) => item.trim());
  const prefix = `${name}=`;
  const found = cookies.find((item) => item.startsWith(prefix));

  return found ? decodeURIComponent(found.slice(prefix.length)) : '';
}

export function setSessionCookie(res, token) {
  const maxAgeSeconds = config.auth.sessionTtlDays * 24 * 60 * 60;
  const parts = [
    `${config.auth.sessionCookieName}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    `SameSite=${sameSite}`,
    `Max-Age=${maxAgeSeconds}`
  ];

  if (config.auth.sessionCookieSecure) {
    parts.push('Secure');
  }

  res.header('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(res) {
  const parts = [
    `${config.auth.sessionCookieName}=`,
    'Path=/',
    'HttpOnly',
    `SameSite=${sameSite}`,
    'Max-Age=0'
  ];

  if (config.auth.sessionCookieSecure) {
    parts.push('Secure');
  }

  res.header('Set-Cookie', parts.join('; '));
}
