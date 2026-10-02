// pipeline-4：生成前端的评测池数据
//
// 输入：data/finalized-top30.json   （pipeline-3 产出，每年 30 部）
// 产出：src/review-data.ts          （前端动态 import 的评测池，约 26×30 部）
//
// 评测池第 1–20 部与 anime-data.ts（表格数据）逐部一致，第 21–30 部是扩展候选。
// 封面图路径约定：<BASE_URL>covers/<bgmId>.jpg（由 pipeline-6-download-covers.mjs 下载）
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PROJ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pool = JSON.parse(fs.readFileSync(`${PROJ}/data/finalized-top30.json`, 'utf8'))
const years = Object.keys(pool).sort()

let body = ''
let total = 0
for (const y of years) {
  body += `  "${y}": [\n`
  for (const k of pool[y]) {
    total++
    body += `    { bgmId: ${k.bgmId}, titleZh: ${JSON.stringify(k.titleZh)}, titleJa: ${JSON.stringify(k.titleJa)}, titleEn: ${JSON.stringify(k.titleEn)} },\n`
  }
  body += `  ],\n`
}

const ts = `// 评测池：每年 30 部（第 1–20 部与 anime-data.ts 表格数据逐部一致，第 21–30 部为扩展候选）
// 由 data/pipeline-4-build-review-pool.mjs 生成，勿手改。
// 封面图放在 public/covers/<bgmId>.jpg，前端用 \${import.meta.env.BASE_URL}covers/ 前缀拼接。
export type ReviewItem = {
  bgmId: number
  titleZh: string
  titleJa: string
  titleEn: string
}

export const reviewPool: Record<string, ReviewItem[]> = {
${body}}
`
fs.writeFileSync(`${PROJ}/src/review-data.ts`, ts, 'utf8')
console.log(`src/review-data.ts 已生成：${years.length} 年 ${total} 部，${(ts.length / 1024).toFixed(0)} KB`)
