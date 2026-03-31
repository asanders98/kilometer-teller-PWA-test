import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

declare const process: { env: Record<string, string | undefined> }
const base = process.env.VITE_BASE_PATH ?? '/kilometer-teller-PWA/'
const version = process.env.npm_package_version ?? '0.0.0'

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icon.svg', 'icon-192.png', 'icon-512.png',
        'tesseract/worker.min.js',
        'tesseract/tesseract-core-simd-lstm.wasm.js',
        'tesseract/tesseract-core-simd-lstm.wasm',
        'tesseract/tesseract-core-lstm.wasm.js',
        'tesseract/tesseract-core-lstm.wasm',
        'tesseract/lang/eng.traineddata',
      ],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,traineddata}'],
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
      },
      manifest: {
        name: 'Kilometer Teller',
        short_name: 'Km Teller',
        description: 'Dagelijkse kilometerregistratie voor zakelijke ritten',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
