/**
 * useModalRegistry
 *
 * Proveedor del contexto de pila global de modales abiertos.
 * Cada modal se registra vía useModalBackHandler cuando abre,
 * y se desregistra al cerrar. La pila sigue orden LIFO.
 *
 * Exporta:
 * - ModalRegistryProvider: envuelve el árbol de la app (App.jsx)
 */

import React, { useRef, useCallback, useMemo } from 'react';
import { ModalRegistryContext } from './useModalBackHandler';

export function ModalRegistryProvider({ children }) {
  const stackRef = useRef([]);

  // Agrega un handler al tope de la pila
  const push = useCallback((handler) => {
    stackRef.current = [...stackRef.current, handler];
  }, []);

  // Elimina un handler específico de la pila
  const pop = useCallback((handler) => {
    stackRef.current = stackRef.current.filter(h => h !== handler);
  }, []);

  const value = useMemo(() => ({ push, pop, stackRef }), [push, pop]);

  return (
    <ModalRegistryContext.Provider value={value}>
      {children}
    </ModalRegistryContext.Provider>
  );
}
