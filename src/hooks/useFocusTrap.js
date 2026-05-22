import { useEffect, useRef } from 'react';

/**
 * Hook de accesibilidad que encierra el foco del teclado dentro de un
 * contenedor mientras un modal está abierto (focus trap).
 *
 * - Al abrirse: enfoca el primer elemento interactivo del contenedor.
 * - Tab / Shift+Tab ciclan dentro del contenedor sin salir al documento.
 * - Al cerrarse: restaura el foco al elemento que lo tenía antes.
 *
 * @param {boolean} isOpen - Indica si el modal/diálogo está visible.
 * @returns {React.RefObject} containerRef - Ref para el elemento raíz del contenedor.
 */

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function useFocusTrap(isOpen) {
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement;

    const container = containerRef.current;
    if (!container) return;

    const getFocusable = () =>
      Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS)).filter(
        (el) => !el.closest('[hidden]') && el.offsetParent !== null
      );

    const focusFirst = () => {
      const els = getFocusable();
      if (els.length > 0) els[0].focus();
    };

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      const els = getFocusable();
      if (els.length === 0) { e.preventDefault(); return; }

      const first = els[0];
      const last = els[els.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    const rafId = requestAnimationFrame(focusFirst);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  return containerRef;
}
