// pipeline-5：抓取评测池封面图并本地化到 public/covers/
//
// 输入：data/finalized-top30.json      （pipeline-3 产出，780 部）
// 产出：public/covers/<bgmId>.jpg      （bgm「common」尺寸 = r/400，约 40 KB/张）
//       data/bgm-cover-urls.json       （bgmId -> images URL 缓存）
//       data/cover-failures.json       （失败清单，重跑即续传）
//
// 依赖代理（bgm.tv 域名 DNS 被污染，直连不通）：
//   $env:NODE_USE_ENV_PROXY="1"; $env:HTTP_PROXY="http://127.0.0.1:7890"; $env:HTTPS_PROXY="http://127.0.0.1:7890"
//
// 说明：
//   - 封面文件名带随机后缀（如 2784_DiZ0d.jpg），无法由 id 拼出，必须逐个查 API 拿 images
//   - 脚本可重复运行：URL 有缓存、图片已存在且大于 1 KB 就跳过，天然断点续传
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PROJ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const UA = 'anime-sedai-local/0.1 (https://github.com/egoist/anime-sedai)'
const SIZE = 'common'          // r/400
const URL_WORKERS = 2          // 查 API 的并发（实测 2 并发 + 250ms 间隔约 3.6 分钟跑完 780 个）
const IMG_WORKERS = 4          // 下载图片的并发
const sleep = ms => new Promise(r => setTimeout(r, ms))

const COVER_DIR = `${PROJ}/public/covers`
const URL_CACHE = `${PROJ}/data/bgm-cover-urls.json`
const FAILURES = `${PROJ}/data/cover-failures.json`

fs.mkdirSync(COVER_DIR, { recursive: true })

const pool = JSON.parse(fs.readFileSync(`${PROJ}/data/finalized-top30.json`, 'utf8'))
const ids = [...new Set(Object.values(pool).flat().map(k => k.bgmId))]
console.log(`评测池 ${ids.length} 部（去重后）`)

const coverPath = id => `${COVER_DIR}/${id}.jpg`
const hasCover = id => fs.existsSync(coverPath(id)) && fs.statSync(coverPath(id)).size > 1024

async function runPool(items, concurrency, worker) {
  let idx = 0
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (idx < items.length) {
      const i = idx++
      await worker(items[i], i)
    }
  }))
}

// ---- 阶段 1：补齐封面 URL ----
let urls = fs.existsSync(URL_CACHE) ? JSON.parse(fs.readFileSync(URL_CACHE, 'utf8')) : {}
const needUrl = ids.filter(id => !urls[String(id)]?.[SIZE])
console.log(`URL 缓存 ${Object.keys(urls).length} 条，待查 ${needUrl.length} 条`)
let urlDone = 0, urlFail = 0
const t0 = Date.now()
await runPool(needUrl, URL_WORKERS, async id => {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const r = await fetch(`https://api.bgm.tv/v0/subjects/${id}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
      })
      if (r.status === 429) { await sleep(5000); continue }
      if (!r.ok) throw new Error('HTTP ' + r.status)
      const j = await r.json()
      urls[String(id)] = j.images || null
      break
    } catch (e) {
      if (attempt === 4) { urlFail++; console.log(`  取 URL 失败 ${id}: ${e.message}`) }
      await sleep(1500)
    }
  }
  await sleep(250)
  urlDone++
  if (urlDone % 100 === 0) console.log(`  URL ${urlDone}/${needUrl.length}，已用 ${((Date.now() - t0) / 1000).toFixed(0)}s`)
})
fs.writeFileSync(URL_CACHE, JSON.stringify(urls, null, 1), 'utf8')
console.log(`URL 阶段完成：新增 ${urlDone}，失败 ${urlFail}，缓存共 ${Object.keys(urls).length} 条`)

// ---- 阶段 2：下载图片 ----
const needImg = ids.filter(id => !hasCover(id))
const skipped = ids.length - needImg.length
console.log(`待下载 ${needImg.length} 张（已有 ${skipped} 张跳过）`)
let ok = 0, bytes = 0
const failures = []
let imgDone = 0
const t1 = Date.now()
await runPool(needImg, IMG_WORKERS, async id => {
  const u = urls[String(id)]?.[SIZE]
  if (!u) { failures.push({ id, reason: 'no url' }); imgDone++; return }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) })
      if (r.status === 429) { await sleep(5000); continue }
      if (!r.ok) throw new Error('HTTP ' + r.status)
      const b = Buffer.from(await r.arrayBuffer())
      if (b.length < 1024) throw new Error('文件过小 ' + b.length)
      fs.writeFileSync(coverPath(id), b)
      ok++
      bytes += b.length
      break
    } catch (e) {
      if (attempt === 3) failures.push({ id, reason: e.message })
      await sleep(1500)
    }
  }
  imgDone++
  if (imgDone % 100 === 0) {
    console.log(`  图片 ${imgDone}/${needImg.length}，新增 ${(bytes / 1048576).toFixed(1)} MB，已用 ${((Date.now() - t1) / 1000).toFixed(0)}s`)
  }
})
fs.writeFileSync(FAILURES, JSON.stringify(failures, null, 1), 'utf8')

// ---- 汇总 ----
const totalSize = ids.filter(hasCover).reduce((s, id) => s + fs.statSync(coverPath(id)).size, 0)
const missing = ids.filter(id => !hasCover(id))
console.log(`\n完成：本次下载 ${ok} 张 / ${(bytes / 1048576).toFixed(1)} MB`)
console.log(`public/covers/ 现有 ${ids.length - missing.length}/${ids.length} 张，合计 ${(totalSize / 1048576).toFixed(1)} MB`)
if (missing.length) {
  console.log(`仍缺 ${missing.length} 张（清单见 data/cover-failures.json），重跑本脚本即可续传`)
  console.log('  ' + missing.slice(0, 20).join(', '))
} else {
  console.log('封面齐了 ✓')
}
