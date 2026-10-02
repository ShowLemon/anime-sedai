// pipeline-2：把系列规则应用到榜单上，得出每年入选的 30 部
//
// 输入：data/bgm-all-tv-cache.json   （由 pipeline-1 生成）
// 产出：data/planned-top30-by-heat.json  （含 kept / keptAll / dropped 及逐条理由）
//       data/planned-top20.html          （人工核对用的预览页）
//
// ⚠️ 与原会话脚本的差异：原版读的是 bgm-heat-tv-rank-cache.json（每年前 140 条原始数据，
//    结构是 { "2000": [ ... ] }），该文件已随清理删除。这里改读 bgm-all-tv-cache.json
//    （每年前 320 部 TV，结构是 { "2000": { totalAll, tv: [...] } }），所以要取 .tv。
//    用更全的榜单会让候选池更大，最终入选可能有细微差异（更准）。
//
// 规则要点见 HANDOFF.md 第 4 节。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
// PROJ 由脚本自身位置推导（脚本位于 <项目>/data/ 下），换目录/换机器都能跑
const PROJ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const cache = JSON.parse(fs.readFileSync(`${PROJ}/data/bgm-all-tv-cache.json`, 'utf8'))

function independentKey(name) {
  const n = name || ''
  // 外传/Alternative：主角与故事线独立，按独立作品处理
  if (/ソードアート・オンライン オルタナティブ|Sword Art Online Alternative|ガンゲイル・オンライン/i.test(n)) return 'SAO:GGO'
  if (/マギアレコード|魔法纪录/i.test(n)) return 'MADOKA:MAGIRE'
  if (/はたらく細胞BLACK|工作细胞BLACK/i.test(n)) return 'HATARAKU:BLACK'
  if (/とある科学の一方通行|某科学的一方通行/i.test(n)) return 'INDEX:ACCELERATOR'
  if (/とある科学の超電磁砲|某科学的超电磁炮/i.test(n)) return 'INDEX:RAILGUN'
  if (/^ジョジョの奇妙な冒険|^ストーンオーシャン/.test(n)) {
    let s = n.replace(/^ジョジョの奇妙な冒険\s*/, '')
    s = s.replace(/\s*(エジプト編|第[0-9]+部|第[0-9]+章|後編|前編).*$/, '').trim()
    return 'JOJO:' + (s || 'part1-2')
  }
  if (/^ウマ娘/.test(n)) return 'UMA:' + n.replace(/\s*第?[0-9]+部分.*$/, '')
  if (/^機動戦士ガンダム|^ガンダム/.test(n)) {
    if (/00|ダブルオー/.test(n)) return 'GUNDAM:00'
    if (/SEED/.test(n)) return 'GUNDAM:SEED'
    if (/鉄血|オルフェンズ/.test(n)) return 'GUNDAM:IBO'
    if (/水星の魔女/.test(n)) return 'GUNDAM:WFM'
    if (/UC|ユニコーン/.test(n)) return 'GUNDAM:UC'
    return 'GUNDAM:' + n
  }
  if (/^Fate\//.test(n)) {
    if (/Unlimited Blade Works/.test(n)) return 'FATE:UBW'
    if (/stay night/i.test(n)) return 'FATE:SN'
    if (/Zero/.test(n)) return 'FATE:ZERO'
    if (/プリズマ☆イリヤ|kaleid/i.test(n)) return 'FATE:ILYA'
    return 'FATE:' + n
  }
  if (/^ラブライブ/.test(n)) {
    if (/Sunshine/.test(n)) return 'LL:SUNSHINE'
    if (/虹咲/.test(n)) return 'LL:NIJIGASAKI'
    if (/Superstar/.test(n)) return 'LL:SUPERSTAR'
    return 'LL:MU'
  }
  if (/^BanG Dream!/.test(n)) return /MyGO|Ave Mujica|AveMujica|アヴェ・ムジカ/i.test(n) ? 'BANGDREAM:MYGO' : 'BANGDREAM:MAIN'
  if (/^ポケットモンスター/.test(n)) return 'POKE:' + n
  if (/^アイドルマスター/.test(n)) { if (/シンデレラ/.test(n)) return 'IMAS:CG'; if (/ミリオン/.test(n)) return 'IMAS:ML'; return 'IMAS:' + n }
  if (/^デジモン/.test(n)) return 'DIGI:' + n.replace(/\s*第?[0-9]+部分.*$/, '')
  if (/^遊☆戯☆王|^遊戯王/.test(n)) return 'YGO:' + n
  if (/^ギャグマンガ日和/.test(n)) return 'GAGMANGA:' + n
  if (/^ウサビッチ/.test(n)) return 'USAVICH:' + n
  if (/^ペルソナ/.test(n)) return 'PERSONA:' + n
  if (/^WHITE ALBUM/i.test(n)) return 'WA:' + n.replace(/[-‐ー]後半$/, '')
  if (/^ルパン三世/.test(n)) return 'LUPIN:' + n
  if (/^名探偵コナン|^まじっく快斗/.test(n)) return 'CONAN:' + n
  if (/^ドラえもん|^クレヨンしんちゃん|^ONE PIECE|^NARUTO|^BLEACH|^HUNTER×HUNTER|^ドラゴンボール/.test(n)) return 'LONG:' + n
  return null
}

