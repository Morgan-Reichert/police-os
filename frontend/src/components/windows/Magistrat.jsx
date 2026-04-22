import React, { useState, useRef, useEffect, useContext } from 'react';
import { Scale, Send, Loader2, Plus, MessageSquare } from 'lucide-react';
import { api } from '../../utils/api';
import { supabase } from '../../lib/supabase';
import { AuthContext } from '../../App';

export default function Magistrat() {
  const auth = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  const loadList = async () => {
    try { setConversations(await api.listConversations()); } catch {}
  };

  useEffect(() => {
    loadList();

    // Realtime sur les messages (réception IA live)
    const ch = supabase.channel('mag-live')
      .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'magistrat_messages' },
          (payload) => {
            if (payload.new.conversation_id === activeId && payload.new.role === 'assistant') {
              setMsgs((m) => [...m, payload.new]);
            }
          })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [activeId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, loading]);

  const openConversation = async (id) => {
    setActiveId(id);
    if (id) {
      const { messages } = await api.getConversation(id);
      setMsgs(messages);
    } else {
      setMsgs([{
        role: 'assistant',
        content: "Maître Lefèvre, Juge d'instruction. J'accuse réception de votre prise de contact. " +
                 "Formulez votre requête de manière circonstanciée — éléments à charge, qualification pénale envisagée, mesure sollicitée.",
        created_at: new Date().toISOString(),
      }]);
    }
  };

  useEffect(() => { openConversation(null); /* nouvelle conv par défaut */ }, []);

  const send = async () => {
    if (!draft.trim() || loading) return;
    const userMsg = {
      role: 'user', content: draft.trim(),
      created_at: new Date().toISOString(),
    };
    setMsgs((m) => [...m, userMsg]);
    setDraft('');
    setLoading(true);
    try {
      const res = await api.askMagistrat(userMsg.content, activeId);
      setActiveId(res.conversationId);
      // La réponse arrive via realtime, sinon fallback :
      setTimeout(() => {
        setMsgs((m) => m.some((x) => x.content === res.reply)
          ? m
          : [...m, { role: 'assistant', content: res.reply, created_at: new Date().toISOString() }]);
      }, 800);
      loadList();
    } catch (e) {
      setMsgs((m) => [...m, {
        role: 'system', content: `[Erreur : ${e.message}]`,
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const hour = (iso) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="h-full flex bg-bureau-900">
      {/* Sidebar conversations */}
      <div className="w-48 bg-bureau-800 border-r border-bureau-500 flex flex-col">
        <button onClick={() => openConversation(null)}
                className="m-2 px-3 py-2 bg-accent-blue/20 border border-accent-blue/40 text-accent-blue text-xs uppercase hover:bg-accent-blue hover:text-black flex items-center gap-2">
          <Plus size={12} /> Nouvelle requête
        </button>
        <div className="flex-1 overflow-auto">
          {conversations.map((c) => (
            <button key={c.id} onClick={() => openConversation(c.id)}
                    className={`w-full text-left px-3 py-2 text-xs border-b border-bureau-700 hover:bg-bureau-700 truncate
                      ${activeId === c.id ? 'bg-bureau-700 border-l-2 border-l-accent-amber text-white' : 'text-bureau-300'}`}>
              <div className="flex items-center gap-1">
                <MessageSquare size={10} /> <span className="truncate">{c.title}</span>
              </div>
              <div className="text-[9px] text-bureau-400 mt-0.5">
                {new Date(c.updated_at).toLocaleDateString('fr-FR')}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Zone de discussion */}
      <div className="flex-1 flex flex-col">
        <div className="bg-bureau-800 border-b border-bureau-500 p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent-blue/20 border border-accent-blue/40 flex items-center justify-center">
            <Scale className="text-accent-blue" size={20} />
          </div>
          <div>
            <div className="text-sm text-white font-bold">Maître LEFÈVRE</div>
            <div className="text-[11px] text-bureau-300 uppercase tracking-widest">
              Juge d'instruction · <span className="text-accent-green">En ligne</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] text-sm ${
                m.role === 'user'
                  ? 'bg-accent-blue/15 border border-accent-blue/30'
                  : m.role === 'system'
                  ? 'bg-accent-red/10 border border-accent-red/30 text-accent-red italic'
                  : 'bg-bureau-700 border border-bureau-500'
              } px-3 py-2`}>
                <div className="text-[10px] uppercase tracking-widest text-bureau-300 mb-1">
                  {m.role === 'user' ? `${auth?.profile?.grade || 'Vous'} ${auth?.profile?.nom || ''}`
                    : m.role === 'assistant' ? 'Magistrat' : 'SYSTÈME'}
                  <span className="ml-2 normal-case text-bureau-400">{hour(m.created_at)}</span>
                </div>
                <div className="whitespace-pre-wrap text-bureau-300 leading-relaxed">{m.content}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-bureau-300 text-xs">
              <Loader2 size={14} className="animate-spin" /> Le magistrat rédige sa réponse...
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-bureau-500 p-3 bg-bureau-800">
          <div className="flex gap-2">
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(); }}
                      placeholder="Requête (mandat, commission rogatoire...) — Ctrl+Enter"
                      className="flex-1 bg-bureau-900 border border-bureau-500 focus:border-accent-blue outline-none text-sm text-white p-2 min-h-[70px] resize-none font-mono" />
            <button onClick={send} disabled={loading || !draft.trim()}
                    className="self-end px-4 h-10 bg-accent-blue/20 border border-accent-blue/40 text-accent-blue hover:bg-accent-blue hover:text-black disabled:opacity-30 flex items-center gap-2 text-sm uppercase">
              <Send size={14} /> Transmettre
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
