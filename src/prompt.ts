import { getAnimeTitle } from "../anime-data"
import type { Language } from "./i18n"

/** 只列该年热度前 N 部里的"未看"，更靠后的列出来也没人关心 */
const UNWATCHED_WINDOW = 10

type RowItem = {
  titleZh: string
  titleEn: string
  titleJa: string
  key: string
}

type Stats = {
  total: number
  good: number
  neutral: number
  bad: number
  rate: number
  active: string[]
  byCount: [string, { good: number; neutral: number; bad: number }][]
  best: [string, { good: number; neutral: number; bad: number }] | null
  worst: [string, { good: number; neutral: number; bad: number }] | null
}

export const computeStats = (
  visibleYears: string[],
  itemsByYear: Map<string, RowItem[]>,
  ratings: Record<string, number | undefined>
): Stats => {
  const perYear = new Map<string, { good: number; neutral: number; bad: number }>()
  let good = 0
  let neutral = 0
  let bad = 0

  for (const year of visibleYears) {
    let g = 0
    let n = 0
    let b = 0
    for (const item of itemsByYear.get(year) || []) {
      const r = ratings[item.key]
      if (r === 1) g++
      else if (r === 2) n++
      else if (r === 3) b++
    }
    if (g + n + b > 0) perYear.set(year, { good: g, neutral: n, bad: b })
    good += g
    neutral += n
    bad += b
  }

  const total = good + neutral + bad
  const active = [...perYear.keys()].sort()
  const byCount = [...perYear.entries()].sort(
    (a, b) =>
      b[1].good + b[1].neutral + b[1].bad - (a[1].good + a[1].neutral + a[1].bad)
  )
  // 好评率最高：只统计评价数 >= 3 的年份，避免"只评一部"造成的噪声
  const enough = [...perYear.entries()].filter(
    ([, v]) => v.good + v.neutral + v.bad >= 3
  )
  const rateOf = (v: { good: number; neutral: number; bad: number }) =>
    v.good / (v.good + v.neutral + v.bad)
  const best = enough.length
    ? enough.reduce((a, b) => (rateOf(b[1]) > rateOf(a[1]) ? b : a))
    : null
  const worst = [...perYear.entries()].sort((a, b) => b[1].bad - a[1].bad)[0] ?? null

  return {
    total,
    good,
    neutral,
    bad,
    rate: total ? Math.round((good / total) * 100) : 0,
    active,
    byCount,
    best,
    worst,
  }
}

type BuildPromptOptions = {
  preset: string
  language: Language
  t: (key: any, vars?: Record<string, string | number>) => string
  visibleYears: string[]
  itemsByYear: Map<string, RowItem[]>
  ratings: Record<string, number | undefined>
}

export const buildPrompt = (o: BuildPromptOptions): string => {
  const { preset, language, t, visibleYears, itemsByYear, ratings } = o
  const stats = computeStats(visibleYears, itemsByYear, ratings)
  // 中日用顿号，英文用逗号
  const sep = language === "en" ? ", " : "、"
  const parts: string[] = [preset, ""]

  if (stats.total > 0) {
    parts.push(`${t("promptStatsHeader")}：`)
    parts.push(
      `- ${t("promptStatTotal", {
        total: stats.total,
        good: stats.good,
        neutral: stats.neutral,
        bad: stats.bad,
      })}`
    )
    parts.push(`- ${t("promptStatRate", { rate: stats.rate })}`)
    if (stats.active.length > 1) {
      parts.push(
        `- ${t("promptStatSpan", {
          from: stats.active[0] ?? "",
          to: stats.active[stats.active.length - 1] ?? "",
        })}`
      )
    }
    const topYears = stats.byCount
      .slice(0, 3)
      .map(([year, v]) => `${year}(${v.good + v.neutral + v.bad})`)
    if (topYears.length) {
      parts.push(`- ${t("promptStatTopYears", { years: topYears.join(sep) })}`)
    }
    if (stats.best) {
      const v = stats.best[1]
      parts.push(
        `- ${t("promptStatBestYear", {
          year: stats.best[0],
          good: v.good,
          total: v.good + v.neutral + v.bad,
        })}`
      )
    }
    if (stats.worst && stats.worst[1].bad > 0) {
      parts.push(
        `- ${t("promptStatWorstYear", {
          year: stats.worst[0],
          count: stats.worst[1].bad,
        })}`
      )
    }
    parts.push("")
  }

  parts.push(`${t("promptRecordHeader")}（${t("promptRatingNote")}）：`)

  for (const year of visibleYears) {
    const items = itemsByYear.get(year) || []
    const good: string[] = []
    const neutral: string[] = []
    const bad: string[] = []
    const unwatched: string[] = []

    items.forEach((item, index) => {
      const title = getAnimeTitle(item, language)
      const r = ratings[item.key]
      if (r === 1) good.push(title)
      else if (r === 2) neutral.push(title)
      else if (r === 3) bad.push(title)
      else if (index < UNWATCHED_WINDOW) unwatched.push(title)
    })

    // 这一年一部都没评价就跳过，避免用"没看过"刷屏
    if (good.length + neutral.length + bad.length === 0) continue

    parts.push("")
    parts.push(`【${year}${t("year")}】`)
    if (good.length) parts.push(`${t("legendGood")}：${good.join(sep)}`)
    if (neutral.length) parts.push(`${t("legendNeutral")}：${neutral.join(sep)}`)
    if (bad.length) parts.push(`${t("legendBad")}：${bad.join(sep)}`)
    if (unwatched.length) {
      parts.push(`${t("legendNone")}：${unwatched.join(sep)}`)
    }
  }

  return parts.join("\n").trim()
}
