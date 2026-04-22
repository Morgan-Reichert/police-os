import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../utils/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// Multer en mémoire — on ne persiste pas l'upload d'un enquêteur
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

/**
 * POST /api/biolab/compare
 *
 * LOGIQUE DE COMPARAISON (prototype RP) :
 *
 * On N'essaie PAS de faire de la vraie reconnaissance biométrique
 * (ça demande OpenCV + modèles de minuties, complètement disproportionné
 * pour du RP). À la place, on match sur :
 *
 *  1. Le nom de fichier exact (ex: empreinte_tueur.jpg)
 *  2. OU le nom de fichier normalisé (insensible à la casse / espaces)
 *
 * Le MJ uploade depuis le panel admin une image en la nommant précisément.
 * Il fournit ensuite ce MÊME fichier au joueur via Discord / prop IG.
 * Quand le joueur uploade, on matche sur le nom.
 *
 * Évolutions possibles (non implémentées ici pour rester simple) :
 *  - Lire un tag EXIF / IPTC dans le JPEG (ex: Keywords = "SUSPECT_DUPONT")
 *  - Hash SHA-256 du binaire (si le MJ donne le fichier EXACT au joueur)
 */
router.post('/compare', upload.single('fingerprint'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fichier manquant' });

  const uploaded = req.file.originalname;
  const normalized = normalize(uploaded);

  const list = db.fingerprints.list();
  const hit = list.find((f) =>
    f.filename === uploaded ||
    normalize(f.filename) === normalized
  );

  if (!hit) {
    return res.json({ match: false });
  }

  // Score fictif mais crédible
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
