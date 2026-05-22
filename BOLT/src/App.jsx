import React, { useState, useCallback, useRef, useEffect, useContext } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import useBackButton from './hooks/useBackButton';
import { useInstallPWA } from './hooks/useInstallPWA';
import InstallPWAModal from './components/InstallPWAModal';
import { useFocusTrap } from './hooks/useFocusTrap';
import { ModalRegistryProvider } from './hooks/useModalRegistry.jsx';
import { ModalRegistryContext } from './hooks/useModalBackHandler';

/**
 * ExitConfirmationModal - Modal de confirmación de cierre de sesión.
 *
 * Se muestra cuando el usuario presiona "Cerrar Sesión" o el botón "atrás"
 * del dispositivo con el sidebar ya abierto. Ofrece confirmar o cancelar.
 */
function ExitConfirmationModal({ onConfirm, onCancel }) {
  const containerRef = useFocusTrap(true);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-modal-title"
        className="bg-white rounded-xl shadow-xl p-6 w-[90%] max-w-sm text-center"
      >
        <h2 id="exit-modal-title" className="text-lg font-semibold text-gray-900">
          Cerrar Sesión
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          ¿Confirmás que deseas cerrar sesión?
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 min-h-[44px] bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 min-h-[44px] bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * AppContent - Gestiona el flujo de autenticación y los modales globales.
 *
 * Coordina:
 * - Renderizado condicional: LoginForm vs Dashboard según estado de auth
 * - Modal de confirmación de cierre de sesión
 * - Modal de instalación PWA
 * - Historial del navegador para el botón "atrás" del dispositivo
 */
function AppContent() {
  const { user, logout } = useAuth();
  const modalRegistry = useContext(ModalRegistryContext);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarOpenRef = useRef(sidebarOpen);
  useEffect(() => { sidebarOpenRef.current = sidebarOpen; }, [sidebarOpen]);

  const historyPushedRef = useRef(false);
  const hadSessionRef = useRef(false);

  // Al autenticarse: agregar UNA entrada al historial para interceptar "atrás"
  useEffect(() => {
    if (user && !historyPushedRef.current) {
      window.history.pushState({ id: Date.now(), custom: true }, "");
      historyPushedRef.current = true;
      hadSessionRef.current = true;
    }
  }, [user]);

  // Primer gesto: agregar entrada al historial si aún no se hizo
  useEffect(() => {
    const handleFirstGesture = () => {
      if (user && !historyPushedRef.current) {
        window.history.pushState({ id: Date.now(), custom: true }, "");
        historyPushedRef.current = true;
        hadSessionRef.current = true;
      }
      document.removeEventListener('touchstart', handleFirstGesture);
      document.removeEventListener('mousedown', handleFirstGesture);
    };
    document.addEventListener('touchstart', handleFirstGesture);
    document.addEventListener('mousedown', handleFirstGesture);
    return () => {
      document.removeEventListener('touchstart', handleFirstGesture);
      document.removeEventListener('mousedown', handleFirstGesture);
    };
  }, [user]);

  // Al hacer logout: limpiar el historial propio
  useEffect(() => {
    if (!user) {
      if (!hadSessionRef.current) return;
      hadSessionRef.current = false;
      historyPushedRef.current = false;
      setSidebarOpen(false);
      handleCancelExit();
      window.history.go(-1);
    }
  }, [user]);

  // Callback para el botón "atrás": define la prioridad de acciones
  const handleFirstBack = useCallback(() => {
    if (!user) return 'ignore';

    // Prioridad 1: cerrar el modal superior si hay alguno abierto
    if (modalRegistry) {
      const stack = modalRegistry.stackRef.current;
      if (stack.length > 0) {
        stack[stack.length - 1]();
        return 'handled';
      }
    }

    // Prioridad 2: abrir sidebar si está cerrado
    if (!sidebarOpenRef.current) {
      setSidebarOpen(true);
      return 'handled';
    }

    // Prioridad 3: cerrar sidebar si está abierto
    setSidebarOpen(false);
    return 'handled';
  }, [user, modalRegistry]);

  const { showModal, openModal, handleCancelExit } = useBackButton(handleFirstBack, !!user);

  const handleConfirmExit = () => {
    handleCancelExit();
    logout();
  };

  const { isOpen: installOpen, openModal: openInstall, closeModal: closeInstall, canNativeInstall } = useInstallPWA();

  return (
    <main>
      {user
        ? <Dashboard sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogoutRequest={openModal} />
        : <LoginForm onInstallClick={openInstall} canNativeInstall={canNativeInstall} />
      }

      {/* Modal de confirmación de logout */}
      {showModal && (
        <ExitConfirmationModal onConfirm={handleConfirmExit} onCancel={handleCancelExit} />
      )}

      {/* Modal de instalación PWA */}
      <InstallPWAModal isOpen={installOpen} onClose={closeInstall} />
    </main>
  );
}

/**
 * App - Componente raíz de GINOVA.
 * Envuelve la app en AuthProvider y ModalRegistryProvider.
 */
function App() {
  return (
    <AuthProvider>
      <ModalRegistryProvider>
        <div className="font-sans antialiased">
          <AppContent />
        </div>
      </ModalRegistryProvider>
    </AuthProvider>
  );
}

export default App;
