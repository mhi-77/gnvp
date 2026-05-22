import { useState, useEffect } from 'react';

/**
 * Hook useInstallPWA - Gestiona la instalación de GINOVA como PWA.
 *
 * Combina dos estrategias:
 * - Instalación nativa (Android/Chrome, PC/Edge) via beforeinstallprompt
 * - Modal con instrucciones manuales como fallback (iOS Safari y otros)
 *
 * Retorna:
 * - isOpen: true cuando el modal de instrucciones debe mostrarse
 * - canNativeInstall: true cuando el navegador soporta instalación nativa
 * - openModal: instala nativamente si es posible, sino muestra modal
 * - closeModal: cierra el modal y persiste que el usuario ya lo vio
 */
export function useInstallPWA() {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canNativeInstall, setCanNativeInstall] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanNativeInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setCanNativeInstall(false);
      localStorage.setItem('ginova-pwa-install-seen', 'true');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    const alreadySeen = localStorage.getItem('ginova-pwa-install-seen');
    let timer;
    if (!alreadySeen && !canNativeInstall) {
      timer = setTimeout(() => setIsOpen(true), 1500);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, []);

  const openModal = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setCanNativeInstall(false);
        localStorage.setItem('ginova-pwa-install-seen', 'true');
      }
    } else {
      setIsOpen(true);
    }
  };

  const closeModal = () => {
    localStorage.setItem('ginova-pwa-install-seen', 'true');
    setIsOpen(false);
  };

  return { isOpen, canNativeInstall, openModal, closeModal };
}
