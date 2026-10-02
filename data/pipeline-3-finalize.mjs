// pipeline-3：国别过滤 + 补英文名，产出每年 30 部的最终评测名单
//
// 输入：data/planned-top30-by-heat.json   （pipeline-2 产出，含 keptAll 完整候选池）
//       data/anime-data-v2.json           （现有表格数据，每年 20 部，作为评测池的前 20 部）
//       data/anilist-media.json           （AniList 元数据缓存，命中就不联网）
//       data/vendor/bangumi-data.json     （bgm id -> AniList id / 英文名映射）
// 产出：data/finalized-top30.json         （每年 30 部 = 现有 20 部 + 新补 10 部）
//       data/anilist-media.json           （补写查到的元数据）
//       data/bgm-search-cache.json        （bgm id -> AniList id 的搜索兜底缓存）
//
// ⚠️ 为什么前 20 部不取 pipeline-2 重跑的结果：
//   现有表格数据是当初用「每年前 140 条」的榜单跑出来的；归档版 pipeline-2 改读
//   「每年前 320 部」的更全榜单后，候选池变大，系列规则的误判随之出现 ——
//   例如 2010《天使的心跳！》被判成 2008《天使的朋友》的续作、2012《Another》被判成
//   2002《野性之七人 Another 谋略运河》的续作，两部都被错误剔除。
//   所以前 20 部一律以 data/anime-data-v2.json 为准（保证与表格、与已有评级完全对得上），
//   只在候选池里「续着往后取」10 部补到 30 部。
//
// 联网说明：graphql.anilist.co 直连可用，不需要代理；有 429 重试，结果落盘缓存。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PROJ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TARGET = 30        // 每年评测池要凑多少部
const CAND_PER_YEAR = 80 // 每年参与判定的候选数（剔除泡面番/R18 后仍要能补满 10 部）
const sleep = ms => new Promise(r => setTimeout(r, ms))

const planned = JSON.parse(fs.readFileSync(`${PROJ}/data/planned-top30-by-heat.json`, 'utf8'))
const v2 = JSON.parse(fs.readFileSync(`${PROJ}/data/anime-data-v2.json`, 'utf8'))
const MEDIA = `${PROJ}/data/anilist-media.json`
const SEARCH_CACHE = `${PROJ}/data/bgm-search-cache.json`
const bg = JSON.parse(fs.readFileSync(`${PROJ}/data/vendor/bangumi-data.json`, 'utf8'))

// ---- bgm id -> { AniList id, 英文名 } ----
const map = new Map()
for (const it of bg.items) {
  const bgm = (it.sites || []).find(s => s.site === 'bangumi')?.id
  if (!bgm) continue
  map.set(String(bgm), {
    aniList: (it.sites || []).find(s => s.site === 'aniList')?.id || null,
    en: (it.titleTranslate?.en || [])[0] || null,
  })
}

// ---- 候选池 ----
const cand = []
for (const y of Object.keys(planned).sort()) {
  planned[y].keptAll.slice(0, CAND_PER_YEAR).forEach((k, i) => {
    const m = map.get(String(k.id))
    cand.push({
      year: Number(y), ord: i, ...k,
      aniListId: m?.aniList ? String(m.aniList) : null,
      enFallback: m?.en || null,
    })
  })
}
console.log(`候选 ${cand.length} 部，其中有 AniList 映射 ${cand.filter(c => c.aniListId).length} 部`)

// ---- 元数据：先用缓存，未命中的批量查 ----
let media = fs.existsSync(MEDIA) ? JSON.parse(fs.readFileSync(MEDIA, 'utf8')) : {}
// 缓存命中但缺 duration 的也要补查（判定泡面番需要 duration）
const metaOf = c => (c.aniListId ? media[String(c.aniListId)] : null)
const need = [...new Set(
  cand.filter(c => c.aniListId && (!metaOf(c) || metaOf(c).duration === undefined)).map(c => Number(c.aniListId))
)]
console.log(`元数据缓存 ${Object.keys(media).length} 条，待查 ${need.length} 条`)

const Q = `query ($ids: [Int]) { Page(page: 1, perPage: 50) { media(id_in: $ids, type: ANIME) { id countryOfOrigin duration isAdult genres title { romaji english native } } } }`
for (let i = 0; i < need.length; i += 50) {
  const batch = need.slice(i, i + 50)
  for (let attempt = 1; attempt <= 8; attempt++) {
    try {
      const r = await fetch('https://graphql.anilist.co', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query: Q, variables: { ids: batch } }), signal: AbortSignal.timeout(30000),
      })
      if (r.status === 429) {
        const w = (Number(r.headers.get('retry-after')) || 20) * 1000 + 1500
        console.log(`  429，等 ${(w / 1000).toFixed(0)}s`)
        await sleep(w)
        continue
      }
      const j = await r.json()
      for (const m of j?.data?.Page?.media || []) {
        media[String(m.id)] = {
          ...(media[String(m.id)] || {}),
          countryOfOrigin: m.countryOfOrigin,
          duration: m.duration,
          isAdult: m.isAdult,
          genres: m.genres,
          title: m.title,
        }
      }
      for (const id of batch) if (!media[String(id)]) media[String(id)] = null
      break
    } catch (e) {
      console.log('  批次失败 ' + e.message)
      await sleep(4000)
    }
  }
  await sleep(1200)
}
fs.writeFileSync(MEDIA, JSON.stringify(media), 'utf8')
console.log(`元数据缓存写回：${Object.keys(media).length} 条`)

