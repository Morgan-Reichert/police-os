import React, { useEffect, useRef } from 'react';
import { Power, LogOut } from 'lucide-react';
import { useWindows } from './WindowManager';

export default function StartMenu({ onClose }) {
  const { registry, openWindow } = useWindows();
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [onClose]);

  const handleLaunch = (id) => {
    openWindow(id);
    onClose();
  };

  return (
    <div ref={ref}
         className="absolute bottom-11 left-0 w-72 bg-bureau-800 border border-bureau-500 shadow-win z-[9999]">
      <div className="px-4 py-3 bg-gradient-to-r from-accent-blue/30 to-transparent border-b border-bureau-500">
        <div className="text-xs text-bureau-300 uppercase tracking-wider">Session</div>
        <div className="text-white font-bold">INSP. MARTIN — ID 4472</div>
      </div>

      <div className="py-1">
        {Object.entries(registry).map(([id, app]) => (
          <button
            key={id}
            onClick={() => handleLaunch(id)}
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-bureau-600 text-left"
          >
            <span className="text-accent-blue">{app.icon}</span>
            <div>
              <div className="text-sm text-white">{app.title}</div>
              {app.description && (
                <div className="text-[10px] text-bureau-300 uppercase">{app.description}</div>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="border-t border-bureau-500 py-1">
        <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-bureau-600 text-left text-sm text-bureau-300">
          <LogOut size={16} /> Déconnexion
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-accent-red/30 text-left text-sm text-bureau-300">
          <Power size={16} /> Arrêter le terminal
        </button>
      </div>
    </div>
  );
}
