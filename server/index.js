import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { pool } from './db.js';
import { initDatabase } from '../scripts/init-db.js';
import { toHttpError } from './errors.js';
import students from './routes/students.js';
import sections from './routes/sections.js';
import enrollments from './routes/enrollments.js';
import reports from './routes/reports.js';
import lookups from './routes/lookups.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || 'https://jagga-tech.github.io')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use('/api', (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '600');
    if (req.headers['access-control-request-private-network'] === 'true') {
      res.set('Access-Control-Allow-Private-Network', 'true');
    }
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '100kb' }));

const wrap = (router) => {
  for (const layer of router.stack) {
    for (const r of layer.route?.stack ?? []) {
      const fn = r.handle;
      r.handle = (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
    }
  }
  return router;
};

app.get('/api/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
app.use('/api/lookups', wrap(lookups));
app.use('/api/students', wrap(students));
app.use('/api/sections', wrap(sections));
app.use('/api/enrollments', wrap(enrollments));
app.use('/api/reports', wrap(reports));
app.use('/api', (req, res) => res.status(404).json({ error: `No API route for ${req.method} ${req.originalUrl}.` }));

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'The request body is not valid JSON.' });
  }
  const { status, body } = toHttpError(err);
  res.status(status).json(body);
});

const dist = path.join(here, '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  app.get('/', (req, res) => res.send('Frontend not built yet. Run "npm run build", then reload.'));
}

const port = Number(process.env.PORT || 3000);

if (process.env.AUTO_INIT === 'true') {
  try {
    await initDatabase({ onlyIfEmpty: true });
  } catch (err) {
    console.error(`Could not set up the database: ${err.message}`);
  }
}

app.listen(port, () => {
  console.log(`Course Registration app running at http://localhost:${port}`);
});
