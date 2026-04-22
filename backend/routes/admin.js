import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { db } from '../utils/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FP_DIR = path.join(__dirname, '..', 'uploads', 'fingerprints');
const AUDIO_DIR = path.join(__dirname, '..', 'uploads', 'audio');
[FP_DIR, AUDIO_DIR].forEach((d) => fs.mkdirSync(d, { recursive: true }));

const router = Router();

// --- AUTH très basique (RP, pas prod) ---
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'stariax';

router.post('/login', (req, res) => {
  const { user, password } = req.body || {};
  if (user === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Credentials refusés' });
});

// --- UPLOADS ---
const fpStorage = multer.diskStorage({
  destination: FP_DIR,
  filename: (_req, file, cb) => cb(null, file.originalname), // ⚠ nom original conservé pour le matching
});
const audioStorage = multer.diskStorage({
  destination: AUDIO_DIR,
  filename: (_req, file, cb) => cb(null, file.originalname),
});

const uploadFp = multer({ storage: fpStorage, limits: { fileSize: 15 * 1024 * 1024 } });
const uploadAudio = multer({ storage: audioStorage, limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/fingerprint', uploadFp.single('fingerprint'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fichier manquant' });
  const meta = JSON.parse(req.body.meta || '{}');
  const item = {
    id: crypto.randomBytes(6).toString('hex'),
    filename: req.file.originalname,
    createdAt: new Date().toISOString(),
    ...meta,
  };
  db.fingerprints.add(item);
  res.json(item);
});

router.post('/wiretap', uploadAudio.single('audio'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fichier manquant' });
  const meta = JSON.parse(req.body.meta || '{}');
  const item = {
    id: crypto.randomBytes(6).toString('hex'),
    filename: req.file.originalname,
    createdAt: new Date().toISOString(),
    ...meta,
  };
  db.wiretaps.add(item);
  res.json(item);
});

router.get('/all', (_req, res) => {
  res.json({
    fingerprints: db.fingerprints.list(),
    wiretaps: db.wiretaps.list(),
  });
});

router.delete('/fingerprint/:id', (req, res) => {
  const item = db.fingerprints.list().find((x) => x.id === req.params.id);
  if (item) {
    const p = path.join(FP_DIR, item.filename);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  db.fingerprints.remove(req.params.id);
  res.json({ ok: true });
});

router.delete('/wiretap/:id', (req, res) => {
  const item = db.wiretaps.list().find((x) => x.id === req.params.id);
  if (item) {
    const p = path.join(AUDIO_DIR, item.filename);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  db.wiretaps.remove(req.params.id);
  res.json({ ok: true });
});

export default router;
