import React, { useState } from 'react';
import { LogIn, Eye, EyeOff, AlertCircle, Stethoscope, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CreditsModal from './CreditsModal';

/**
 * Componente LoginForm - Formulario de inicio de sesión de GINOVA.
 *
 * Props:
 * - onInstallClick: function - Abre el modal de instalación PWA.
 * - canNativeInstall: boolean - Indica si el navegador soporta instalación nativa.
 */
export default function LoginForm({ onInstallClick, canNativeInstall }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, completa todos los campos');
      return;
    }

    const success = await login(email, password);
    if (!success) {
      setError('Credenciales incorrectas. Verificá tu email y contraseña.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md border border-gray-100">

        {/* Header */}
        <div className="text-center mb-8">
          <button
            type="button"
            onClick={() => setShowCreditsModal(true)}
            className="mx-auto w-16 h-16 bg-sky-700 rounded-2xl flex items-center justify-center mb-4 hover:bg-sky-800 transition-colors cursor-pointer shadow-md"
          >
            <Stethoscope className="w-9 h-9 text-white" />
          </button>
          <button
            type="button"
            onClick={() => setShowCreditsModal(true)}
            className="block w-full text-2xl font-bold text-gray-900 mb-1 hover:text-sky-700 transition-colors cursor-pointer"
          >
            GINOVA
            <span className="text-sm font-normal text-gray-400 ml-2">
              v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '—'}
            </span>
          </button>
          <p className="text-sm text-gray-500">Gestión de Novedades Salariales</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-sky-500 transition-all duration-200 text-gray-900"
              placeholder="usuario@salud.gob.ar"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-sky-500 transition-all duration-200 text-gray-900"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none rounded transition-colors"
              >
                {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-sky-700 text-white py-3 px-4 rounded-lg hover:bg-sky-800 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Ingresar</span>
              </>
            )}
          </button>
        </form>

        {/* Opción de instalación PWA */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={onInstallClick}
            aria-label="Instalar GINOVA en este dispositivo"
            className="inline-flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            {canNativeInstall ? 'Instalar GINOVA' : 'Instalá GINOVA en tu dispositivo'}
          </button>
        </div>
      </div>

      <CreditsModal isOpen={showCreditsModal} onClose={() => setShowCreditsModal(false)} />
    </div>
  );
}
