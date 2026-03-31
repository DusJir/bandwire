import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const isPWA = process.env.BUILD_TARGET === 'pwa'

export default defineConfig({
  plugins: [
    react(),
    isPWA && VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/**/*'],
      manifest: {
        name: 'BandWire',
        short_name: 'BandWire',
        description: 'Signal flow diagram tool for live musicians',
        theme_color: '#6366f1',
        background_color: '#0a0a12',
        display: 'standalone',
        orientation: 'landscape',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ].filter(Boolean),
  base: './',
  build: {
    outDir: isPWA ? 'dist-pwa' : 'dist',
    emptyOutDir: true,
  },
})
