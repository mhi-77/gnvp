/**
 * useModalBackHandler
 *
 * Hook que registra un modal en la pila global de cierre por "atrás".
 * Cuando el usuario presiona el botón "atrás" del dispositivo/navegador,
 * el sistema cierra el modal más recientemente abierto (LIFO).
 *
 * Requiere ModalRegistryProvider montado en App.jsx.
 *
 * @param {boolean} isOpen  - Estado de visibilidad del modal.
 * @param {function} onClose - Función que cierra el modal.
 */

import { useEffect, useContext, createContext, useRef } from 'react';

export const ModalRegistryContext = createContext(null);

export function useModalBackHandler(isOpen, onClose) {
  const ctx = useContext(ModalRegistryContext);

  // Referencia estable a onClose para evitar registros duplicados
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!ctx) return;

    if (isOpen) {
      const handler = () => onCloseRef.current();
      ctx.push(handler);
      return () => ctx.pop(handler);
    }
  }, [isOpen, ctx]);
}