// ---- 无映射候选：用作品名搜索兜底（结果按 bgm id 缓存，重跑不再联网） ----
let searchCache = fs.existsSync(SEARCH_CACHE) ? JSON.parse(fs.readFileSync(SEARCH_CACHE, 'utf8')) : {}
const noId = cand.filter(c => !c.aniListId)
const todo = noId.filter(c => !(String(c.id) in searchCache))
console.log(`无映射候选 ${noId.length} 部，其中待搜索 ${todo.length} 部（已缓存 ${noId.length - todo.length} 部）`)

const S = `query ($s: String) { Page(page: 1, perPage: 3) { media(search: $s, type: ANIME) { id countryOfOrigin title { romaji english native } } } }`
let rescued = 0
for (const c of todo) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch('https://graphql.anilist.co', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query: S, variables: { s: c.name } }), signal: AbortSignal.timeout(25000),
      })
      if (r.status === 429) {
        const w = (Number(r.headers.get('retry-after')) || 20) * 1000 + 1500
        console.log(`  429，等 ${(w / 1000).toFixed(0)}s`)
        await sleep(w)
        continue
      }
      const j = await r.json()
      const m = j?.data?.Page?.media?.[0]
      searchCache[String(c.id)] = m ? String(m.id) : null
      if (m) {
        media[String(m.id)] = { ...(media[String(m.id)] || {}), countryOfOrigin: m.countryOfOrigin, title: m.title }
      }
      break
    } catch (e) {
      await sleep(4000)
    }
  }
  if (!(String(c.id) in searchCache)) searchCache[String(c.id)] = null
  await sleep(1100)
}
fs.writeFileSync(SEARCH_CACHE, JSON.stringify(searchCache, null, 1), 'utf8')
fs.writeFileSync(MEDIA, JSON.stringify(media), 'utf8')

for (const c of noId) {
  const hit = searchCache[String(c.id)]
  if (hit) {
    c.aniListId = String(hit)
    if (media[String(hit)]?.countryOfOrigin === 'JP') rescued++
  }
}
console.log(`搜索兜底可用日番 ${rescued} 部（缓存 ${Object.keys(searchCache).length} 条）`)

// ---- 组装：前 20 部沿用现有表格数据，再往后补到 30 部 ----
const out = {}
let addedTotal = 0
for (const y of Object.keys(planned).sort()) {
  const base = (v2[y] || []).map(k => ({ ...k }))
  const used = new Set(base.map(k => String(k.bgmId)))
  const list = cand.filter(c => c.year === Number(y)).sort((a, b) => a.ord - b.ord)
  const extra = []
  for (const c of list) {
    if (base.length + extra.length >= TARGET) break
    if (used.has(String(c.id))) continue
    const meta = c.aniListId ? media[String(c.aniListId)] : null
    if (meta?.countryOfOrigin !== 'JP') continue
    // 与搜索索引口径保持一致：剔除 R18 与泡面番（单集 ≤5 分钟）
    if (meta?.isAdult || (meta?.genres || []).includes('Hentai')) continue
    if (meta?.duration != null && meta.duration <= 5) continue
    used.add(String(c.id))
    extra.push({
      titleZh: c.nameCn || c.name,
      titleJa: c.name,
      titleEn: meta?.title?.english || meta?.title?.romaji || c.enFallback || '',
      bgmId: c.id,
      aniListId: Number(c.aniListId),
      date: c.date,
    })
  }
  out[y] = [...base, ...extra]
  addedTotal += extra.length
}
fs.writeFileSync(`${PROJ}/data/finalized-top30.json`, JSON.stringify(out, null, 1), 'utf8')

const all = Object.values(out).flat()
console.log(`\n最终 ${Object.keys(out).length} 年 ${all.length} 部（新补 ${addedTotal} 部），英文名覆盖 ${all.filter(k => k.titleEn).length}/${all.length}`)
const short = Object.entries(out).filter(([, l]) => l.length < TARGET)
console.log(`每年 ${TARGET} 部校验：` + (short.length === 0 ? '全部达标 ✓' : `有 ${short.length} 年不足`))
for (const [y, l] of short) console.log(`  ${y}: ${l.length} 部`)

// ---- 校验：每年前 20 部必须与表格数据逐部一致 ----
let bad = 0
for (const y of Object.keys(v2)) {
  const oldList = v2[y].map(k => k.titleZh).join('|')
  const newList = (out[y] || []).slice(0, v2[y].length).map(k => k.titleZh).join('|')
  if (oldList !== newList) { bad++; console.log(`[不一致] ${y}`) }
}
console.log(`前 20 部与表格一致性：` + (bad === 0 ? '全部一致 ✓' : `${bad} 年不一致 ✗`))
