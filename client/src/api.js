export async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    return { ok: false, error: 'Cannot reach the server. Is it running?' };
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
