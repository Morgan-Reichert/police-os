import React, { useState } from 'react';
import { Shield, Loader2 } from 'lucide-react';

export default function Login({ auth }) {
  const [mode, setMode] = useState('signin'); // or 'signup'
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [nom, setNom] = useState('');
  const [badge, setBadge] = useState('');
  const [grade, setGrade] = useState('Inspecteur');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      const { error } = mode === 'signin'
        ? await auth.signIn(email, pwd)
        : await auth.signUp(email, pwd, { nom, badge, grade });
      if (error) throw error;
    } catch (e) {
      setErr(e.message || 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-bureau-900 crt flex items-center justify-center relative"
         style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(79,195,255,0.05), transparent 70%)' }}>
      <div className="absolute top-0 left-0 right-0 h-6 bg-black/50 border-b border-bureau-500
                      flex items-center px-3 text-[10px] text-bureau-300 uppercase tracking-widest">
        <span>POLICE NATIONALE // TERMINAL SÉCURISÉ — AUTHENTIFICATION REQUISE</span>
      </div>

      <form onSubmit={submit}
            className="w-[380px] bg-bureau-800 border border-bureau-500 shadow-win">
        <div className="px-5 py-4 border-b border-bureau-500 flex items-center gap-3">
          <Shield className="text-accent-blue" size={22} />
          <div>
            <div className="text-white font-bold uppercase tracking-widest text-sm">Accès Terminal</div>
            <div className="text-[10px] text-bureau-300">Identification obligatoire</div>
          </div>
        </div>

        <div className="p-5 space-y-3">
          {mode === 'signup' && (
            <>
              <Field label="Nom" value={nom} onChange={setNom} />
              <Field label="N° de badge" value={badge} onChange={setBadge} />
              <div>
                <label className="block text-[10px] text-bureau-300 uppercase tracking-widest mb-1">Grade</label>
                <select value={grade} onChange={(e) => setGrade(e.target.value)}
                        className="w-full bg-bureau-900 border border-bureau-500 px-2 py-2 text-sm text-white focus:border-accent-blue outline-none">
                  <option>Gardien de la paix</option>
                  <option>Brigadier</option>
                  <option>Inspecteur</option>
                  <option>Commandant</option>
                  <option>Commissaire</option>
                </select>
              </div>
            </>
          )}
          <Field label="Email" type="email" value={email} onChange={setEmail} />
          <Field label="Code d'accès" type="password" value={pwd} onChange={setPwd} />

          {err && <div className="text-xs text-accent-red border-l-2 border-accent-red pl-2">{err}</div>}

          <button disabled={busy}
                  className="w-full py-2 bg-accent-blue/20 border border-accent-blue text-accent-blue
                             hover:bg-accent-blue hover:text-black uppercase text-sm tracking-widest
                             disabled:opacity-40 flex items-center justify-center gap-2">
            {busy && <Loader2 size={14} className="animate-spin" />}
            {mode === 'signin' ? 'Se connecter' : 'Créer un compte'}
          </button>

          <button type="button"
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="w-full text-[11px] text-bureau-300 hover:text-white underline">
            {mode === 'signin'
              ? 'Premier accès ? Créer un compte enquêteur'
              : 'Déjà inscrit ? Se connecter'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-[10px] text-bureau-300 uppercase tracking-widest mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
             className="w-full bg-bureau-900 border border-bureau-500 px-2 py-2 text-sm text-white focus:border-accent-blue outline-none font-mono" />
    </div>
  );
}
