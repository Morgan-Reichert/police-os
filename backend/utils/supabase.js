import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!url || !serviceKey) {
  console.warn('[supabase] ⚠ SUPABASE_URL / SUPABASE_SERVICE_KEY manquantes — le backend ne pourra pas accéder à la DB.');
}

// Client admin : bypasse RLS. À n'utiliser QUE côté serveur.
export const supabaseAdmin = url && serviceKey
  ? createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

/**
 * Vérifie le JWT de l'utilisateur (transmis dans Authorization: Bearer <token>)
 * et renvoie son profil (id, badge, role). Renvoie null si invalide.
 */
export async function getAuthUser(req) {
  if (!supabaseAdmin) return null;
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();
  return profile ? { ...data.user, profile } : data.user;
}

export function requireAuth(req, res, next) {
  getAuthUser(req).then((user) => {
    if (!user) return res.status(401).json({ error: 'Non authentifié' });
    req.user = user;
    next();
  });
}

export function requireMJ(req, res, next) {
  getAuthUser(req).then((user) => {
    if (!user) return res.status(401).json({ error: 'Non authentifié' });
    if (user.profile?.role !== 'mj') return res.status(403).json({ error: 'Réservé MJ' });
    req.user = user;
    next();
  });
}