const SPLIT = /第\s*[0-9]+\s*部分|Part\s*[.．]?\s*[0-9]|後半|后半|新編集版|新编集版|特別編集版|特别编集版|総集編|总集篇|Remix|リミックス|HDリマスター|HD重制|前編|後編|前篇|后篇/i
const STRONG_SEQ = /第\s*[0-9一二三四五六七八九十]+\s*[季期部章幕学期]|第\s*[一二三四五六七八九十]+\s*[季期部章]|[一二三四五六七八九十]+学期|シーズン\s*[0-9]|Season\s*[0-9]|[0-9](st|nd|rd|th)\s*Season|Second|Third|Fourth|Final|Ⅱ|Ⅲ|Ⅳ|Ⅴ|A's|R2|続|夢の終わり|梦之终结|完結編|完结篇/i
const NON_JP = /虹猫蓝兔|大耳朵图图|喜羊羊|熊出没|猪猪侠|秦时明月|魁拔|十万个冷笑话/
const SHORT_FORM = /ギャグマンガ日和|搞笑漫画日和|ウサビッチ|监狱兔|ポプテピピック|pop子和pipi美|スポンジ・ボブ|海绵宝宝/
const MONOGATARI = /化物[語语]|偽物[語语]|伪物[語语]|猫物[語语]|傾物[語语]|倾物[語语]|囮物[語语]|鬼物[語语]|恋物[語语]|戀物[語语]|花物[語语]|憑物[語语]|凭物[語语]|終物[語语]|终物[語语]|暦物[語语]|历物[語语]|傷物[語语]|伤物[語语]|物[語语]シリーズ|物语系列/

const norm = s => (s || '').replace(/[\s\u3000]/g, '').replace(/[\u0027\u0060\u00b4\u2018\u2019\u201c\u201d\u0022\u00b0\u203b\u2606\u2605\u266a\u3001\u3002\uff01\uff1f]+$/, '')
const stripLead = s => s.replace(/^(続|续|新|真|俗|懺|忏)[・\s:：]*/, '')
const lcp = (a, b) => { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i }

function tokens(s) {
  const raw = s || ''
  const out = new Set()
  const t = norm(raw)
  if (t.length >= 2) out.add(t)
  const parts = raw.split(/[\s　]+/).filter(Boolean)
  if (parts.length >= 2) {
    const p0 = norm(parts[0]); if (p0.length >= 3) out.add(p0)
    const p01 = norm(parts.slice(0, 2).join('')); if (p01.length >= 5) out.add(p01)
  }
  for (const x of [...out]) { const s2 = stripLead(x); if (s2.length >= 3) out.add(s2) }
  return [...out]
}
function sameSeries(a, b) {
  const ka = [...tokens(a.name), ...tokens(a.nameCn)]
  const kb = [...tokens(b.name), ...tokens(b.nameCn)]
  for (const x of ka) for (const y of kb) {
    if (x === y) return true
    const l = lcp(x, y), mn = Math.min(x.length, y.length)
    if (l === mn && mn >= 4) return true      // 一个是另一个的完整前缀
    if (l >= 8) return true
    if (mn >= 6 && (x.includes(y) || y.includes(x))) return true
  }
  return false
}

const all = []
for (const y of Object.keys(cache)) cache[y].tv.forEach((it, i) => all.push({ year: Number(y), rank: i + 1, id: it.id, name: it.name || '', nameCn: it.nameCn || '', date: it.date || '', score: it.score ?? null, votes: it.votes || 0 }))
const label = x => x.nameCn || x.name

const classify = item => {
  if (NON_JP.test(item.name) || NON_JP.test(item.nameCn)) return { keep: false, why: '非日本动画，不收录' }
  if (SHORT_FORM.test(item.name) || SHORT_FORM.test(item.nameCn)) return { keep: false, why: '无主旨短篇集，不收录' }
  const earlier = x => x.year < item.year || (x.year === item.year && x.rank < item.rank)
  const isSplit = SPLIT.test(item.name) || SPLIT.test(item.nameCn)

  if (isSplit) {
    const first = all.find(x => sameSeries(x, item) && earlier(x))
    if (first) return { keep: false, why: `分割放送/总集篇，并入 ${first.year}《${label(first)}》` }
  }
  const ikey = independentKey(item.name)
  if (ikey) {
    const first = all.find(x => independentKey(x.name) === ikey && earlier(x))
    if (first) return { keep: false, why: `同一部作品的续季，并入 ${first.year}《${label(first)}》` }
    return { keep: true, why: '独立系列·新的一部' }
  }
  const first = all.find(x => sameSeries(x, item) && earlier(x))
  if (first) return { keep: false, why: `连贯续作，首部 ${first.year}《${label(first)}》` }
  return { keep: true, why: (STRONG_SEQ.test(item.name) || STRONG_SEQ.test(item.nameCn)) ? '首部早于起始年，按新作处理' : '新作' }
}

const out = {}
for (const y of Object.keys(cache).sort()) {
  const kept = [], dropped = []
  cache[y].tv.forEach((_, i) => {
    const item = all.find(a => a.year === Number(y) && a.rank === i + 1)
    const c = classify(item)
    const rec = { rank: item.rank, id: item.id, name: item.name, nameCn: item.nameCn, date: item.date, score: item.score, votes: item.votes, why: c.why }
    ;(c.keep ? kept : dropped).push(rec)
  })
  out[y] = { kept: kept.slice(0, 30), keptAll: kept, dropped, totalKept: kept.length }
}
fs.writeFileSync(`${PROJ}/data/planned-top30-by-heat.json`, JSON.stringify(out, null, 1), 'utf8')

for (const y of Object.keys(out)) console.log(`${y}: 保留${out[y].kept.length} 剔除${out[y].dropped.length} | ` + out[y].kept.slice(0, 6).map(k => (k.nameCn || k.name)).join(' / '))
console.log('\n注意：kept 只取前 30；keptAll 是完整候选池，供国别过滤后补位使用。')
