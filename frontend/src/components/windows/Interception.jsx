import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Radio, Clock, Phone } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import { api } from '../../utils/api';
import { supabase } from '../../lib/supabase';

export default function Interception() {
  const [wiretaps, setWiretaps] = useState([]);
  const [selected, setSelected] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const waveRef = useRef(null);
  const wsRef = useRef(null);

  // Chargement initial + realtime
  useEffect(() => {
    let mounted = true;
    api.listWiretaps().then((d) => mounted && setWiretaps(d)).catch(() => {});

    const channel = supabase
      .channel('wiretaps-live')
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'wiretaps' },
          () => api.listWiretaps().then((d) => mounted && setWiretaps(d)))
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  // Crée le waveform à chaque sélection
  useEffect(() => {
    if (!selected || !waveRef.current) return;
    wsRef.current?.destroy();

    (async () => {
      const { url } = await api.getSignedWiretapUrl(selected.id);
      const ws = WaveSurfer.create({
        container: waveRef.current,
        waveColor: '#3d4a5c',
        progressColor: '#00ff9c',
        cursorColor: '#ffb020',
        height: 80,
        barWidth: 2,
        barGap: 1,
        url,
      });
      ws.on('play', () => setPlaying(true));
      ws.on('pause', () => setPlaying(false));
      ws.on('finish', () => setPlaying(false));
      ws.on('audioprocess', (t) => setCurrentTime(t));
      ws.on('seek', (t) => setCurrentTime(t));
      wsRef.current = ws;
    })();

    return () => wsRef.current?.destroy();
  }, [selected]);

  const fmt = (s) => {
    if (!s) return '00:00';
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <div className="h-full grid grid-cols-[280px_1fr] gap-px bg-bureau-500">
      <div className="bg-bureau-900 overflow-auto">
        <div className="px-3 py-2 bg-bureau-800 text-xs uppercase tracking-widest text-bureau-300 border-b border-bureau-500">
          Lignes sous surveillance ({wiretaps.length})
        </div>
        {wiretaps.length === 0 && (
          <div className="p-4 text-xs text-bureau-300">Aucune écoute active.</div>
        )}
        {wiretaps.map((w) => (
          <button key={w.id} onClick={() => setSelected(w)}
                  className={`w-full text-left px-3 py-2 border-b border-bureau-700 hover:bg-bureau-700
                    ${selected?.id === w.id ? 'bg-bureau-600 border-l-2 border-l-accent-amber' : ''}`}>
            <div className="flex items-center gap-2 text-sm text-white">
              <Radio size={12} className="text-accent-red blink" /> {w.suspect}
            </div>
            <div className="text-[11px] text-bureau-300 flex items-center gap-1 mt-1">
              <Phone size={10} /> {w.ligne}
            </div>
            <div className="text-[10px] text-bureau-400 flex items-center gap-1 mt-1">
              <Clock size={10} /> {w.date_captation || '—'} · {w.duree || '—'}
            </div>
          </button>
        ))}
      </div>

      <div className="bg-bureau-900 p-4 flex flex-col">
        {!selected ? (
          <div className="m-auto text-center text-bureau-300">
            <Radio size={48} className="mx-auto mb-2 opacity-40" />
            <div className="text-sm">Sélectionnez une ligne sur écoute</div>
          </div>
        ) : (
          <>
            <div className="border border-bureau-500 bg-black/40 p-3 mb-3">
              <div className="text-xs uppercase tracking-widest text-accent-amber mb-2">
                ■ Écoute interceptée
              </div>
              <div className="grid grid-cols-[110px_1fr] gap-y-1 text-sm">
                <div className="text-bureau-300">Cible :</div><div className="text-white font-bold">{selected.suspect}</div>
                <div className="text-bureau-300">Ligne :</div><div className="text-white font-mono">{selected.ligne}</div>
                <div className="text-bureau-300">Captation :</div><div className="text-white">{selected.date_captation || '—'}</div>
                <div className="text-bureau-300">Durée :</div><div className="text-white">{selected.duree || '—'}</div>
                <div className="text-bureau-300">Autorisation :</div>
                <div className="text-accent-green">Mandat n° {selected.mandat || '—'}</div>
              </div>
            </div>

            <div className="border border-bureau-500 bg-black p-3 flex-1">
              <div ref={waveRef} className="mb-3" />
              <div className="flex items-center gap-3">
                <button onClick={() => wsRef.current?.playPause()}
                        className="w-12 h-12 rounded-full bg-accent-amber text-black flex items-center justify-center hover:bg-accent-amber/80">
                  {playing ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                </button>
                <div className="font-mono text-accent-green text-lg">
                  {fmt(currentTime)} / {selected.duree || '—'}
                </div>
                {playing && (
                  <div className="ml-auto flex items-center gap-2 text-xs text-accent-red uppercase">
                    <Radio size={12} className="blink" /> CAPTATION EN COURS
                  </div>
                )}
              </div>
              {selected.transcription && (
                <div className="mt-4 p-3 bg-bureau-800 text-xs border-l-2 border-accent-blue max-h-40 overflow-auto">
                  <div className="text-accent-blue uppercase mb-1">Transcription</div>
                  <pre className="whitespace-pre-wrap text-bureau-300 font-mono">{selected.transcription}</pre>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
