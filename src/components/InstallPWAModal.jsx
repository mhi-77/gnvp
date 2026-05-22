import React, { useState, useEffect } from 'react';
import { X, Smartphone, Monitor, Share, MoreVertical, PlusSquare, Download } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

/**
 * Detecta la plataforma del usuario para pre-seleccionar las instrucciones correctas.
 * @returns {'ios' | 'android' | 'desktop'}
 */
function detectPlatform() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isAndroid = /Android/.test(ua);
  if (isIOS) return 'ios';
  if (isAndroid) return 'android';
  return 'desktop';
}

const STEPS = {
  android: {
    label: 'Android · Chrome',
    icon: <Smartphone className="w-5 h-5" />,
    steps: [
      { icon: <MoreVertical className="w-5 h-5 text-sky-600" />, text: <>Tocá el ícono de <strong>tres puntos</strong> (⋮) en la esquina superior derecha de Chrome.</> },
      { icon: <Download className="w-5 h-5 text-sky-600" />, text: <>Seleccioná <strong>"Agregar a pantalla de inicio"</strong> o <strong>"Instalar app"</strong>.</> },
      { icon: <PlusSquare className="w-5 h-5 text-sky-600" />, text: <>Confirmá tocando <strong>"Instalar"</strong>. El ícono de GINOVA aparecerá en tu pantalla de inicio.</> },
    ],
  },
  ios: {
    label: 'iPhone · Safari',
    icon: <Smartphone className="w-5 h-5" />,
    steps: [
      { icon: <Share className="w-5 h-5 text-sky-600" />, text: <>Tocá el ícono de <strong>compartir</strong> (□↑) en la barra inferior de Safari.</> },
      { icon: <PlusSquare className="w-5 h-5 text-sky-600" />, text: <>Deslizá hacia abajo y seleccioná <strong>"Agregar a pantalla de inicio"</strong>.</> },
      { icon: <Download className="w-5 h-5 text-sky-600" />, text: <>Tocá <strong>"Agregar"</strong>. El ícono aparecerá en tu pantalla de inicio.</> },
    ],
  },
  desktop: {
    label: 'PC · Chrome / Edge',
    icon: <Monitor className="w-5 h-5" />,
    steps: [
      { icon: <Download className="w-5 h-5 text-sky-600" />, text: <>En la barra de direcciones, buscá el ícono de <strong>instalar</strong> (⊕) a la derecha de la URL.</> },
      { icon: <PlusSquare className="w-5 h-5 text-sky-600" />, text: <>Hacé click y seleccioná <strong>"Instalar"</strong> en el diálogo que aparece.</> },
      { icon: <Monitor className="w-5 h-5 text-sky-600" />, text: <>GINOVA se abrirá como una ventana independiente y aparecerá en tu menú de inicio.</> },
    ],
  },
};

const PLATFORMS = ['android', 'ios', 'desktop'];

/**
 * Modal de instrucciones para instalar GINOVA como PWA.
 * Muestra pasos según la plataforma detectada (Android, iOS, escritorio).
 *
 * @param {boolean} isOpen - Visibilidad del modal.
 * @param {function} onClose - Callback al cerrar.
 */
export default function InstallPWAModal({ isOpen, onClose }) {
  const [activePlatform, setActivePlatform] = useState(detectPlatform);
  const containerRef = useFocusTrap(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const { steps } = STEPS[activePlatform];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Instrucciones para instalar GINOVA"
    >
      <div
        ref={containerRef}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="bg-sky-700 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Instalá GINOVA</h2>
              <p className="text-sky-200 text-sm mt-0.5">Seguí los pasos según tu dispositivo</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="p-2 rounded-full hover:bg-sky-600 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Tabs de plataforma */}
          <div className="flex gap-2 mt-4">
            {PLATFORMS.map(platform => (
              <button
                key={platform}
                onClick={() => setActivePlatform(platform)}
                aria-pressed={activePlatform === platform}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none transition-colors ${
                  activePlatform === platform
                    ? 'bg-white text-sky-700'
                    : 'bg-sky-600 text-white hover:bg-sky-500'
                }`}
              >
                {STEPS[platform].icon}
                {STEPS[platform].label}
              </button>
            ))}
          </div>
        </div>

        {/* Pasos */}
        <div className="px-6 py-5">
          <ol className="space-y-4">
            {steps.map((step, index) => (
              <li key={index} className="flex items-start gap-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-sky-100 text-sky-700 font-bold text-sm flex items-center justify-center">
                  {index + 1}
                </span>
                <div className="flex items-start gap-2 pt-0.5">
                  <span className="flex-shrink-0 mt-0.5">{step.icon}</span>
                  <p className="text-gray-700 text-sm leading-relaxed">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-5 bg-sky-50 rounded-xl p-4">
            <p className="text-xs text-sky-800 leading-relaxed">
              <strong>¿Por qué instalarla?</strong> La app instalada carga más rápido,
              funciona sin barra del navegador y puede usarse con conexión limitada.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:outline-none rounded transition-colors"
          >
            Ahora no
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white text-sm font-medium rounded-xl focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors min-h-[44px]"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
