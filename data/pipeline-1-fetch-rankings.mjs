// pipeline-1：抓取 bgm.tv 逐年榜单
//
// 依赖：代理（bgm.tv 域名 DNS 被污染），运行前设置
//   $env:NODE_USE_ENV_PROXY="1"; $env:HTTP_PROXY="http://127.0.0.1:7890"; $env:HTTPS_PROXY="http://127.0.0.1:7890"
// 产出：data/bgm-all-tv-cache.json
// 耗时：约 30 分钟（26 年 × 每年翻页到 320 部 TV，请求间隔 2.3 秒）
//
// 注意：limit 参数传再大也只返回 20 条，只能靠 offset 翻页。
import fs from 'node:fs'
const PROJ = 'D:/DSH/37. anime-sedai 本地复刻'
const UA = 'anime-sedai-local/0.1 (https://github.com/egoist/anime-sedai)'
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function page(y, offset) {
  const body = { keyword: '', sort: 'heat', filter: { type: [2], air_date: [`>=${y}-01-01`, `<${y + 1}-01-01`], nsfw: false } }
  for (let a = 1; a <= 5; a++) {
    try {
      const r = await fetch(`https://api.bgm.tv/v0/search/subjects?limit=20&offset=${offset}`, {
        method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/json' },
        body: JSON.stringify(body), signal: AbortSignal.timeout(30000),
      })
      if (r.status === 429) { await sleep(30000); continue }
      if (!r.ok) throw new Error('HTTP ' + r.status)
      return await r.json()
    } catch (e) { if (a === 5) return null; await sleep(6000) }
  }
  return null
}

const out = {}
for (let y = 2000; y <= 2025; y++) {
  const tv = []
  let total = 0
  for (let off = 0; off <= 900; off += 20) {
    const j = await page(y, off)
    if (!j || !j.data || j.data.length === 0) break
    total = j.total
    for (const it of j.data) {
      if (it.platform !== 'TV') continue
      tv.push({ id: it.id, name: it.name, nameCn: it.name_cn || '', date: it.date || '', votes: it.rating?.total ?? 0 })
    }
    await sleep(2300)
    if (tv.length >= 320) break
  }
  out[y] = { totalAll: total, tv }
  console.log(`${y}: TV ${tv.length} (当年全部类型 ${total})`)
  await sleep(2300)
}
fs.writeFileSync(`${PROJ}/data/bgm-all-tv-cache.json`, JSON.stringify(out, null, 1), 'utf8')
console.log('DONE')
