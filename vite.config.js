import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { cloudflare } from "@cloudflare/vite-plugin";
import { useProjectTmpDir } from './scripts/tmp-dir.mjs'

// 必须早于 cloudflare() 插件构造 Miniflare 之前执行，原因见 scripts/tmp-dir.mjs。
useProjectTmpDir()

export default defineConfig({
  envPrefix: ['API_', 'TURNSTILE_'],
  plugins: [react(), tailwindcss(), cloudflare()],
  server: {
    port: 5174,
    fs: {
      // 默认的 deny 不含 .tmp，否则 miniflare 的 sqlite 状态会被 dev server 直接返回。
      // 匹配的是归一化绝对路径，且含 "/" 的模式不会被自动加 "**/" 前缀，故须写全。
      deny: ['.env', '.env.*', '*.{crt,pem}', '.tmp', '**/.tmp/**']
    },
    proxy: {
      '/api': {
        target: 'https://api-check-tool.travellings.cn/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
