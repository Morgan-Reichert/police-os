/**
 * Entrée serverless Vercel — wrappe l'app Express.
 *
 * ⚠ Limitations en prod Vercel (filesystem éphémère) :
 *  - Les uploads (empreintes/audio) NE SURVIVENT PAS à un redeploy.
 *  - Pour un vrai déploiement, il faut migrer :
 *      • stockage fichiers  → Vercel Blob / S3 / Cloudinary
 *      • db.json            → Vercel KV / Postgres / Upstash
 *
 *  En dev local : `npm run dev` dans /backend fonctionne normalement.
 */
import { createApp } from '../server.js';

export default createApp();
