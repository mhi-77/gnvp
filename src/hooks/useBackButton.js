/**
 * useBackButton
 *
 * Intercepta el botón "Atrás" del navegador/dispositivo en GINOVA.
 *
 * Prioridad de acciones:
 * 1. Sin usuario autenticado → ignorar (deja salir de la app)
 * 2. Con modal abierto → cerrar el modal superior (LIFO)
 * 3. Sidebar cerrado → abrir sidebar
 * 4. Sidebar abierto → mostrar modal de confirmación de cierre de sesión
 *
 * Cubre dos contextos:
 * - Chrome desktop y Android: via evento popstate
 * - PWA instalada en Android: via Navigation API (window.navigation)
 */

import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { ModalRegistryContext } from './useModalBackHandler';

const useBackButton = (onFirstBack, isAuthenticated) => {
  const [showModal, setShowModal] = useState(false);
  const modalRegistry = useContext(ModalRegistryContext);
  const onFirstBackRef = useRef(onFirstBack);
  const isAuthenticatedRef = useRef(isAuthenticated);
  const pushCountRef = useRef(0);
  const resetPushCount = useCallback(() => { pushCountRef.current = 0; }, []);

  useEffect(() => {
    onFirstBackRef.current = onFirstBack;
  }, [onFirstBack]);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  // Registrar el modal de salida en la pila global cuando está visible
  useEffect(() => {
    if (!modalRegistry) return;
    if (showModal) {
      const handler = () => setShowModal(false);
      modalRegistry.push(handler);
      return () => modalRegistry.pop(handler);
    }
  }, [showModal, modalRegistry]);

  useEffect(() => {
    const handleBack = () => {
      const result = onFirstBackRef.current ? onFirstBackRef.current() : 'showModal';
      if (result === 'ignore' || result === 'handled') return;
      setShowModal(true);
    };

    // Listener para Chrome desktop y Chrome Android en navegador
    const handlePopState = () => {
      if (!isAuthenticatedRef.current) return;
      handleBack();
      // Restaurar la entrada consumida por popstate
      window.history.pushState({ id: Date.now(), custom: true }, "");
      pushCountRef.current++;
    };

    window.addEventListener('popstate', handlePopState);

    // Listener adicional para PWA instalada en Android (Navigation API)
    if (window.navigation) {
      const handleNavigate = (event) => {
        if (
          event.navigationType === 'traverse' &&
          event.destination.index < window.navigation.currentEntry.index
        ) {
          if (!isAuthenticatedRef.current) return;
          event.preventDefault();
          handleBack();
        }
      };

      window.navigation.addEventListener('navigate', handleNavigate);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        window.navigation.removeEventListener('navigate', handleNavigate);
      };
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const openModal = () => setShowModal(true);
  const handleCancelExit = () => setShowModal(false);

  return { showModal, openModal, handleCancelExit, pushCountRef, resetPushCount };
};

export default useBackButton;
