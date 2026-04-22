import { Router } from 'express';
import multer from 'multer';
import { supabaseAdmin, requireAuth } from '../utils/supabase.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

/**
 * POST /api/biolab/compare
 * Match par nom de fichier normalisé (insensible à la casse/espaces).
 */
router.post('/compare', requireAuth, upload.single('fingerprint'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fichier manquant' });

  const uploaded = req.file.originalname;
  const normalizedUpload = normalize(uploaded);

  const { data, error } = await supabaseAdmin.from('fingerprints').select('*');
  if (error) return res.status(500).json({ error: error.message });

  const hit = data.find((f) =>
    f.filename === uploaded ||
    normalize(f.filename) === normalizedUpload
  );

  if (!hit) return res.json({ match: false });

  const score = 92 + Math.floor(Math.random() * 8);
  res.json({
    match: true,
    score,
    suspect: {
      id: hit.id,
      nom: hit.nom,
      prenom: hit.prenom,
      fiche: hit.fiche,
      naissance: hit.naissance,
      antecedents: hit.antecedents,
      notes: hit.notes,
      score,
    },
  });
});

function normalize(s) {
  return s.toLowerCase().replace(/\.[^.]+$/, '').replace(/[\s_-]+/g, '');
}

export default router;
