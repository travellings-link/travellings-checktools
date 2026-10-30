import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { projectRoot, useProjectTmpDir } from './tmp-dir.mjs'

// wrangler dev 在加载 vite.config.js 之前就构造好了 Miniflare，拿不到那里的改道，
// 因此必须在本进程启动 workerd 之前设置。
useProjectTmpDir()

const child = spawn(
  process.execPath,
  [join(projectRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js'), 'dev', ...process.argv.slice(2)],
  {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env
  }
)

child.on('error', (error) => {
  console.error(`无法启动 wrangler dev：${error.message}`)
  process.exit(1)
})

child.on('exit', (code, signal) => {
  process.exit(signal ? 1 : (code ?? 0))
})
