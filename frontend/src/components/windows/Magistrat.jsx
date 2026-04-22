import React, { useState, useRef, useEffect } from 'react';
import { Scale, Send, Loader2 } from 'lucide-react';
import { api } from '../../utils/api';

export default function Magistrat() {
  const [msgs, setMsgs] = useState([
    {
      from: 'magistrat',
      at: new Date().toISOString(),
      text:
        "Maître Lefèvre, Juge d'instruction au TJ. J'accuse réception de votre prise de contact. " +
        "Formulez votre requête de manière circonstanciée — éléments à charge, qualification pénale envisagée, mesure sollicitée.",
    },
  ]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, loading]);

  const send = async () => {
    if (!draft.trim() || loading) return;
    const userMsg = { from: 'enqueteur', at: new Date().toISOString(), text: draft.trim() };
    const next = [...msgs, userMsg];
    setMsgs(next);
    setDraft('');
    setLoading(true);
    try {
      const res = await api.askMagistrat(
        userMsg.text,
        next.filter((m) => m.from !== 'system').map((m) => ({
          role: m.from === 'enqueteur' ? 'user' : 'assistant',
          content: m.text,
        }))
      );
      setMsgs((m) => [...m, { from: 'magistrat', at: new Date().toISOString(), text: res.reply }]);
    } catch (e) {
      setMsgs((m) => [...m, {
        from: 'system',
        at: new Date().toISOString(),
        text: `[Erreur transmission au parquet : ${e.message}]`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const hour = (iso) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="h-full flex flex-col bg-bureau-900">
      {/* En-tête */}
      <div className="bg-bureau-800 border-b border-bureau-500 p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent-blue/20 border border-accent-blue/40 flex items-center justify-center">
          <Scale className="text-accent-blue" size={20} />
        </div>
        <div>
          <div className="text-sm text-white font-bold">Maître LEFÈVRE</div>
          <div className="text-[11px] text-bureau-300 uppercase tracking-widest">
            Juge d'instruction · Tribunal Judiciaire · <span className="text-accent-green">En ligne</span>
          </div>
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {msgs.map((m, i) => (
          <div key={i}
               className={`flex ${m.from === 'enqueteur' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] text-sm ${
              m.from === 'enqueteur'
                ? 'bg-accent-blue/15 border border-accent-blue/30'
                : m.from === 'system'
                ? 'bg-accent-red/10 border border-accent-red/30 text-accent-red italic'
                : 'bg-bureau-700 border border-bureau-500'
            } px-3 py-2`}>
              <div className="text-[10px] uppercase tracking-widest text-bureau-300 mb-1">
                {m.from === 'enqueteur' ? 'Vous — Inspecteur' : m.from === 'magistrat' ? 'Magistrat' : 'SYSTÈME'}
                <span className="ml-2 normal-case text-bureau-400">{hour(m.at)}</span>
              </div>
              <div className="whitespace-pre-wrap text-bureau-300 leading-relaxed">{m.text}</div>
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

      {/* Composer */}
      <div className="border-t border-bureau-500 p-3 bg-bureau-800">
        <div className="flex gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(); }}
            placeholder="Formulez votre demande (mandat, commission rogatoire, prolongation de garde à vue...) — Ctrl+Enter pour envoyer"
            className="flex-1 bg-bureau-900 border border-bureau-500 focus:border-accent-blue outline-none
                       text-sm text-white p-2 min-h-[70px] resize-none font-mono"
          />
          <button
            onClick={send}
            disabled={loading || !draft.trim()}
            className="self-end px-4 h-10 bg-accent-blue/20 border border-accent-blue/40 text-accent-blue
                       hover:bg-accent-blue hover:text-black disabled:opacity-30 flex items-center gap-2 text-sm uppercase"
          >
            <Send size={14} /> Transmettre
          </button>
        </div>
      </div>
    </div>
  );
}
