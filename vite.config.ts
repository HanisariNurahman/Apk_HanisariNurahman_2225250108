/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base './' agar build bisa dihosting di subfolder (GitHub Pages) bersama HashRouter.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'PeluangKu — Belajar Peluang Sederhana',
        short_name: 'PeluangKu',
        description: 'Belajar peluang sederhana langkah demi langkah untuk siswa SMP.',
        lang: 'id',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FAFAF7',
        theme_color: '#2457C5',
        // Ikon PNG 192/512 ditambahkan di M8.
        icons: [{ src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
  server: { host: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
