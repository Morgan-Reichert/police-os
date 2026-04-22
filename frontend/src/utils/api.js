import { supabase } from '../lib/supabase';

// En prod Vercel : /_/backend/api/...  — en dev local : /api/... (via proxy Vite)
const BASE = import.meta.env.VITE_API_BASE || '';

async function req(path, opts = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = {
    ...(opts.headers || {}),
    ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
  const res = await fetch(BASE + path, { ...opts, headers });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `${res.status} ${res.statusText}`);
  }
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
  getSignedWiretapUrl: (id) => req(`/api/interception/signed/${id}`),

  // MAGISTRAT (historique)
  listConversations: () => req('/api/magistrat/conversations'),
  getConversation: (id) => req(`/api/magistrat/conversations/${id}`),
  askMagistrat: (query, conversationId) =>
    req('/api/magistrat/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, conversationId }),
    }),

  // ADMIN (MJ seulement)
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
  adminDelete: (type, id) => req(`/api/admin/${type}/${id}`, { method: 'DELETE' }),
};
