import React, { useRef } from 'react';
import { X, Minus, Square, Maximize2 } from 'lucide-react';
import { useDraggable } from '../hooks/useDraggable';
import { useWindows } from './WindowManager';

export default function Window({ win }) {
  const {
    registry, activeId,
    closeWindow, focusWindow, updateWindow,
    minimizeWindow, toggleMaximize,
  } = useWindows();

  const handleRef = useRef(null);
  const AppComponent = registry[win.appId].component;
  const isActive = activeId === win.id;

  useDraggable({
    handleRef,
    getPosition: () => ({ x: win.x, y: win.y }),
    onMove: (x, y) => updateWindow(win.id, { x, y }),
    onStart: () => focusWindow(win.id),
    disabled: win.maximized,
  });

  if (win.minimized) return null;

  const style = win.maximized
    ? { top: 0, left: 0, width: '100%', height: 'calc(100% - 44px)', zIndex: win.z }
    : { top: win.y, left: win.x, width: win.width, height: win.height, zIndex: win.z };

  return (
    <div
      className={`absolute flex flex-col bg-bureau-800 shadow-win rounded-sm overflow-hidden border
        ${isActive ? 'border-accent-blue/60' : 'border-bureau-500'}`}
      style={style}
      onMouseDown={() => focusWindow(win.id)}
    >
      {/* Title bar */}
      <div
        ref={handleRef}
        className={`flex items-center justify-between h-8 px-2 select-none cursor-grab active:cursor-grabbing
          ${isActive ? 'bg-bureau-600' : 'bg-bureau-700'}`}
        onDoubleClick={() => toggleMaximize(win.id)}
      >
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
          <span className="text-accent-blue">{win.icon}</span>
          <span className={isActive ? 'text-white' : 'text-bureau-300'}>
            {win.title}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}
            className="w-6 h-6 flex items-center justify-center hover:bg-bureau-500 text-bureau-300"
          >
            <Minus size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); toggleMaximize(win.id); }}
            className="w-6 h-6 flex items-center justify-center hover:bg-bureau-500 text-bureau-300"
          >
            {win.maximized ? <Square size={12} /> : <Maximize2 size={12} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
            className="w-6 h-6 flex items-center justify-center hover:bg-accent-red text-bureau-300 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-bureau-900 relative">
        <AppComponent {...win.props} winId={win.id} />
      </div>
    </div>
  );
}
