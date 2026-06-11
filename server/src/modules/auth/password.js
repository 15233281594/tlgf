// 负责管理员密码的哈希生成和安全校验。
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const keyLength = 64;

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, keyLength);

  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password, passwordHash) {
  const [algorithm, salt, storedKey] = passwordHash.split(':');

  if (algorithm !== 'scrypt' || !salt || !storedKey) {
    return false;
  }

  const storedBuffer = Buffer.from(storedKey, 'hex');
  const derivedKey = await scrypt(password, salt, storedBuffer.length);

  return timingSafeEqual(storedBuffer, derivedKey);
}
