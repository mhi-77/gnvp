import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Hook useAutoLogout - Cierra la sesión automáticamente por inactividad.
 *
 * Monitorea eventos de actividad del usuario. Si no hay actividad durante
 * timeoutMinutes, muestra advertencia via onWarning y luego hace logout.
 *
 * @param {number} timeoutMinutes - Tiempo total de inactividad antes del logout
 * @param {number} warningMinutes - Tiempo de advertencia antes del logout
 * @param {function} onWarning - Callback que se ejecuta al iniciar la advertencia
 */
export function useAutoLogout({ timeoutMinutes = 20, warningMinutes = 2, onWarning } = {}) {
  const { logout, user } = useAuth();
  const timeoutRef = useRef();
  const warningTimeoutRef = useRef();
  const lastActivityRef = useRef(Date.now());

  const resetTimer = () => {
    if (!user) return;
    lastActivityRef.current = Date.now();

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

    const warningTime = (timeoutMinutes - warningMinutes) * 60 * 1000;

    if (warningTime > 0 && onWarning) {
      warningTimeoutRef.current = setTimeout(() => {
        onWarning();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          logout();
        }, warningMinutes * 60 * 1000);
      }, warningTime);
    }

    if (warningTime <= 0 || !onWarning) {
      timeoutRef.current = setTimeout(() => {
        logout();
      }, timeoutMinutes * 60 * 1000);
    }
  };

  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => resetTimer();

    events.forEach(event => document.addEventListener(event, handleActivity, true));
    resetTimer();

    return () => {
      events.forEach(event => document.removeEventListener(event, handleActivity, true));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, [user, timeoutMinutes, warningMinutes, logout, onWarning]);

  return {
    resetTimer,
    warningMinutes,
    getLastActivity: () => lastActivityRef.current,
    getRemainingTime: () => {
      const elapsed = Date.now() - lastActivityRef.current;
      return Math.max(0, (timeoutMinutes * 60 * 1000) - elapsed);
    }
  };
}
