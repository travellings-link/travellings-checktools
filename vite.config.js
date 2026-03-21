import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  envPrefix: ['API_', 'TURNSTILE_'],
  plugins: [react(), tailwindcss(), cloudflare()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'https://api-check-tool.travellings.cn/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})