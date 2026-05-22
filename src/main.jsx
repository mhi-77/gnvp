/**
 * Punto de entrada principal de GINOVA.
 * Renderiza el componente App en StrictMode y registra el Service Worker.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Registrar Service Worker para PWA y escuchar actualizaciones
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(registration => {
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateBanner();
        }
      });
    });
  }).catch(err => {
    if (import.meta.env.DEV) return;
    console.error('SW registration failed:', err);
  });
}

// Banner no intrusivo de actualización disponible
function showUpdateBanner() {
  const existing = document.getElementById('update-banner');
  if (existing) return;

  const banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0;
    background: #0369a1; color: white;
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 16px; z-index: 9999;
  `;

  const text = document.createElement('span');
  text.style.cssText = 'flex: 1; text-align: center; cursor: pointer; line-height: 1.5;';
  text.innerHTML = `
    <div style="font-size: 15px; font-weight: 600;">Nueva versión disponible</div>
    <div style="font-size: 13px; opacity: 0.9;">Tocá para actualizar</div>
  `;
  text.onclick = () => window.location.reload();

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = 'background:none;border:none;color:white;font-size:18px;cursor:pointer;padding:0 0 0 12px;';
  closeBtn.onclick = () => banner.remove();

  banner.appendChild(text);
  banner.appendChild(closeBtn);
  document.body.appendChild(banner);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
