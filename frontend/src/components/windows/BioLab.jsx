import React, { useState, useRef } from 'react';
import { Upload, Fingerprint, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { api } from '../../utils/api';

const STATES = { IDLE: 'idle', SCANNING: 'scanning', MATCH: 'match', NOMATCH: 'nomatch', ERROR: 'error' };

export default function BioLab() {
  const [state, setState] = useState(STATES.IDLE);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const inputRef = useRef(null);

  const addLog = (msg) => setLogs((l) => [...l, { t: new Date().toLocaleTimeString('fr-FR'), msg }]);

  const handleFile = async (file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setLogs([]);
    setState(STATES.SCANNING);
    addLog(`> Chargement du scellé « ${file.name} »`);
    addLog('> Initialisation du module AFIS-4...');

    // Simulation de scan (durée variable réaliste)
    const scanDelay = 2200 + Math.random() * 1500;
    await new Promise((r) => setTimeout(r, 700));
    addLog('> Extraction des points caractéristiques (minuties)...');
    await new Promise((r) => setTimeout(r, 700));
    addLog('> Requête base centrale FAED...');

    try {
      const res = await api.compareFingerprint(file);
      await new Promise((r) => setTimeout(r, Math.max(0, scanDelay - 1400)));
      if (res.match) {
        addLog(`> CORRESPONDANCE : ${res.suspect.nom} (${res.score}% confiance)`);
        setResult(res.suspect);
        setState(STATES.MATCH);
      } else {
        addLog('> Aucune correspondance dans la base.');
        setState(STATES.NOMATCH);
      }
    } catch (e) {
      addLog(`! ERREUR : ${e.message}`);
      setState(STATES.ERROR);
    }
  };

  const reset = () => {
    setState(STATES.IDLE);
    setPreview(null);
    setResult(null);
    setLogs([]);
  };

  return (
    <div className="h-full grid grid-cols-2 gap-px bg-bureau-500">
      {/* Panneau gauche : image */}
      <div className="bg-bureau-900 p-4 flex flex-col">
        <div className="text-xs uppercase tracking-widest text-bureau-300 mb-2">
          ■ Pièce à conviction — Scellé
        </div>
        <div className="flex-1 relative border border-dashed border-bureau-500 bg-black/50 flex items-center justify-center overflow-hidden">
          {!preview ? (
            <button
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center gap-2 text-bureau-300 hover:text-accent-blue p-8"
            >
              <Upload size={40} />
              <span className="text-sm uppercase">Téléverser une empreinte</span>
              <span className="text-xs">.png / .jpg / .bmp</span>
            </button>
          ) : (
            <>
              <img src={preview} alt="scellé" className="max-h-full max-w-full object-contain" />
              {state === STATES.SCANNING && <div className="scan-line" />}
              {state === STATES.SCANNING && (
                <div className="absolute inset-0 bg-accent-green/5 pointer-events-none" />
              )}
              {state === STATES.MATCH && (
                <div className="absolute inset-0 ring-2 ring-accent-green pointer-events-none" />
              )}
              {state === STATES.NOMATCH && (
                <div className="absolute inset-0 ring-2 ring-accent-red pointer-events-none" />
              )}
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/bmp"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
        {preview && (
          <button onClick={reset}
                  className="mt-3 self-start text-xs text-bureau-300 hover:text-white underline">
            Nouveau scellé
          </button>
        )}
      </div>

      {/* Panneau droit : statut / résultat */}
      <div className="bg-bureau-900 p-4 flex flex-col">
        <div className="text-xs uppercase tracking-widest text-bureau-300 mb-2">
          ■ Résultat de l'analyse AFIS
        </div>

        <div className="border border-bureau-500 bg-black/50 flex-1 p-4 flex flex-col">
          {state === STATES.IDLE && (
            <div className="m-auto text-center text-bureau-300">
              <Fingerprint size={48} className="mx-auto mb-2 opacity-40" />
              <div className="text-sm">En attente d'un scellé...</div>
            </div>
          )}

          {state === STATES.SCANNING && (
            <div className="m-auto text-center">
              <Loader2 size={40} className="mx-auto mb-2 text-accent-amber animate-spin" />
              <div className="text-accent-amber uppercase tracking-widest blink">Analyse en cours</div>
            </div>
          )}

          {state === STATES.MATCH && result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-accent-green text-lg font-bold uppercase glitch">
                <CheckCircle2 /> MATCH FOUND
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-y-1 text-sm border-t border-bureau-500 pt-2">
                <div className="text-bureau-300">Nom :</div><div className="text-white">{result.nom}</div>
                <div className="text-bureau-300">Prénom :</div><div className="text-white">{result.prenom || '—'}</div>
                <div className="text-bureau-300">Fiché :</div><div className="text-white">{result.fiche || '—'}</div>
                <div className="text-bureau-300">Date naiss. :</div><div className="text-white">{result.naissance || '—'}</div>
                <div className="text-bureau-300">Antécédents :</div>
                <div className="text-accent-red">{result.antecedents || 'N/A'}</div>
                <div className="text-bureau-300">Score :</div>
                <div className="text-accent-green">{result.score || 97}%</div>
              </div>
              {result.notes && (
                <div className="mt-2 p-2 bg-bureau-800 text-xs border-l-2 border-accent-amber">
                  <span className="text-accent-amber">NOTE MJ :</span> {result.notes}
                </div>
              )}
            </div>
          )}

          {state === STATES.NOMATCH && (
            <div className="m-auto text-center">
              <XCircle size={40} className="mx-auto mb-2 text-accent-red" />
              <div className="text-accent-red text-lg font-bold uppercase">NO MATCH</div>
              <div className="text-bureau-300 text-xs mt-1">
                Aucune correspondance dans les 48 M d'empreintes indexées.
              </div>
            </div>
          )}

          {state === STATES.ERROR && (
            <div className="m-auto text-accent-red">Erreur système. Contactez l'assistance.</div>
          )}
        </div>

        {/* Console logs */}
        <div className="mt-3 h-32 border border-bureau-500 bg-black p-2 text-[11px] overflow-auto">
          {logs.length === 0 && <div className="text-bureau-400">[console AFIS — prêt]</div>}
          {logs.map((l, i) => (
            <div key={i} className="text-accent-green">
              <span className="text-bureau-400">[{l.t}]</span> {l.msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
