import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { cloudflare } from "@cloudflare/vite-plugin";

// miniflare 把 workerd 的临时目录硬编码为 os.tmpdir()，而 workerd 在部分 Windows
// 机器上无法于 %TEMP% 内创建 Durable Object 存储目录（kj CreateDirectory 报 ACCESS_DENIED，
// 旧版 workerd 只会 std::terminate 而不打印原因）。改道到项目内目录绕过。
const tmpDir = join(import.meta.dirname, '.tmp')
mkdirSync(tmpDir, { recursive: true })
process.env.TMPDIR = process.env.TEMP = process.env.TMP = tmpDir

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