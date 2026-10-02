import { useCallback, useEffect, useMemo, useState } from "react"
import animeData from "../anime-data"
import { useI18n } from "./i18n-context"

/** 评测池里的一部作品（由 data/pipeline-4-build-review-pool.mjs 生成） */
export type ReviewItem = {
  bgmId: number
  titleZh: string
  titleJa: string
  titleEn: string
}

/** 评测进度：做到哪一年的第几部 */
export type ReviewProgress = { year: string; index: number }

/** 每年评测池的部数，与 data/pipeline-3-finalize.mjs 的 TARGET 一致 */
export const POOL_PER_YEAR = 30

/**
 * 封面图路径。图片在 public/covers/ 下，走 BASE_URL 拼前缀 ——
 * 直接写 "/covers/..." 在 GitHub Pages 子路径部署时会 404。
 */
export const coverUrl = (bgmId: number) => `${import.meta.env.BASE_URL}covers/${bgmId}.jpg`

const ratingButtonStyles: Record<string, string> = {
  good: "bg-green-500 hover:bg-green-600 text-white border-green-600",
  neutral: "bg-yellow-400 hover:bg-yellow-500 text-zinc-900 border-yellow-500",
  bad: "bg-red-400 hover:bg-red-500 text-white border-red-500",
  none: "bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-300",
}

const KeyHint = ({ children }: { children: string }) => (
  <span className="ml-2 rounded border border-current/30 px-1 text-[10px] opacity-70">
    {children}
  </span>
)

// ---------------------------------------------------------------- 首页

type HomeViewProps = {
  progress: ReviewProgress | null
  onStart: (year: string) => void
  onContinue: () => void
  onOpenTable: () => void
}

export const HomeView = ({ progress, onStart, onContinue, onOpenTable }: HomeViewProps) => {
  const { t } = useI18n()
  const years = useMemo(() => Object.keys(animeData).sort(), [])
  const [year, setYear] = useState(years[0] ?? "2000")

  return (
    <div className="mx-auto flex w-full max-w-screen-sm flex-col items-center gap-6 px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-sm text-zinc-500">{t("homeIntro")}</p>
      </div>

      {progress && (
        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-lg border-2 border-pink-500 bg-pink-50 px-6 py-4 text-left transition-colors hover:bg-pink-100"
        >
          <div className="font-semibold text-pink-700">{t("continueReview")}</div>
          <div className="mt-1 text-sm text-zinc-600">
            {progress.index >= POOL_PER_YEAR
              ? t("yearFinished", { year: progress.year })
              : t("continueFrom", {
                  year: progress.year,
                  index: progress.index + 1,
                  total: POOL_PER_YEAR,
                })}
          </div>
        </button>
      )}

      <div className="w-full rounded-lg border p-4">
        <div className="text-sm text-zinc-600">{t("pickStartYear")}</div>
        <div className="mt-2 flex gap-2">
          <select
            className="flex-1 rounded border bg-white px-2 py-2 text-sm"
            value={year}
            onChange={(e) => setYear(e.currentTarget.value)}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
                {t("year")}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onStart(year)}
            className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-700"
          >
            {t("startReview")}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenTable}
        className="text-sm text-zinc-500 underline hover:text-zinc-800"
      >
        {t("openTable")}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------- 逐部评测

type ReviewViewProps = {
  pool: Record<string, ReviewItem[]>
  years: string[]
  initial: ReviewProgress
  ratings: Record<string, number | undefined>
  onRate: (year: string, item: ReviewItem, value: 0 | 1 | 2 | 3) => void
  onProgress: (p: ReviewProgress) => void
  onExit: () => void
  onOpenTable: () => void
}

