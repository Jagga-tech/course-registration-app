import fs from 'node:fs';
import 'dotenv/config';

function fromUrl(raw) {
  if (!raw) return {};
  const u = new URL(raw);
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : undefined,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    ssl: /ssl-mode=(required|verify_ca|verify_identity)/i.test(u.search) || undefined
  };
}

function sslOptions(wanted) {
  if (!wanted) return undefined;
  let ca = process.env.DB_CA;
  if (!ca && process.env.DB_CA_PATH) ca = fs.readFileSync(process.env.DB_CA_PATH, 'utf8');
  if (ca) return { ca: ca.replace(/\\n/g, '\n'), rejectUnauthorized: true };
  return { rejectUnauthorized: true };
}

export function connectionConfig({ withDatabase = true } = {}) {
  const url = fromUrl(process.env.DATABASE_URL);
  const sslWanted = process.env.DB_SSL ? process.env.DB_SSL === 'true' : Boolean(url.ssl);
  const config = {
    host: process.env.DB_HOST || url.host || 'localhost',
    port: Number(process.env.DB_PORT || url.port || 3306),
    user: process.env.DB_USER || url.user || 'root',
    password: process.env.DB_PASSWORD ?? url.password ?? '',
    ssl: sslOptions(sslWanted)
  };
  if (withDatabase) config.database = databaseName();
  return config;
}

export function databaseName() {
  return process.env.DB_NAME || 'course_registration';
}
