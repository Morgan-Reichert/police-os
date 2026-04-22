import React from 'react';
import { useWindows } from './WindowManager';
import Window from './Window';
import Taskbar from './Taskbar';

export default function Desktop() {
  const { windows, registry, openWindow } = useWindows();

  const desktopIcons = Object.entries(registry).filter(([, a]) => a.onDesktop);

  return (
    <div className="relative h-screen w-screen bg-bureau-900 crt select-none"
         style={{
           backgroundImage:
             'radial-gradient(ellipse at center, rgba(79,195,255,0.04), transparent 70%), linear-gradient(180deg, #0a0e14, #0f141c)',
         }}>

      {/* Bandeau du haut (identification terminal) */}
      <div className="absolute top-0 left-0 right-0 h-6 bg-black/50 border-b border-bureau-500
                      flex items-center justify-between px-3 text-[10px] text-bureau-300 uppercase tracking-widest z-10">
        <span>POLICE NATIONALE // TERMINAL SÉCURISÉ — CLASSIFICATION : CONFIDENTIEL DÉFENSE</span>
        <span className="blink text-accent-green">● CONNEXION SÉCURISÉE</span>
      </div>

      {/* Icônes du bureau */}
      <div className="absolute top-10 left-4 grid grid-cols-1 gap-4">
        {desktopIcons.map(([id, app]) => (
          <button
            key={id}
            onDoubleClick={() => openWindow(id)}
            className="flex flex-col items-center w-20 p-2 rounded hover:bg-white/5 text-xs text-bureau-300 hover:text-white"
          >
            <div className="w-12 h-12 flex items-center justify-center text-accent-blue">
              {app.icon}
            </div>
            <span className="mt-1 text-center leading-tight">{app.title}</span>
          </button>
        ))}
      </div>

      {/* Fenêtres */}
      {windows.map((w) => <Window key={w.id} win={w} />)}

      {/* Barre des tâches */}
      <Taskbar />
    </div>
  );
}
