import React, { useState, useEffect } from 'react';
import { Lock, Upload, Trash2, Fingerprint, Radio, ShieldAlert } from 'lucide-react';
import { api } from '../../utils/api';

export default function AdminPanel() {
  const [auth, setAuth] = useState(false);
  const [user, setUser] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState(null);

  if (!auth) {
    return (
      <div className="h-full flex items-center justify-center bg-bureau-900">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setErr(null);
            try {
              await api.adminLogin(user, pwd);
              setAuth(true);
            } catch {
              setErr('Identifiants refusés.');
            }
          }}
          className="w-80 border border-accent-red/40 bg-black/60 p-6"
        >
          <div className="flex items-center gap-2 text-accent-red uppercase text-xs tracking-widest mb-4">
            <ShieldAlert size={16} /> Zone restreinte — MJ uniquement
          </div>
          <label className="block text-xs text-bureau-300 mb-1">IDENTIFIANT</label>
          <input
            value={user} onChange={(e) => setUser(e.target.value)}
            className="w-full bg-bureau-800 border border-bureau-500 px-2 py-1 text-sm mb-3 outline-none focus:border-accent-blue"
          />
          <label className="block text-xs text-bureau-300 mb-1">CODE D'ACCÈS</label>
          <input
            type="password" value={pwd} onChange={(e) => setPwd(e.target.value)}
            className="w-full bg-bureau-800 border border-bureau-500 px-2 py-1 text-sm mb-3 outline-none focus:border-accent-blue"
          />
          {err && <div className="text-xs text-accent-red mb-2">{err}</div>}
          <button className="w-full bg-accent-red/20 border border-accent-red text-accent-red py-2 text-sm uppercase hover:bg-accent-red hover:text-white">
            <Lock size={14} className="inline mr-1" /> Authentifier
          </button>
        </form>
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const [tab, setTab] = useState('fingerprints');
  const [data, setData] = useState({ fingerprints: [], wiretaps: [] });

  const refresh = () => api.adminListAll().then(setData);
  useEffect(() => { refresh(); }, []);

  return (
    <div className="h-full flex flex-col bg-bureau-900">
      <div className="bg-accent-red/10 border-b border-accent-red/30 px-4 py-2 text-xs uppercase tracking-widest text-accent-red">
        ⚠ Panel MJ — Toute modification est journalisée
      </div>

      <div className="flex border-b border-bureau-500">
        {[
          { id: 'fingerprints', label: 'Empreintes cibles', icon: <Fingerprint size={14} /> },
          { id: 'wiretaps', label: 'Écoutes', icon: <Radio size={14} /> },
        ].map((t) => (
          <button key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-2 text-xs uppercase tracking-widest flex items-center gap-2
                    ${tab === t.id ? 'bg-bureau-700 text-accent-blue border-b-2 border-accent-blue'
                                    : 'text-bureau-300 hover:bg-bureau-700'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {tab === 'fingerprints' && (
          <FingerprintsManager items={data.fingerprints} onChange={refresh} />
        )}
        {tab === 'wiretaps' && (
          <WiretapsManager items={data.wiretaps} onChange={refresh} />
        )}
      </div>
    </div>
  );
}

function FingerprintsManager({ items, onChange }) {
  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState({ nom: '', prenom: '', fiche: '', naissance: '', antecedents: '', notes: '' });
  const [busy, setBusy] = useState(false);

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    try {
      await api.adminUploadFingerprint(file, meta);
      setFile(null);
      setMeta({ nom: '', prenom: '', fiche: '', naissance: '', antecedents: '', notes: '' });
      onChange();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-[1fr_300px] gap-4">
      <div>
        <div className="text-xs uppercase tracking-widest text-bureau-300 mb-2">Empreintes en base ({items.length})</div>
        <table className="w-full text-xs border border-bureau-500">
          <thead className="bg-bureau-800 text-bureau-300 uppercase">
            <tr>
              <th className="text-left p-2">Fichier</th>
              <th className="text-left p-2">Suspect</th>
              <th className="text-left p-2">Fiche</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t border-bureau-500 hover:bg-bureau-800">
                <td className="p-2 font-mono text-accent-green">{it.filename}</td>
                <td className="p-2 text-white">{it.nom} {it.prenom}</td>
                <td className="p-2 text-bureau-300">{it.fiche || '—'}</td>
                <td>
                  <button onClick={async () => { await api.adminDelete('fingerprint', it.id); onChange(); }}
                          className="text-accent-red hover:bg-accent-red/20 p-1">
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan="4" className="p-4 text-center text-bureau-400">Base vide</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={upload} className="border border-bureau-500 bg-bureau-800 p-3 space-y-2">
        <div className="text-xs uppercase tracking-widest text-accent-blue mb-2">+ Nouvelle empreinte</div>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0])}
               className="text-xs w-full" />
        {['nom', 'prenom', 'fiche', 'naissance', 'antecedents', 'notes'].map((f) => (
          <input key={f} placeholder={f.toUpperCase()}
                 value={meta[f]}
                 onChange={(e) => setMeta({ ...meta, [f]: e.target.value })}
                 className="w-full bg-bureau-900 border border-bureau-500 px-2 py-1 text-xs outline-none focus:border-accent-blue" />
        ))}
        <button disabled={!file || busy}
                className="w-full py-2 bg-accent-blue/20 border border-accent-blue text-accent-blue text-xs uppercase hover:bg-accent-blue hover:text-black disabled:opacity-40">
          <Upload size={12} className="inline mr-1" /> {busy ? 'Envoi...' : 'Indexer'}
        </button>
      </form>
    </div>
  );
}

function WiretapsManager({ items, onChange }) {
  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState({ suspect: '', ligne: '', date: '', duree: '', mandat: '', transcription: '' });
  const [busy, setBusy] = useState(false);

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    try {
      await api.adminUploadWiretap(file, meta);
      setFile(null);
      setMeta({ suspect: '', ligne: '', date: '', duree: '', mandat: '', transcription: '' });
      onChange();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-[1fr_320px] gap-4">
      <div>
        <div className="text-xs uppercase tracking-widest text-bureau-300 mb-2">Écoutes en base ({items.length})</div>
        <table className="w-full text-xs border border-bureau-500">
          <thead className="bg-bureau-800 text-bureau-300 uppercase">
            <tr>
              <th className="text-left p-2">Suspect</th>
              <th className="text-left p-2">Ligne</th>
              <th className="text-left p-2">Fichier</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t border-bureau-500 hover:bg-bureau-800">
                <td className="p-2 text-white">{it.suspect}</td>
                <td className="p-2 font-mono text-accent-amber">{it.ligne}</td>
                <td className="p-2 font-mono text-accent-green">{it.filename}</td>
                <td>
                  <button onClick={async () => { await api.adminDelete('wiretap', it.id); onChange(); }}
                          className="text-accent-red hover:bg-accent-red/20 p-1">
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan="4" className="p-4 text-center text-bureau-400">Aucune écoute</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={upload} className="border border-bureau-500 bg-bureau-800 p-3 space-y-2">
        <div className="text-xs uppercase tracking-widest text-accent-blue mb-2">+ Nouvelle écoute</div>
        <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0])}
               className="text-xs w-full" />
        {[
          ['suspect', 'SUSPECT'],
          ['ligne', 'LIGNE (ex: 06 12 34 56 78)'],
          ['date', 'DATE CAPTATION'],
          ['duree', 'DURÉE (mm:ss)'],
          ['mandat', 'N° MANDAT'],
        ].map(([k, l]) => (
          <input key={k} placeholder={l} value={meta[k]}
                 onChange={(e) => setMeta({ ...meta, [k]: e.target.value })}
                 className="w-full bg-bureau-900 border border-bureau-500 px-2 py-1 text-xs outline-none focus:border-accent-blue" />
        ))}
        <textarea placeholder="TRANSCRIPTION (optionnel)" value={meta.transcription}
                  onChange={(e) => setMeta({ ...meta, transcription: e.target.value })}
                  className="w-full bg-bureau-900 border border-bureau-500 px-2 py-1 text-xs h-20 outline-none focus:border-accent-blue" />
        <button disabled={!file || busy}
                className="w-full py-2 bg-accent-blue/20 border border-accent-blue text-accent-blue text-xs uppercase hover:bg-accent-blue hover:text-black disabled:opacity-40">
          <Upload size={12} className="inline mr-1" /> {busy ? 'Envoi...' : 'Mettre en ligne'}
        </button>
      </form>
    </div>
  );
}
