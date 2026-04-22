const BASE = ''; // Proxied via Vite

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, opts);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.blob();
}

export const api = {
  // BIOLAB
  compareFingerprint: (file) => {
    const fd = new FormData();
    fd.append('fingerprint', file);
    return req('/api/biolab/compare', { method: 'POST', body: fd });
  },

  // INTERCEPTION
  listWiretaps: () => req('/api/interception/list'),
  wiretapUrl: (id) => `/api/interception/stream/${id}`,

  // MAGISTRAT
  askMagistrat: (query, history) =>
    req('/api/magistrat/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, history }),
    }),

  // ADMIN
  adminLogin: (user, password) =>
    req('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, password }),
    }),
  adminUploadFingerprint: (file, meta) => {
    const fd = new FormData();
    fd.append('fingerprint', file);
    fd.append('meta', JSON.stringify(meta));
    return req('/api/admin/fingerprint', { method: 'POST', body: fd });
  },
  adminUploadWiretap: (file, meta) => {
    const fd = new FormData();
    fd.append('audio', file);
    fd.append('meta', JSON.stringify(meta));
    return req('/api/admin/wiretap', { method: 'POST', body: fd });
  },
  adminListAll: () => req('/api/admin/all'),
  adminDelete: (type, id) =>
    req(`/api/admin/${type}/${id}`, { method: 'DELETE' }),
};
