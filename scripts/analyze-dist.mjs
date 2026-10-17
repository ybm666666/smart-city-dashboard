#!/usr/bin/env node
/**
 * Day14：构建产物体积分析（零依赖，只用 node 内置模块）
 *
 * 用法：
 *   npm run build && node scripts/analyze-dist.mjs
 *   node scripts/analyze-dist.mjs dist
 *
 * 输出三部分：
 *   1. 全量资源清单（原始体积 + gzip 体积），按体积降序
 *   2. 首屏关键资源（index.html 里以 <script>/modulepreload 引到的 js）汇总
 *   3. 体积回归基线提示：超过阈值的块标红，便于 CI 里肉眼发现问题
 */
import { readFile, readdir } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { join, relative } from 'node:path'

const DIST = process.argv[2] || 'dist'
// 单块 gzip 超过该值就提示（与 vite chunkSizeWarningLimit 口径不同：这里按 gzip 算）
const GZIP_BUDGET_KB = 160

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(full)))
    else if (entry.isFile()) out.push(full)
  }
  return out
}

const kb = (n) => (n / 1024).toFixed(2)
const pad = (v, n) => String(v).padStart(n)
const padEnd = (v, n) => String(v).padEnd(n)

let files
try {
  files = await walk(DIST)
} catch {
  console.error(`[analyze] 找不到目录 ${DIST}，请先执行 npm run build`)
  process.exit(1)
}

const rows = []
for (const file of files) {
  const buf = await readFile(file)
  rows.push({
    name: relative(DIST, file).split('\\').join('/'),
    raw: buf.length,
    gzip: gzipSync(buf).length
  })
}
rows.sort((a, b) => b.raw - a.raw)

// 首屏关键资源：index.html 中 <script src> 与 <link rel="modulepreload">
let html = ''
try {
  html = await readFile(join(DIST, 'index.html'), 'utf8')
} catch {
  /* index.html 不存在时跳过首屏统计 */
}
const criticalRefs = [...html.matchAll(/(?:src|href)="([^"]+\.js)"/g)]
  .map((m) => m[1].split('/').pop())
  .filter(Boolean)
const isCritical = (name) => criticalRefs.includes(name.split('/').pop())

const totalRaw = rows.reduce((a, r) => a + r.raw, 0)
const totalGzip = rows.reduce((a, r) => a + r.gzip, 0)
const firstRaw = rows.filter((r) => isCritical(r.name)).reduce((a, r) => a + r.raw, 0)
const firstGzip = rows.filter((r) => isCritical(r.name)).reduce((a, r) => a + r.gzip, 0)

console.log(`\n[analyze] 产物目录: ${DIST}\n`)
console.log(`${padEnd('资源', 44)}${pad('原始', 12)}${pad('gzip', 12)}  首屏`)
console.log('-'.repeat(82))
for (const r of rows) {
  const flag = isCritical(r.name) ? '★' : ''
  console.log(
    `${padEnd(r.name, 44)}${pad(kb(r.raw) + 'K', 12)}${pad(kb(r.gzip) + 'K', 12)}   ${flag}`
  )
}
console.log('-'.repeat(82))
console.log(`${padEnd('合计 ' + rows.length + ' 个资源', 44)}${pad(kb(totalRaw) + 'K', 12)}${pad(kb(totalGzip) + 'K', 12)}`)

console.log(`\n首屏关键 JS（★ 标记）：${criticalRefs.length} 个文件`)
console.log(`  原始 ${kb(firstRaw)} KB / gzip ${kb(firstGzip)} KB`)
if (criticalRefs.length) console.log(`  明细: ${criticalRefs.join(', ')}`)

const heavy = rows.filter((r) => r.gzip / 1024 > GZIP_BUDGET_KB)
if (heavy.length) {
  console.log(`\n⚠ gzip 超过 ${GZIP_BUDGET_KB} KB 的块：`)
  for (const r of heavy) console.log(`  - ${r.name}  gzip ${kb(r.gzip)} KB`)
} else {
  console.log(`\n✓ 所有分块 gzip 均在 ${GZIP_BUDGET_KB} KB 预算内`)
}
console.log('')
