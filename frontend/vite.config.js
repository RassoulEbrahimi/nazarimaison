import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

function normalizeBasePath(value = '/') {
  if (!value || value === '.') {
    return '/';
  }

  const withSlashes = `/${value}/`.replace(/\/+/g, '/');
  return withSlashes === '//' ? '/' : withSlashes;
}

export default defineConfig({
  base: normalizeBasePath(process.env.VITE_BASE_PATH),
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/*.png', 'images/profile/Profile_Picture.jpg'],
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,json,woff2}'],
        navigateFallbackDenylist: [/^\/backend\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\/data\/products\.json$/.test(url.pathname),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'nazari-product-data',
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 6,
                maxAgeSeconds: 60 * 60,
              },
            },
          },
          {
            urlPattern: ({ url }) => /\/(images|videos)\/products\//.test(url.pathname),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'nazari-product-media',
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 14,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Nazari Maison',
        short_name: 'Nazari',
        description: 'Nazari Maison Persian-first atelier gallery and ordering app.',
        lang: 'fa',
        dir: 'rtl',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        theme_color: '#6b1f2e',
        background_color: '#f6f0e6',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
});
