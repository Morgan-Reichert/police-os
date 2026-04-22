import { Router } from 'express';
import multer from 'multer';
import { supabaseAdmin, requireMJ } from '../utils/supabase.js';

const router = Router();
const uploadFp = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
const uploadAudio = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// -------- Empreintes --------
router.post('/fingerprint', requireMJ, uploadFp.single('fingerprint'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fichier manquant' });
  const meta = JSON.parse(req.body.meta || '{}');
  const storagePath = `${Date.now()}-${req.file.originalname}`;

  const { error: upErr } = await supabaseAdmin
    .storage.from('fingerprints')
    .upload(storagePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });
  if (upErr) return res.status(500).json({ error: upErr.message });

  const { data, error } = await supabaseAdmin
    .from('fingerprints')
    .insert({
      filename: req.file.originalname,
      storage_path: storagePath,
      nom: meta.nom || 'Inconnu',
      prenom: meta.prenom,
      fiche: meta.fiche,
      naissance: meta.naissance,
      antecedents: meta.antecedents,
      notes: meta.notes,
      uploaded_by: req.user.id,
    })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/fingerprint/:id', requireMJ, async (req, res) => {
  const { data: row } = await supabaseAdmin
    .from('fingerprints').select('storage_path').eq('id', req.params.id).single();
  if (row?.storage_path) {
    await supabaseAdmin.storage.from('fingerprints').remove([row.storage_path]);
  }
  await supabaseAdmin.from('fingerprints').delete().eq('id', req.params.id);
  res.json({ ok: true });
});

// -------- Écoutes --------
router.post('/wiretap', requireMJ, uploadAudio.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fichier manquant' });
  const meta = JSON.parse(req.body.meta || '{}');
  const storagePath = `${Date.now()}-${req.file.originalname}`;

  const { error: upErr } = await supabaseAdmin
    .storage.from('wiretaps')
    .upload(storagePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });
  if (upErr) return res.status(500).json({ error: upErr.message });

  const { data, error } = await supabaseAdmin
    .from('wiretaps')
    .insert({
      filename: req.file.originalname,
      storage_path: storagePath,
      suspect: meta.suspect || 'Inconnu',
      ligne: meta.ligne || '—',
      date_captation: meta.date,
      duree: meta.duree,
      mandat: meta.mandat,
      transcription: meta.transcription,
      uploaded_by: req.user.id,
    })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/wiretap/:id', requireMJ, async (req, res) => {
  const { data: row } = await supabaseAdmin
    .from('wiretaps').select('storage_path').eq('id', req.params.id).single();
  if (row?.storage_path) {
    await supabaseAdmin.storage.from('wiretaps').remove([row.storage_path]);
  }
  await supabaseAdmin.from('wiretaps').delete().eq('id', req.params.id);
  res.json({ ok: true });
});

router.get('/all', requireMJ, async (_req, res) => {
  const [fp, wt] = await Promise.all([
    supabaseAdmin.from('fingerprints').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('wiretaps').select('*').order('created_at', { ascending: false }),
  ]);
  res.json({ fingerprints: fp.data || [], wiretaps: wt.data || [] });
});

export default router;
