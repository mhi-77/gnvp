import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FileText, ClipboardList, Users, Settings, X,
  Stethoscope, UserCog, LayoutDashboard, BookOpen, BarChart2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CreditsModal from './CreditsModal';

/**
 * Definición de los items del menú de navegación de GINOVA.
 * maxRole: tipo máximo de usuario que puede ver el item (menor número = mayor privilegio).
 * - 1=SUPERUSUARIO, 2=LIQUIDACIONES, 3=JEFE, 4=COORDINADOR, 5=TRABAJADOR
 */
const menuItems = [
  { id: 'mis-novedades',  label: 'Mis Novedades',   icon: FileText,      maxRole: 5, disabled: false },
  { id: 'bandeja',        label: 'Bandeja',          icon: ClipboardList, maxRole: 4, disabled: false },
  { id: 'reportes',       label: 'Reportes',         icon: BarChart2,     maxRole: 3, disabled: false },
  { id: 'nomina',         label: 'Nómina',           icon: BookOpen,      maxRole: 2, disabled: false },
  { id: 'categorias',     label: 'Categorías',       icon: LayoutDashboard, maxRole: 2, disabled: false },
  { id: 'periodos',       label: 'Períodos',         icon: ClipboardList, maxRole: 2, disabled: false },
  { id: 'usuarios',       label: 'Usuarios',         icon: Users,         maxRole: 2, disabled: false },
  { id: 'configuracion',  label: 'Configuración',    icon: Settings,      maxRole: 1, disabled: false },
];

// IDs del grupo de administración (fondo diferenciado al final del menú)
const ADMIN_IDS = ['nomina', 'categorias', 'periodos', 'usuarios', 'configuracion'];

/**
 * Sidebar - Barra lateral de navegación principal de GINOVA.
 *
 * Filtra los items según usuario_tipo: solo muestra los que el usuario puede ver.
 * Los items administrativos se agrupan con fondo diferenciado.
 * Navegación por teclado: ArrowUp/Down para moverse, Enter/Espacio para activar.
 *
 * @param {boolean} isOpen - Visibilidad en móvil.
 * @param {function} setIsOpen - Setter del estado de visibilidad.
 * @param {string} activeView - ID de la vista activa.
 * @param {function} setActiveView - Setter de la vista activa.
 * @param {function} onViewSelected - Callback al seleccionar una vista.
 */
export default function Sidebar({ isOpen, setIsOpen, activeView, setActiveView, onViewSelected }) {
  const { user } = useAuth();
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const sidebarRef = useRef(null);
  const itemRefs = useRef({});

  // Al abrir el sidebar en móvil, mover el foco al contenedor
  useEffect(() => {
    if (isOpen && sidebarRef.current) {
      sidebarRef.current.focus();
    }
  }, [isOpen]);

  // Filtrar items según el rol del usuario autenticado
  const visibleMenuItems = menuItems.filter(item =>
    user?.usuario_tipo && user.usuario_tipo <= item.maxRole
  );

  const navigableItems = visibleMenuItems.filter(item => !item.disabled);

  // Navegación vertical con teclado entre items del menú
  const handleNavKeyDown = useCallback((e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();

    const currentId = document.activeElement?.dataset?.menuId;
    const ids = navigableItems.map(i => i.id);
    const currentIndex = ids.indexOf(currentId);

    let nextIndex;
    if (e.key === 'ArrowDown') {
      nextIndex = currentIndex < ids.length - 1 ? currentIndex + 1 : 0;
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : ids.length - 1;
    }

    itemRefs.current[ids[nextIndex]]?.focus();
  }, [navigableItems]);

  const handleItemSelect = (item) => {
    if (item.disabled) return;
    setActiveView(item.id);
    setIsOpen(false);
    if (onViewSelected) onViewSelected();
  };

  const handleItemKeyDown = (e, item) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleItemSelect(item);
    }
  };

  const renderItem = (item) => {
    const Icon = item.icon;
    const isActive = activeView === item.id;
    const isDisabled = item.disabled;

    return (
      <button
        key={item.id}
        ref={(el) => { itemRefs.current[item.id] = el; }}
        data-menu-id={item.id}
        onClick={() => handleItemSelect(item)}
        onKeyDown={(e) => handleItemKeyDown(e, item)}
        disabled={isDisabled}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
          isDisabled
            ? 'text-gray-400 cursor-not-allowed opacity-60'
            : isActive
            ? 'bg-sky-700 text-white shadow-md'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        title={isDisabled ? 'Funcionalidad no disponible' : ''}
      >
        <Icon className="w-5 h-5" />
        <span className="font-medium">{item.label}</span>
      </button>
    );
  };

  // Construir el menú con separación visual para la sección admin
  const renderedNav = [];
  let adminGroupRendered = false;

  for (const item of visibleMenuItems) {
    const isAdmin = ADMIN_IDS.includes(item.id);

    if (!isAdmin) {
      renderedNav.push(renderItem(item));
    } else if (item.id === 'nomina' && !adminGroupRendered) {
      adminGroupRendered = true;
      const adminItems = visibleMenuItems.filter(i => ADMIN_IDS.includes(i.id));
      renderedNav.push(
        <div key="admin-section" className="pt-2 pb-2">
          <div className="bg-gray-200 rounded-lg p-2 space-y-1">
            {adminItems.map(renderItem)}
          </div>
        </div>
      );
    }
  }

  return (
    <>
      {/* Overlay oscuro en móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Contenedor del sidebar */}
      <div
        ref={sidebarRef}
        tabIndex={-1}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 outline-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header del sidebar con logo y nombre */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <button
            onClick={() => setShowCreditsModal(true)}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <Stethoscope className="w-6 h-6 text-sky-700" />
            <h1 className="text-xl font-bold text-gray-900">
              GINOVA{' '}
              <span className="text-sm font-normal text-gray-400">
                v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '—'}
              </span>
            </h1>
          </button>
          {/* Botón de cierre solo en móvil */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col h-full">
          <div className="flex-1 px-4 py-4 overflow-y-auto">
            {/* Sección de usuario: clic lleva al perfil (roles <= 4) */}
            <div className="mb-6">
              <button
                onClick={() => {
                  if (user?.usuario_tipo && user.usuario_tipo <= 4) {
                    setActiveView('perfil');
                    setIsOpen(false);
                    if (onViewSelected) onViewSelected();
                  }
                }}
                disabled={!(user?.usuario_tipo && user.usuario_tipo <= 4)}
                className={`w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg transition-colors ${
                  user?.usuario_tipo && user.usuario_tipo <= 4
                    ? 'hover:bg-sky-50 cursor-pointer group'
                    : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="w-10 h-10 bg-sky-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserCog className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className={`text-sm font-medium text-gray-900 truncate transition-colors ${
                    user?.usuario_tipo && user.usuario_tipo <= 4 ? 'group-hover:text-sky-700' : ''
                  }`}>
                    {user?.name}
                  </p>
                  <p className={`text-xs text-gray-500 transition-colors ${
                    user?.usuario_tipo && user.usuario_tipo <= 4 ? 'group-hover:text-sky-500' : ''
                  }`}>
                    {user?.roleDescription}
                  </p>
                </div>
              </button>
            </div>

            {/* Menú de navegación */}
            <nav
              className="space-y-2"
              onKeyDown={handleNavKeyDown}
              aria-label="Navegación principal"
            >
              {renderedNav}
            </nav>
          </div>
        </div>
      </div>

      <CreditsModal isOpen={showCreditsModal} onClose={() => setShowCreditsModal(false)} />
    </>
  );
}
