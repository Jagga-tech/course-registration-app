import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import mysql from 'mysql2/promise';
import { connectionConfig, databaseName } from '../server/config.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function readScript(file) {
  const sql = fs.readFileSync(path.join(root, file), 'utf8');
  const name = databaseName();
  if (name === 'course_registration') return sql;
  return sql.replaceAll('course_registration', name);
}

export async function initDatabase({ onlyIfEmpty = false, log = console.log } = {}) {
  const conn = await mysql.createConnection({ ...connectionConfig({ withDatabase: false }), multipleStatements: true });
  try {
    if (onlyIfEmpty) {
      const [rows] = await conn.query(
        'SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
        [databaseName(), 'enrollment']);
      if (rows[0].n > 0) {
        log(`Database "${databaseName()}" already has tables; leaving the data as it is.`);
        return false;
      }
      log(`Database "${databaseName()}" is empty; creating tables and loading sample data.`);
    }
    for (const file of ['db/schema.sql', 'db/seed.sql']) {
      log(`Running ${file} ...`);
      await conn.query(readScript(file));
    }
    const db = mysql.escapeId(databaseName());
    const [[counts]] = await conn.query(
      `SELECT (SELECT COUNT(*) FROM ${db}.student) AS students,
              (SELECT COUNT(*) FROM ${db}.section) AS sections,
              (SELECT COUNT(*) FROM ${db}.enrollment) AS enrollments`);
    log(`Database ready: ${counts.students} students, ${counts.sections} sections, ${counts.enrollments} enrollments.`);
    return true;
  } finally {
    await conn.end();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  initDatabase().catch((err) => {
    console.error(`Failed: ${err.message}`);
    process.exitCode = 1;
  });
}
