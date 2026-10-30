import { mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'

export const projectRoot = join(import.meta.dirname, '..')
export const tmpDir = join(projectRoot, '.tmp')

const STALE_AFTER_MS = 60 * 60 * 1000

// workerd 只肯在本仓库内创建它的 Durable Object 存储目录：实测 %TEMP%、%TEMP% 的子目录、
// C:\Temp 全部以 CreateDirectory ACCESS_DENIED 失败，只有仓库内目录可用（旧版 workerd
// 遇到该错误只输出 std::terminate，不报原因，升级后才看到 kj 异常原文）。
// 副作用：.tmp 落在项目根下会被 vite dev server 当静态文件服务，故 vite.config.js
// 必须把它加入 server.fs.deny。
export function useProjectTmpDir() {
  mkdirSync(tmpDir, { recursive: true })
  pruneStaleMiniflareDirs()
  process.env.TMPDIR = tmpDir
  process.env.TEMP = tmpDir
  process.env.TMP = tmpDir
  return tmpDir
}

// miniflare 只在正常退出时删自己的临时目录，崩溃或被杀会留下残留。
// 正在使用的目录在 Windows 上因 workerd 持有句柄而删不掉，由 catch 兜住。
function pruneStaleMiniflareDirs() {
  const cutoff = Date.now() - STALE_AFTER_MS
  for (const entry of readdirSync(tmpDir)) {
    if (!entry.startsWith('miniflare-')) continue
    const path = join(tmpDir, entry)
    try {
      if (statSync(path).mtimeMs < cutoff) rmSync(path, { recursive: true, force: true })
    } catch {
      // 删不掉说明仍被占用，留给下一次
    }
  }
}
