import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import 'dotenv/config';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = ['db/schema.sql', 'db/seed.sql'];

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
});

try {
  for (const file of files) {
    process.stdout.write(`Running ${file} ... `);
    await conn.query(fs.readFileSync(path.join(root, file), 'utf8'));
    console.log('done');
  }
  const [[counts]] = await conn.query(
    `SELECT (SELECT COUNT(*) FROM course_registration.student) AS students,
            (SELECT COUNT(*) FROM course_registration.section) AS sections,
            (SELECT COUNT(*) FROM course_registration.enrollment) AS enrollments`);
  console.log(`Database ready: ${counts.students} students, ${counts.sections} sections, ${counts.enrollments} enrollments.`);
} catch (err) {
  console.error(`\nFailed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await conn.end();
}
