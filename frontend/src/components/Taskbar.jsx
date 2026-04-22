import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { useWindows } from './WindowManager';
import StartMenu from './StartMenu';

export default function Taskbar() {
  const { windows, activeId, focusWindow, minimizeWindow } = useWindows();
  const [showStart, setShowStart] = useState(false);
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const i = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const fmt = (d) =>
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
    ' · ' +
    d.toLocaleDateString('fr-FR');

  return (
    <>
      {showStart && <StartMenu onClose={() => setShowStart(false)} />}
      <div className="absolute bottom-0 left-0 right-0 h-11 bg-bureau-800 border-t border-bureau-500
                      flex items-center px-1 gap-1 z-[9999]">
        {/* Start */}
        <button
          onClick={() => setShowStart((s) => !s)}
          className={`h-9 px-3 flex items-center gap-2 text-sm font-bold uppercase
            ${showStart ? 'bg-accent-blue/20 text-accent-blue' : 'text-bureau-300 hover:bg-bureau-600'}`}
        >
          <Shield size={16} /> DÉMARRER
        </button>

        <div className="h-6 w-px bg-bureau-500 mx-1" />

        {/* Tabs fenêtres */}
        <div className="flex-1 flex items-center gap-1 overflow-x-auto">
          {windows.map((w) => (
            <button
              key={w.id}
              onClick={() => w.minimized || activeId !== w.id ? focusWindow(w.id) : minimizeWindow(w.id)}
              className={`h-8 max-w-[200px] px-3 flex items-center gap-2 text-xs border truncate
                ${activeId === w.id && !w.minimized
                  ? 'bg-bureau-600 border-accent-blue/60 text-white'
                  : 'bg-bureau-700 border-bureau-500 text-bureau-300 hover:bg-bureau-600'}`}
            >
              <span className="text-accent-blue shrink-0">{w.icon}</span>
              <span className="truncate">{w.title}</span>
            </button>
          ))}
        </div>

        {/* Horloge */}
        <div className="h-9 px-3 flex items-center text-xs text-bureau-300 border-l border-bureau-500">
          {fmt(clock)}
        </div>
      </div>
    </>
  );
}
