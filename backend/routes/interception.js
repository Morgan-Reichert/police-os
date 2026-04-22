import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db } from '../utils/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = path.join(__dirname, '..', 'uploads', 'audio');

const router = Router();

router.get('/list', (_req, res) => {
  res.json(db.wiretaps.list());
});

// Stream du fichier audio — avec Range support pour <audio> HTML5
router.get('/stream/:id', (req, res) => {
  const wt = db.wiretaps.find(req.params.id);
  if (!wt) return res.status(404).end();

  const filePath = path.join(AUDIO_DIR, wt.filename);
  if (!fs.existsSync(filePath)) return res.status(404).end();

  const stat = fs.statSync(filePath);
  const range = req.headers.range;
  const mime = wt.filename.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg';

  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : stat.size - 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': mime,
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Length': stat.size, 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
  }
});

export default router;
