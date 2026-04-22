import { Router } from 'express';
import { askMagistrat } from '../services/aiMagistrat.js';

const router = Router();

router.post('/query', async (req, res) => {
  const { query, history } = req.body || {};
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query manquante' });
  }
  try {
    const reply = await askMagistrat(query, Array.isArray(history) ? history : []);
    res.json({ reply });
  } catch (e) {
    console.error('[magistrat]', e);
    res.status(500).json({ error: 'Indisponibilité du parquet — réessayez.' });
  }
});

export default router;
