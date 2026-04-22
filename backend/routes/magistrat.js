import { Router } from 'express';
import { askMagistrat } from '../services/aiMagistrat.js';
import { supabaseAdmin, requireAuth } from '../utils/supabase.js';

const router = Router();

/**
 * Liste des conversations de l'utilisateur courant.
 */
router.get('/conversations', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('magistrat_conversations')
    .select('*')
    .eq('user_id', req.user.id)
    .order('updated_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/**
 * Récupère une conversation + tous ses messages.
 */
router.get('/conversations/:id', requireAuth, async (req, res) => {
  const { data: conv } = await supabaseAdmin
    .from('magistrat_conversations')
    .select('*')
    .eq('id', req.params.id).single();
  if (!conv || conv.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  const { data: messages } = await supabaseAdmin
    .from('magistrat_messages')
    .select('*')
    .eq('conversation_id', req.params.id)
    .order('created_at', { ascending: true });
  res.json({ conversation: conv, messages: messages || [] });
});

/**
 * Envoie un message. Crée la conversation au premier message.
 */
router.post('/query', requireAuth, async (req, res) => {
  const { query, conversationId } = req.body || {};
  if (!query?.trim()) return res.status(400).json({ error: 'query vide' });

  // 1. Créer ou récupérer la conversation
  let convId = conversationId;
  if (!convId) {
    const { data } = await supabaseAdmin
      .from('magistrat_conversations')
      .insert({
        user_id: req.user.id,
        title: query.slice(0, 60).replace(/\s+/g, ' '),
      })
      .select().single();
    convId = data.id;
  }

  // 2. Historique pour context IA
  const { data: history } = await supabaseAdmin
    .from('magistrat_messages')
    .select('role, content')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true })
    .limit(20);

  // 3. Enregistrer le message utilisateur
  await supabaseAdmin.from('magistrat_messages').insert({
    conversation_id: convId,
    role: 'user',
    content: query,
  });

  // 4. Appeler l'IA
  let reply;
  try {
    reply = await askMagistrat(query, history || []);
  } catch (e) {
    console.error('[magistrat]', e);
    return res.status(500).json({ error: 'Indisponibilité du parquet' });
  }

  // 5. Sauver la réponse
  await supabaseAdmin.from('magistrat_messages').insert({
    conversation_id: convId,
    role: 'assistant',
    content: reply,
  });

  res.json({ reply, conversationId: convId });
});

export default router;
