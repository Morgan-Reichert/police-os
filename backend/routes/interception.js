import { Router } from 'express';
import { supabaseAdmin, requireAuth } from '../utils/supabase.js';

const router = Router();

router.get('/list', requireAuth, async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('wiretaps')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/**
 * GET /api/interception/signed/:id
 * Retourne une URL signée temporaire (5 min) pour lire l'audio depuis Storage.
 * Le <audio> ou wavesurfer du front utilisera cette URL directement.
 */
router.get('/signed/:id', requireAuth, async (req, res) => {
  const { data: wt, error } = await supabaseAdmin
    .from('wiretaps').select('*').eq('id', req.params.id).single();
  if (error || !wt) return res.status(404).json({ error: 'Écoute introuvable' });

  const { data: signed, error: signErr } = await supabaseAdmin
    .storage.from('wiretaps')
    .createSignedUrl(wt.storage_path, 300);
  if (signErr) return res.status(500).json({ error: signErr.message });

  res.json({ url: signed.signedUrl, wiretap: wt });
});

export default router;
