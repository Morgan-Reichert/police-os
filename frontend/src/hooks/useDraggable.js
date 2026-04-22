import { useEffect, useRef } from 'react';

/**
 * useDraggable — attache un listener mousedown sur une poignée (handleRef)
 * et met à jour la position via onMove(newX, newY).
 *
 * - bounds : { maxX, maxY } pour clamp dans la zone du desktop
 * - disabled : désactive le drag (ex. fenêtre maximisée)
 */
export function useDraggable({ handleRef, getPosition, onMove, onStart, disabled }) {
  const dragState = useRef(null);

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle || disabled) return;

    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      const { x, y } = getPosition();
      dragState.current = {
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startX: x,
        startY: y,
      };
      onStart?.();
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    };

    const onMouseMove = (e) => {
      const s = dragState.current;
      if (!s) return;
      const nx = s.startX + (e.clientX - s.startMouseX);
      const ny = s.startY + (e.clientY - s.startMouseY);
      // Clamp : la titlebar doit rester visible
      const clampedX = Math.max(-200, Math.min(window.innerWidth - 80, nx));
      const clampedY = Math.max(0, Math.min(window.innerHeight - 60, ny));
      onMove(clampedX, clampedY);
    };

    const onMouseUp = () => {
      dragState.current = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    handle.addEventListener('mousedown', onMouseDown);
    return () => {
      handle.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [handleRef, getPosition, onMove, onStart, disabled]);
}
