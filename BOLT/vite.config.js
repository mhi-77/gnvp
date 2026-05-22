import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

// Leer package.json para extraer versión y licencia
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// Obtener fecha del último commit para mostrar en modal de créditos
const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

let lastCommitDate;
try {
  const raw = execSync('git log -1 --format=%cd --date=format:"%m %Y"').toString().trim();
  const [month, year] = raw.split(' ');
  lastCommitDate = `${months[parseInt(month) - 1]} ${year}`;
} catch {
  const now = new Date();
  lastCommitDate = `${months[now.getMonth()]} ${now.getFullYear()}`;
}

export default defineConfig({
  define: {
    // Versión inyectada desde package.json, disponible globalmente en el bundle
    __APP_VERSION__: JSON.stringify(pkg.version),
    // Licencia inyectada desde package.json
    __APP_LICENSE__: JSON.stringify(pkg.license),
    // Fecha del último commit para mostrar en la UI
    __LAST_UPDATED__: JSON.stringify(lastCommitDate),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'GINOVA - Gestión de Novedades de Salud',
        short_name: 'GINOVA',
        description: 'Gestión de novedades salariales para trabajadores de salud',
        theme_color: '#0369a1',
        background_color: '#0369a1',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
              }
            }
          }
        ]
      }
    })
  ],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase': ['@supabase/supabase-js'],
          'lucide': ['lucide-react'],
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
