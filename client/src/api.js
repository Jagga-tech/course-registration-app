export const IS_STATIC_HOST = Boolean(import.meta.env.VITE_API_BASE);

export function getApiBase() {
  try {
    const saved = localStorage.getItem('apiBase');
    if (saved) return saved;
  } catch {
    return import.meta.env.VITE_API_BASE || '';
  }
  return import.meta.env.VITE_API_BASE || '';
}

export function setApiBase(value) {
  try {
    if (value) localStorage.setItem('apiBase', value.replace(/\/+$/, ''));
    else localStorage.removeItem('apiBase');
  } catch {
    return;
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${getApiBase()}/api${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    return {
      ok: false,
      offline: true,
      error: IS_STATIC_HOST
        ? `Cannot reach the server at ${getApiBase()}. Start it on your computer with "npm start" and reload this page.`
        : 'Cannot reach the server. Is it running?'
    };
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    return { ok: false, status: res.status, error: data?.error || `Request failed (${res.status}).`, fields: data?.fields || {} };
  }
  return { ok: true, data };
}

export function qs(params) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v).trim() !== '') p.set(k, String(v).trim());
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

export const termLabel = (t) => `${t.semester} ${t.year}`;
export const sectionPath = (s) => `/sections/${s.cno}/${s.semester}/${s.year}/${s.sec_no}`;