export const ReviewView = ({
  pool,
  years,
  initial,
  ratings,
  onRate,
  onProgress,
  onExit,
  onOpenTable,
}: ReviewViewProps) => {
  const { t } = useI18n()
  const [year, setYear] = useState(initial.year)
  const [index, setIndex] = useState(initial.index)
  /**
   * 起始阶段要看进度里的 index：
   * 一年走完时进度会写成 index = 该年池大小（越界值）。如果继续上次时直接进 review，
   * 就会显示一个不存在的作品 —— 封面空白，而且 rate() 里的 `if (!item) return`
   * 会让所有评级按钮失灵。所以越界时直接落到小结页，最后一年则落到「全部完成」页。
   */
  const [stage, setStage] = useState<"review" | "summary" | "done">(() => {
    const size = (pool[initial.year] || []).length
    if (initial.index < size) return "review"
    return years.indexOf(initial.year) === years.length - 1 ? "done" : "summary"
  })
  const [failed, setFailed] = useState<Record<number, boolean>>({})

  const items = pool[year] || []
  const current = stage === "review" ? items[index] : undefined
  const yearIndex = years.indexOf(year)
  const nextYear = years[yearIndex + 1]

  useEffect(() => {
    onProgress({ year, index })
  }, [year, index, onProgress])

  /** 预加载下一张封面，翻页时不会闪白 */
  useEffect(() => {
    const next = items[index + 1]
    if (!next) return
    const img = new Image()
    img.src = coverUrl(next.bgmId)
  }, [items, index])

  const goNextYear = useCallback(() => {
    if (nextYear) {
      setYear(nextYear)
      setIndex(0)
      setStage("review")
    } else {
      setStage("done")
    }
  }, [nextYear])

  const rate = useCallback(
    (value: 0 | 1 | 2 | 3) => {
      const item = items[index]
      if (!item) return
      onRate(year, item, value)
      if (index + 1 >= items.length) {
        setStage("summary")
        onProgress(
          nextYear ? { year: nextYear, index: 0 } : { year, index: items.length }
        )
      } else {
        setIndex(index + 1)
      }
    },
    [items, index, year, onRate, onProgress, nextYear]
  )

  const back = useCallback(() => {
    if (stage === "summary") {
      // 回到该年最后一部。走完时 index 是越界的 items.length，直接进 review 会显示空作品
      setIndex(Math.max(0, (pool[year] || []).length - 1))
      setStage("review")
      return
    }
    if (stage === "done") {
      setStage("summary")
      return
    }
    if (index > 0) {
      setIndex(index - 1)
      return
    }
    const prevYear = years[yearIndex - 1]
    if (prevYear) {
      setYear(prevYear)
      setIndex(Math.max(0, (pool[prevYear] || []).length - 1))
    }
  }, [stage, index, yearIndex, years, pool])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (stage === "review") {
        if (e.key === "1") { e.preventDefault(); rate(1) }
        else if (e.key === "2") { e.preventDefault(); rate(2) }
        else if (e.key === "3") { e.preventDefault(); rate(3) }
        else if (e.key === "4") { e.preventDefault(); rate(0) }
        else if (e.key === "ArrowLeft" || e.key === "Backspace") { e.preventDefault(); back() }
        else if (e.key === "Escape") { e.preventDefault(); onExit() }
      } else if (stage === "summary") {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goNextYear() }
        else if (e.key === "ArrowLeft" || e.key === "Backspace") { e.preventDefault(); back() }
        else if (e.key === "Escape") { e.preventDefault(); onExit() }
      } else if (e.key === "Escape") {
        e.preventDefault()
        onExit()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [stage, rate, back, goNextYear, onExit])

  const summary = useMemo(() => {
    let good = 0, neutral = 0, bad = 0, none = 0
    for (const item of items) {
      const r = ratings[year + ":" + item.titleZh]
      if (r === 1) good++
      else if (r === 2) neutral++
      else if (r === 3) bad++
      else if (r === 0) none++
    }
    return { good, neutral, bad, none }
  }, [items, ratings, year])

  const header = (
    <div className="w-full">
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span>
          {stage === "review"
            ? t("reviewProgress", { year, index: Math.min(index + 1, items.length), total: items.length })
            : t("yearSummary", { year })}
        </span>
        <button type="button" onClick={onExit} className="underline hover:text-zinc-800">
          {t("backHome")}
        </button>
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded bg-zinc-200">
        <div
          className="h-full rounded bg-pink-500 transition-all duration-200"
          style={{ width: `${items.length ? (Math.min(index, items.length) / items.length) * 100 : 0}%` }}
        />
      </div>
    </div>
  )

  if (stage === "done") {
    return (
      <div className="mx-auto flex w-full max-w-screen-sm flex-col items-center gap-6 px-4 py-16 text-center">
        <div className="text-2xl font-bold">{t("reviewDone")}</div>
        <p className="text-sm text-zinc-500">{t("reviewDoneHint")}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onOpenTable}
            className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
          >
            {t("openTable")}
          </button>
          <button
            type="button"
            onClick={onExit}
            className="rounded-md border px-4 py-2 text-sm hover:bg-zinc-100"
          >
            {t("reviewRestart")}
          </button>
        </div>
      </div>
    )
  }

  if (stage === "summary") {
    return (
      <div className="mx-auto flex w-full max-w-screen-sm flex-col items-center gap-6 px-4 py-10">
        {header}
        <div className="w-full rounded-lg border p-6 text-center">
          <div className="text-xl font-bold">{t("yearSummary", { year })}</div>
          <div className="mt-3 text-sm text-zinc-600">
            {t("summaryStat", summary)}
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {nextYear ? (
            <button
              type="button"
              onClick={goNextYear}
              className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
            >
              {t("summaryNextYear", { year: nextYear })}
              <KeyHint>Enter</KeyHint>
            </button>
          ) : (
            <button
              type="button"
              onClick={goNextYear}
              className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
            >
              {t("reviewDone")}
              <KeyHint>Enter</KeyHint>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenTable}
            className="rounded-md border px-4 py-2 text-sm hover:bg-zinc-100"
          >
            {t("summaryToTable")}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-screen-sm flex-col items-center gap-4 px-4 py-6">
      {header}

      <div className="flex h-72 w-48 items-center justify-center overflow-hidden rounded-lg border bg-zinc-100 md:h-96 md:w-64">
        {current && !failed[current.bgmId] ? (
          <img
            src={coverUrl(current.bgmId)}
            alt={current.titleZh}
            className="h-full w-full object-cover"
            onError={() =>
              setFailed((prev) => ({ ...prev, [current.bgmId]: true }))
            }
          />
        ) : (
          <span className="px-4 text-center text-sm text-zinc-400">{t("coverMissing")}</span>
        )}
      </div>

      <div className="text-center">
        <div className="text-xl font-bold leading-snug">{current?.titleZh}</div>
        {current?.titleJa ? (
          <div className="mt-1 text-sm text-zinc-500">{current.titleJa}</div>
        ) : null}
        {current?.titleEn ? (
          <div className="text-sm text-zinc-400">{current.titleEn}</div>
        ) : null}
      </div>

      <div className="grid w-full grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => rate(1)}
          className={`rounded-md border px-4 py-3 text-sm font-medium transition-colors ${ratingButtonStyles.good}`}
        >
          {t("reviewGood")}
          <KeyHint>1</KeyHint>
        </button>
        <button
          type="button"
          onClick={() => rate(2)}
          className={`rounded-md border px-4 py-3 text-sm font-medium transition-colors ${ratingButtonStyles.neutral}`}
        >
          {t("reviewNeutral")}
          <KeyHint>2</KeyHint>
        </button>
        <button
          type="button"
          onClick={() => rate(3)}
          className={`rounded-md border px-4 py-3 text-sm font-medium transition-colors ${ratingButtonStyles.bad}`}
        >
          {t("reviewBad")}
          <KeyHint>3</KeyHint>
        </button>
        <button
          type="button"
          onClick={() => rate(0)}
          className={`rounded-md border px-4 py-3 text-sm font-medium transition-colors ${ratingButtonStyles.none}`}
        >
          {t("reviewNone")}
          <KeyHint>4</KeyHint>
        </button>
        <button
          type="button"
          onClick={back}
          disabled={yearIndex === 0 && index === 0}
          className="col-span-2 rounded-md border px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-40"
        >
          ← {t("reviewPrev")}
        </button>
      </div>

      <p className="text-center text-[11px] text-zinc-400">{t("reviewKeyboardHint")}</p>
    </div>
  )
}
