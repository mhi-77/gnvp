import React, { useEffect } from 'react';
import { X, Stethoscope } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useModalBackHandler } from '../hooks/useModalBackHandler';

/**
 * Modal de créditos de GINOVA.
 *
 * Muestra versión, fecha de actualización, licencia y datos de contacto.
 * Las variables __APP_VERSION__, __LAST_UPDATED__ y __APP_LICENSE__ son
 * inyectadas por Vite en tiempo de build desde vite.config.js.
 *
 * @param {boolean} isOpen - Visibilidad del modal.
 * @param {function} onClose - Callback al cerrar.
 */
export default function CreditsModal({ isOpen, onClose }) {
  const containerRef = useFocusTrap(isOpen);
  useModalBackHandler(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="credits-modal-title"
    >
      <div
        ref={containerRef}
        className="bg-white rounded-2xl shadow-2xl p-6 w-80 max-w-md relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:outline-none rounded"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          {/* Ícono de la app */}
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 bg-sky-700 rounded-2xl flex items-center justify-center">
              <Stethoscope className="w-9 h-9 text-white" />
            </div>
          </div>

          <div className="space-y-3 text-gray-700">
            <div>
              <p id="credits-modal-title" className="text-xl font-bold text-gray-900">GINOVA</p>
              <p className="text-sm text-gray-500">Gestión de Novedades Salariales de Salud</p>
            </div>

            <div className="pt-3 border-t border-gray-200 space-y-1">
              <p className="text-sm text-gray-600">
                Versión {typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '—'}
              </p>
              <p className="text-xs text-gray-500">
                Última actualización: {typeof __LAST_UPDATED__ !== 'undefined' ? __LAST_UPDATED__ : '—'}
              </p>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 italic">
                Licencia: {typeof __APP_LICENSE__ !== 'undefined' ? __APP_LICENSE__ : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
