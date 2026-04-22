import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import biolabRoutes from './routes/biolab.js';
import interceptionRoutes from './routes/interception.js';
import magistratRoutes from './routes/magistrat.js';
import adminRoutes from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '5mb' }));

  // Statique (uniquement utile en local — sur Vercel le FS est éphémère)
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  app.use('/api/biolab', biolabRoutes);
  app.use('/api/interception', interceptionRoutes);
  app.use('/api/magistrat', magistratRoutes);
  app.use('/api/admin', adminRoutes);

  app.get('/api/health', (_, res) => res.json({ ok: true, service: 'police-os-backend' }));

  return app;
}

// Lancement direct (dev local) — pas sur Vercel (qui importe createApp)
if (import.meta.url === `file://${process.argv[1]}`) {
  const PORT = process.env.PORT || 3001;
  createApp().listen(PORT, () => {
    console.log(`\n  ▶ POLICE-OS backend : http://localhost:${PORT}`);
    console.log(`  ▶ AI Magistrat     : ${process.env.ANTHROPIC_API_KEY ? 'Anthropic OK' : '⚠ ANTHROPIC_API_KEY manquant (fallback mock)'}\n`);
  });
}
