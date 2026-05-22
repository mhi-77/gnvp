import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Menu, LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import SessionWarningModal from './SessionWarningModal';
import MisNovedadesView from './MisNovedadesView';
import BandejaView from './BandejaView';
import ReportesView from './ReportesView';
import NominaView from './NominaView';
import CategoriasView from './CategoriasView';
import PeriodosView from './PeriodosView';
import UsuariosView from './UsuariosView';
import PerfilView from './PerfilView';
import { useAuth } from '../context/AuthContext';
import { useAutoLogout } from '../hooks/useAutoLogout';

/**
 * Dashboard - Panel principal de GINOVA.
 *
 * Maneja la navegación entre vistas, el auto-logout por inactividad
 * y la advertencia de sesión.
 *
 * Props:
 * - sidebarOpen: boolean - Estado del sidebar, controlado desde App.jsx.
 * - setSidebarOpen: function - Setter del estado del sidebar.
 * - onLogoutRequest: function - Abre el modal de confirmación de logout.
 */
export default function Dashboard({ sidebarOpen, setSidebarOpen, onLogoutRequest }) {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState('mis-novedades');
  const [showWarning, setShowWarning] = useState(false);
  const mainContentRef = useRef(null);
  const focusOnViewChangeRef = useRef(false);

  // Mover foco al primer elemento interactivo al cambiar de vista desde el sidebar
  useEffect(() => {
    if (!focusOnViewChangeRef.current) return;
    focusOnViewChangeRef.current = false;

    const FOCUSABLE = [
      'a[href]', 'button:not([disabled])', 'input:not([disabled])',
      'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const raf = requestAnimationFrame(() => {
      const container = mainContentRef.current;
      if (!container) return;
      const first = container.querySelector(FOCUSABLE);
      if (first) first.focus();
    });

    return () => cancelAnimationFrame(raf);
  }, [activeView]);

  // Obtener iniciales del rol para el avatar del header
  const getUserInitials = (roleDescription) => {
    if (!roleDescription) return '';
    const words = roleDescription.trim().split(/\s+/);
    if (words.length >= 2) return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    return words[0].charAt(0).toUpperCase();
  };

  const handleWarningCallback = useCallback(() => setShowWarning(true), []);

  // Auto-logout por inactividad: 20 min totales, advertencia a los 18 min
  const { resetTimer, warningMinutes } = useAutoLogout({
    timeoutMinutes: 20,
    warningMinutes: 2,
    onWarning: handleWarningCallback,
  });

  const handleExtendSession = () => {
    setShowWarning(false);
    resetTimer();
  };

  const handleWarningLogout = () => {
    setShowWarning(false);
    logout();
  };

  // Seleccionar el componente de vista según el activeView
  const renderContent = () => {
    switch (activeView) {
      case 'mis-novedades':  return <MisNovedadesView />;
      case 'bandeja':        return <BandejaView />;
      case 'reportes':       return <ReportesView />;
      case 'nomina':         return <NominaView />;
      case 'categorias':     return <CategoriasView />;
      case 'periodos':       return <PeriodosView />;
      case 'usuarios':       return <UsuariosView />;
      case 'perfil':         return <PerfilView />;
      default:               return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar de navegación */}
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        activeView={activeView}
        setActiveView={(id) => {
          focusOnViewChangeRef.current = true;
          setActiveView(id);
        }}
        onViewSelected={() => { focusOnViewChangeRef.current = true; }}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Botón de menú para móvil */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700 transition-colors p-1"
              >
                <Menu className="w-6 h-6" />
              </button>
              {/* Avatar + nombre del usuario */}
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-sky-700 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {getUserInitials(user?.roleDescription)}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.roleDescription}</p>
                </div>
                <p className="sm:hidden text-sm font-semibold text-gray-900">{user?.name}</p>
              </div>
            </div>

            {/* Botón cerrar sesión */}
            <button
              onClick={onLogoutRequest}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200 text-sm"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </header>

        {/* Contenido principal */}
        <main ref={mainContentRef} className="flex-1 overflow-auto p-4 sm:p-6">
          {renderContent()}
        </main>
      </div>

      {/* Modal de advertencia de sesión */}
      <SessionWarningModal
        isOpen={showWarning}
        warningMinutes={warningMinutes}
        onExtendSession={handleExtendSession}
        onLogout={handleWarningLogout}
      />
    </div>
  );
}
