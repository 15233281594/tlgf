// 创建或更新后台超级管理员账号。
import { config } from '../src/config/index.js';
import { isDatabaseConfigured } from '../src/db/index.js';
import { upsertAdminUser } from '../src/modules/auth/auth.repository.js';
import { hashPassword } from '../src/modules/auth/password.js';

function readArg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));

  return found ? found.slice(prefix.length) : '';
}

const email = (readArg('email') || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = readArg('password') || process.env.ADMIN_PASSWORD || '';
const name = (readArg('name') || process.env.ADMIN_NAME || '管理员').trim();

if (!isDatabaseConfigured()) {
  throw new Error('Database is not configured. Fill DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME first.');
}

if (!email || !email.includes('@')) {
  throw new Error('Please provide a valid admin email with --email=admin@example.com or ADMIN_EMAIL.');
}

if (password.length < 8) {
  throw new Error('Admin password must be at least 8 characters.');
}

const passwordHash = await hashPassword(password);

await upsertAdminUser({
  email,
  name,
  passwordHash,
  role: 'super_admin'
});

console.log(`Admin user is ready: ${email}`);
console.log(`Database: ${config.database.name}`);
