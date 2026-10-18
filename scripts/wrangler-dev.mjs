import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')

// wrangler dev 在加载 vite.config.js 之前就构造好了 Miniflare，拿不到那里改道的临时目录，
// 因此必须在本进程启动 workerd 之前设置。原因见 vite.config.js 顶部说明。
const tmpDir = join(root, '.tmp')
mkdirSync(tmpDir, { recursive: true })

const child = spawn(
  process.execPath,
  [join(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js'), 'dev', ...process.argv.slice(2)],
  {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, TMPDIR: tmpDir, TEMP: tmpDir, TMP: tmpDir }
  }
)

child.on('exit', (code, signal) => {
  process.exit(signal ? 1 : (code ?? 0))
})
