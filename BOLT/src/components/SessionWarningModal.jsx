import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useModalBackHandler } from '../hooks/useModalBackHandler';

/**
 * Modal de advertencia de expiración de sesión.
 *
 * Se muestra cuando useAutoLogout detecta inactividad prolongada.
 * Presenta cuenta regresiva y dos acciones: extender sesión o cerrarla.
 * Si el contador llega a cero, llama automáticamente a onLogout.
 *
 * @param {boolean} isOpen - Visibilidad del modal.
 * @param {number} warningMinutes - Minutos de cuenta regresiva.
 * @param {function} onExtendSession - Callback para extender la sesión.
 * @param {function} onLogout - Callback para cerrar sesión.
 */
export default function SessionWarningModal({ isOpen, warningMinutes = 2, onExtendSession, onLogout }) {
  const [seconds, setSeconds] = useState(warningMinutes * 60);
  const intervalRef = useRef(null);
  const containerRef = useFocusTrap(isOpen);

  // "Atrás" del dispositivo equivale a extender la sesión
  useModalBackHandler(isOpen, onExtendSession);

  useEffect(() => {
    if (!isOpen) return;

    const warningSeconds = warningMinutes * 60;
    setSeconds(warningSeconds);

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, warningMinutes, onLogout]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onExtendSession();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onExtendSession]);

  if (!isOpen) return null;

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-warning-title"
      aria-live="polite"
    >
      <div ref={containerRef} className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h3 id="session-warning-title" className="text-lg font-semibold text-gray-900">
              Sesión por expirar
            </h3>
            <p className="text-sm text-gray-600">Tu sesión finalizará por inactividad</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 text-yellow-800">
            <Clock className="w-5 h-5" />
            <span className="font-medium">
              Tiempo restante: {minutes}:{secs.toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onExtendSession}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-sky-700 text-white rounded-lg hover:bg-sky-800 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Extender</span>
          </button>
          <button
            onClick={onLogout}
            className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
