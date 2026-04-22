import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

/**
 * WindowManager — Contexte global qui gère :
 *  - la liste des fenêtres ouvertes
 *  - leur position / taille
 *  - leur z-index (focus)
 *  - leur état (minimized, maximized)
 *
 * Chaque "app" (BioLab, Interception...) est un type de fenêtre enregistré
 * dans APP_REGISTRY (défini dans App.jsx) et instanciable via openWindow(appId).
 */

const WindowContext = createContext(null);
export const useWindows = () => useContext(WindowContext);

let _idCounter = 1;
const nextId = () => `win-${_idCounter++}`;

export function WindowManagerProvider({ children, registry }) {
  const [windows, setWindows] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const topZ = useRef(100);

  const openWindow = useCallback((appId, props = {}) => {
    const app = registry[appId];
    if (!app) return;

    // Si app singleton déjà ouverte, focus dessus
    if (app.singleton) {
      const existing = windows.find((w) => w.appId === appId);
      if (existing) {
        focusWindow(existing.id);
        return;
      }
    }

    const id = nextId();
    topZ.current += 1;
    const w = {
      id,
      appId,
      title: app.title,
      icon: app.icon,
      x: 80 + ((windows.length * 30) % 200),
      y: 60 + ((windows.length * 30) % 150),
      width: app.width || 720,
      height: app.height || 500,
      z: topZ.current,
      minimized: false,
      maximized: false,
      props,
    };
    setWindows((prev) => [...prev, w]);
    setActiveId(id);
  }, [registry, windows]);

  const closeWindow = useCallback((id) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    setActiveId((cur) => (cur === id ? null : cur));
  }, []);

  const focusWindow = useCallback((id) => {
    topZ.current += 1;
    const z = topZ.current;
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, z, minimized: false } : w))
    );
    setActiveId(id);
  }, []);

  const updateWindow = useCallback((id, patch) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }, []);

  const minimizeWindow = useCallback((id) => {
    updateWindow(id, { minimized: true });
    setActiveId((cur) => (cur === id ? null : cur));
  }, [updateWindow]);

  const toggleMaximize = useCallback((id) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w))
    );
  }, []);

  const value = {
    windows,
    activeId,
    registry,
    openWindow,
    closeWindow,
    focusWindow,
    updateWindow,
    minimizeWindow,
    toggleMaximize,
  };

  return (
    <WindowContext.Provider value={value}>
      {children}
    </WindowContext.Provider>
  );
}
