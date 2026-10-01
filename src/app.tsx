import { useMemo, useRef, useState, useEffect } from "react"
import animeData, { getAnimeTitle } from "../anime-data"
import { domToBlob } from "modern-screenshot"
import { toast } from "sonner"
import { usePersistState } from "./hooks"
import { useI18n } from "./i18n-context"
import { LanguageToggle } from "./LanguageToggle"
import { getPromptTemplate } from "./i18n"
import { searchIndex, type SearchItem } from "./search-index"
import { buildPrompt } from "./prompt"
import { Changelog } from "./changelog"

type YearRange = "5" | "10" | "15" | "all"

/** 1 = 好评(绿)，2 = 中立(黄)，3 = 差评(红)；没有记录 = 没看过(白) */
type Rating = 1 | 2 | 3

const yearRangeOptions: YearRange[] = ["5", "10", "15", "all"]
const ratingCycle: Rating[] = [1, 2, 3]
const ratingClassNames: Record<Rating, string> = {
  1: "bg-green-500",
  2: "bg-yellow-400",
  3: "bg-red-400",
}
const allYears = Object.keys(animeData).sort((a, b) => Number(a) - Number(b))

/** 点击循环：没看过 -> 好评 -> 中立 -> 差评 -> 没看过 */
const nextRating = (current: Rating | undefined): Rating | undefined => {
  if (current === undefined) return ratingCycle[0]

  return ratingCycle[ratingCycle.indexOf(current) + 1]
}

/** 标题 -> 年份，用于把早期以标题为键的数据迁移成「年:标题」键 */
const titleYearMap = new Map<string, string>()
for (const [year, items] of Object.entries(animeData)) {
  for (const item of items) {
    if (!titleYearMap.has(item.titleZh)) titleYearMap.set(item.titleZh, year)
  }
}

/**
 * 迁移历史数据。键的形态变过两次：
 *   1. selectedAnime: string[]            —— 只记「看过」
 *   2. animeRatings: Record<标题, 评级>    —— 四态评级，但同名作品会串（刃牙 2001/2018）
 * 现在统一为 Record<"年份:标题", 评级>
 */
const loadLegacyRatings = (): Record<string, Rating> => {
  try {
    const legacyArr = localStorage.getItem("selectedAnime")
    if (legacyArr) {
      const titles: unknown = JSON.parse(legacyArr)
      const migrated: Record<string, Rating> = {}
      if (Array.isArray(titles)) {
        for (const title of titles) {
          if (typeof title !== "string") continue
          const year = titleYearMap.get(title)
          if (year) migrated[year + ":" + title] = 1
        }
      }
      localStorage.removeItem("selectedAnime")
      return migrated
    }

    const prev = localStorage.getItem("animeRatings")
    if (prev) {
      const parsed: unknown = JSON.parse(prev)
      const migrated: Record<string, Rating> = {}
      if (parsed && typeof parsed === "object") {
        for (const [title, rating] of Object.entries(parsed as Record<string, Rating>)) {
          if (title.includes(":")) {
            migrated[title] = rating
            continue
          }
          const year = titleYearMap.get(title)
          if (year) migrated[year + ":" + title] = rating
        }
      }
      localStorage.removeItem("animeRatings")
      return migrated
    }

    return {}
  } catch {
    return {}
  }
}

export const App = () => {
  const { t, language } = useI18n()
  const [ratings, setRatings] = usePersistState<Record<string, Rating>>(
    "animeRatingsV2",
    loadLegacyRatings
  )
  const [yearRange, setYearRange] = usePersistState<YearRange>(
    "yearRange",
    "all"
  )

  /** 全局搜索关键词 */
  const [query, setQuery] = useState("")

  /** 按年选择面板：当前展开的年份与面板内关键词 */
  const [pickerYear, setPickerYear] = useState<string | null>(null)
  const [pickerQuery, setPickerQuery] = useState("")

  const visibleYears = useMemo(() => {
    if (yearRange === "all") {
      return allYears
    }

    return allYears.slice(-Number(yearRange))
  }, [yearRange])

  /** 年份 -> 搜索索引里的作品，避免每次渲染都全量遍历 */
  const searchByYear = useMemo(() => {
    const map = new Map<number, SearchItem[]>()
    for (const item of searchIndex) {
      const list = map.get(item.year)
      if (list) {
        list.push(item)
      } else {
        map.set(item.year, [item])
      }
    }
    return map
  }, [])

  /** 每年实际展示的作品 = 默认名单 + 用户通过搜索追加进来的 */
  const itemsByYear = useMemo(() => {
    const map = new Map<
      string,
      { titleZh: string; titleEn: string; titleJa: string; key: string }[]
    >()
    for (const year of visibleYears) {
      const base = animeData[year] || []
      const baseKeys = new Set(base.map((item) => item.titleZh))
      const extra = (searchByYear.get(Number(year)) || []).filter((item) => {
        return ratings[year + ":" + item.titleZh] !== undefined && !baseKeys.has(item.titleZh)
      })
      map.set(year, [
        ...base.map((item) => ({ ...item, key: year + ":" + item.titleZh })),
        ...extra.map((item) => ({ ...item, key: year + ":" + item.titleZh })),
      ])
    }
    return map
  }, [visibleYears, searchByYear, ratings])

  const visibleAnimeKeys = useMemo(() => {
    const keys: string[] = []
    for (const year of visibleYears) {
      for (const item of itemsByYear.get(year) || []) keys.push(item.key)
    }
    return keys
  }, [visibleYears, itemsByYear])

  /** 补齐到最大列数，让表格保持矩形 */
  const maxItemsPerYear = useMemo(() => {
    let max = 0
    for (const list of itemsByYear.values()) {
      max = Math.max(max, list.length)
    }
    return max
  }, [itemsByYear])

  const visibleAnimeKeySet = useMemo(() => {
    return new Set(visibleAnimeKeys)
  }, [visibleAnimeKeys])

  const ratedVisibleAnimeCount = visibleAnimeKeys.filter((title) => {
    return ratings[title] !== undefined
  }).length

  /** 当前表格里已经出现过的作品 */
  const tableKeySet = useMemo(() => {
    const set = new Set<string>()
    for (const list of itemsByYear.values()) {
      for (const item of list) set.add(item.key)
    }
    return set
  }, [itemsByYear])

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return searchIndex
      .filter((item) => {
        return (
          item.titleZh.toLowerCase().includes(q) ||
          item.titleEn.toLowerCase().includes(q) ||
          item.titleJa.toLowerCase().includes(q)
        )
      })
      .slice(0, 40)
  }, [query])

  /** 当年全部作品（供按年选择面板使用） */
  const pickerItems = useMemo(() => {
    if (!pickerYear) return []
    const list = searchByYear.get(Number(pickerYear)) || []
    const q = pickerQuery.trim().toLowerCase()
    if (!q) return list
    return list.filter((item) => {
      return (
        item.titleZh.toLowerCase().includes(q) ||
        item.titleEn.toLowerCase().includes(q) ||
        item.titleJa.toLowerCase().includes(q)
      )
    })
  }, [pickerYear, pickerQuery, searchByYear])

  /** 滚动到某个格子并闪一下，用来回应「这作品在表里哪儿」 */
  const flashCell = (key: string) => {
    const el = document.querySelector('[data-anime-key="' + CSS.escape(key) + '"]')
    if (!(el instanceof HTMLElement)) return
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" })
    el.classList.add("flash")
    window.setTimeout(() => el.classList.remove("flash"), 1400)
  }

  const pickFromSearch = (item: SearchItem) => {
    const key = item.year + ":" + item.titleZh
    if (tableKeySet.has(key)) {
      flashCell(key)
      return
    }
    setRatings((prev) => ({ ...prev, [key]: 1 }))
    setQuery("")
    window.setTimeout(() => flashCell(key), 150)
  }

  const getYearRangeLabel = (option: YearRange) => {
    switch (option) {
      case "5":
        return t("last5Years")
      case "10":
        return t("last10Years")
      case "15":
        return t("last15Years")
      case "all":
        return t("allYears")
    }
  }

  const wrapper = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = t("title")
  }, [language, t])

  const imageToBlob = async () => {
    if (!wrapper.current) return

    const blob = await domToBlob(wrapper.current, {
      scale: 2,
      filter(el) {
        if (el instanceof HTMLElement && el.classList.contains("remove")) {
          return false
        }
        return true
      },
    })

    return blob
  }

  const copyImage = async () => {
    const blob = await imageToBlob()

    if (!blob) return

    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ])
  }

  const downloadImage = async () => {
    if (!wrapper.current) return

    const blob = await imageToBlob()

    if (!blob) return

    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "anime-sedai.png"
    a.click()

    URL.revokeObjectURL(url)
  }

  const [promptType, setPromptType] = useState<"normal" | "zako">("zako")
  const prompt = useMemo(() => {
    const templates = getPromptTemplate(language)
    const preset = promptType === "normal" ? templates.normal : templates.zako

    return buildPrompt({
      preset,
      language,
      t,
      visibleYears,
      itemsByYear,
      ratings,
    })
  }, [ratings, promptType, language, t, visibleYears, itemsByYear])

  const totalAnime = visibleAnimeKeys.length

  return (
    <>
      <div className="flex flex-col gap-4 pb-10">
        <div className="p-4 flex flex-col md:items-center">
          <div className="flex w-full flex-col gap-2 mb-4 md:flex-row md:items-center md:justify-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{t("yearRange")}:</span>
              <select
                className="border rounded px-2 py-1 text-sm bg-white"
                value={yearRange}
                onChange={(e) => {
                  setYearRange(e.currentTarget.value as YearRange)
                }}
              >
                {yearRangeOptions.map((option) => (
                  <option key={option} value={option}>
                    {getYearRangeLabel(option)}
                  </option>
                ))}
              </select>
            </div>
            <LanguageToggle />
            <div className="relative w-full md:w-80">
              <input
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                placeholder="搜索全部作品（中文 / 英文 / 日文）"
                className="w-full border rounded px-2 py-1 text-sm bg-white"
              />
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-20 max-h-80 overflow-y-auto border rounded bg-white shadow-lg text-sm">
                  {searchResults.map((item) => {
                    const key = item.year + ":" + item.titleZh
                    const rating = ratings[key]
                    const inTable = tableKeySet.has(key)
                    return (
                      <button
                        key={item.year + "-" + item.titleZh}
                        type="button"
                        onClick={() => pickFromSearch(item)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-zinc-100 border-b last:border-b-0"
                      >
                        <span className="text-zinc-400 w-10 shrink-0">{item.year}</span>
                        <span className="flex-1 truncate">
                          {item.titleZh}
                          {item.titleEn ? (
                            <span className="text-zinc-400 ml-1">{item.titleEn}</span>
                          ) : null}
                        </span>
                        {rating ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500 text-white shrink-0">
                            表中
                          </span>
                        ) : inTable ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-600 shrink-0">
                            未选
                          </span>
                        ) : (
                          <span className="text-[10px] text-blue-600 shrink-0">＋ 添加</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <div
              className="flex flex-col border border-b-0 bg-white w-fit mx-auto"
              ref={wrapper}
            >
              <div className="border-b justify-between p-2 text-lg  font-bold flex">
                <h1>
                  {t("title")}
                  <span className="remove"> - {t("subtitle")}</span>
                </h1>
                <span className="shrink-0 whitespace-nowrap">
                  {t("watchedCount", {
                    count: ratedVisibleAnimeCount,
                    total: totalAnime,
                  })}
                </span>
              </div>
              <div className="border-b flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-2 py-1.5 text-xs text-zinc-600">
                <span className="inline-flex items-center gap-1">
                  <span className="size-3 border border-zinc-400 bg-green-500" />
                  {t("legendGood")}
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="size-3 border border-zinc-400 bg-yellow-400" />
                  {t("legendNeutral")}
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="size-3 border border-zinc-400 bg-red-400" />
                  {t("legendBad")}
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="size-3 border border-zinc-400 bg-white" />
                  {t("legendNone")}
                </span>
              </div>
              {visibleYears.map((year) => {
                const items = itemsByYear.get(year) || []
                return (
                  <div key={year} className="flex border-b">
                    <div
                      className={`
                      bg-zinc-800 shrink-0 text-white flex items-center font-bold justify-center p-1 border-black
                      h-16 md:h-20 
                      ${language === "en" ? "w-16 md:w-20" : "w-16 md:w-20"}
                    `}
                    >
                      <span
                        className={`${
                          language === "en"
                            ? "text-sm md:text-base"
                            : "text-base"
                        } text-center`}
                      >
                        {year}
                      </span>
                    </div>
                    <div className="flex shrink-0">
                      {items.map((item) => {
                        const animeKey = item.key
                        const displayTitle = getAnimeTitle(item, language)
                        const rating = ratings[animeKey]
                        return (
                          <button
                            key={animeKey}
                            data-anime-key={animeKey}
                            className={`
                              h-16 md:h-20 
                              ${
                                language === "en"
                                  ? "w-20 md:w-24"
                                  : "w-16 md:w-20"
                              }
                              border-l break-words text-center shrink-0 inline-flex items-center 
                              p-1 overflow-hidden justify-center cursor-pointer 
                              ${language === "en" ? "text-xs" : "text-sm"} 
                              ${
                                rating
                                  ? ratingClassNames[rating]
                                  : "hover:bg-zinc-100"
                              }
                              transition-colors duration-200
                            `}
                            title={displayTitle}
                            onClick={() => {
                              setRatings((prev) => {
                                const next = { ...prev }
                                const value = nextRating(prev[animeKey])

                                if (value === undefined) {
                                  delete next[animeKey]
                                } else {
                                  next[animeKey] = value
                                }

                                return next
                              })
                            }}
                          >
                            <span
                              className={`leading-tight w-full ${
                                language === "en"
                                  ? "line-clamp-4"
                                  : "line-clamp-3"
                              }`}
                            >
                              {displayTitle}
                            </span>
                          </button>
                        )
                      })}
                      {Array.from(
                        { length: Math.max(0, maxItemsPerYear - items.length) },
                        (_, index) => (
                          <div
                            key={`empty-${index}`}
                            className={`
                            h-16 md:h-20 
                            ${
                              language === "en"
                                ? "w-20 md:w-24"
                                : "w-16 md:w-20"
                            }
                            border-l bg-gray-50
                          `}
                          />
                        )
                      )}
                      <div className="w-0 h-16 md:h-20 border-r" />
                    </div>
                    <div className="sticky right-0 flex items-center border-l border-b bg-white px-1">
                      <button
                        type="button"
                        className="remove text-xs text-zinc-400 hover:text-blue-600 border rounded px-1.5 py-0.5 whitespace-nowrap"
                        onClick={() => {
                          setPickerQuery("")
                          setPickerYear(pickerYear === year ? null : year)
                        }}
                        title={year + " 年全部作品"}
                      >
                        ＋
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-center">
          <button
            type="button"
            className="border rounded-md px-4 py-2 inline-flex"
            onClick={() => {
              setRatings((prev) => {
                const next: Record<string, Rating> = {}

                for (const [title, rating] of Object.entries(prev)) {
                  if (!visibleAnimeKeySet.has(title)) {
                    next[title] = rating
                  }
                }

                for (const title of visibleAnimeKeys) {
                  next[title] = 1
                }

                return next
              })
            }}
          >
            {t("selectAll")}
          </button>

          {ratedVisibleAnimeCount > 0 && (
            <button
              type="button"
              className="border rounded-md px-4 py-2 inline-flex"
              onClick={() => {
                setRatings((prev) => {
                  const next: Record<string, Rating> = {}

                  for (const [title, rating] of Object.entries(prev)) {
                    if (!visibleAnimeKeySet.has(title)) {
                      next[title] = rating
                    }
                  }

                  return next
                })
              }}
            >
              {t("clear")}
            </button>
          )}

          <button
            type="button"
            className="border rounded-md px-4 py-2 inline-flex"
            onClick={() => {
              toast.promise(copyImage(), {
                success: t("copySuccess"),
                loading: t("copying"),
                error(error) {
                  return t("copyFailed", {
                    error:
                      error instanceof Error
                        ? error.message
                        : t("unknownError"),
                  })
                },
              })
            }}
          >
            {t("copyImage")}
          </button>

          <button
            type="button"
            className="border rounded-md px-4 py-2 inline-flex"
            onClick={() => {
              toast.promise(downloadImage(), {
                success: t("downloadSuccess"),
                loading: t("downloading"),
                error(error) {
                  return t("downloadFailed", {
                    error:
                      error instanceof Error
                        ? error.message
                        : t("unknownError"),
                  })
                },
              })
            }}
          >
            {t("downloadImage")}
          </button>
        </div>

        <div className="flex flex-col gap-2 max-w-screen-md w-full mx-auto">
          <div className="border focus-within:ring-2 ring-pink-500 focus-within:border-pink-500 rounded-md">
            <div className="flex items-center justify-between p-2 border-b">
              <div className="flex items-center gap-2">
                <span>{t("promptType")}</span>
                <select
                  className="border rounded-md"
                  value={promptType}
                  onChange={(e) => {
                    setPromptType(e.currentTarget.value as any)
                  }}
                >
                  <option value="normal">{t("promptNormal")}</option>
                  <option value="zako">{t("promptZako")}</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="text-sm text-zinc-500 hover:bg-zinc-100 px-1.5 h-7 flex items-center rounded-md"
                  onClick={() => {
                    navigator.clipboard.writeText(prompt)
                    toast.success(t("copySuccess"))
                  }}
                >
                  {t("copy")}
                </button>

                <button
                  type="button"
                  className="text-sm text-zinc-500 hover:bg-zinc-100 px-1.5 h-7 flex items-center rounded-md"
                  onClick={() => {
                    location.href = `chatwise://chat?input=${encodeURIComponent(
                      prompt
                    )}`
                  }}
                >
                  {t("openInChatWise")}
                </button>
              </div>
            </div>
            <textarea
              readOnly
              className="outline-none w-full p-2 resize-none cursor-default"
              rows={10}
              value={prompt}
            />
          </div>
        </div>

        <div className="text-center text-sm text-zinc-500">
          基于{" "}
          <a
            href="https://github.com/egoist/anime-sedai"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            egoist/anime-sedai
          </a>{" "}
          修改 · MIT License
        </div>

        <Changelog />
      </div>

      {pickerYear && (
        <div
          className="fixed inset-0 z-30 bg-black/30 flex items-start justify-center p-4 pt-16"
          onClick={() => setPickerYear(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[75vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 p-3 border-b">
              <span className="font-semibold whitespace-nowrap">
                {pickerYear} 年 · 共 {pickerItems.length} 部
              </span>
              <input
                autoFocus
                value={pickerQuery}
                onChange={(e) => setPickerQuery(e.currentTarget.value)}
                placeholder="搜索该年作品（中文 / 英文 / 日文）"
                className="flex-1 border rounded px-2 py-1 text-sm"
              />
              <button
                type="button"
                className="text-sm text-zinc-500 hover:bg-zinc-100 px-2 py-1 rounded"
                onClick={() => setPickerYear(null)}
              >
                关闭
              </button>
            </div>
            <div className="overflow-y-auto p-2 grid gap-1 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {pickerItems.map((item) => {
                const key = item.year + ":" + item.titleZh
                const rating = ratings[key]
                const inYear = (itemsByYear.get(pickerYear) || []).some((x) => x.key === key)
                return (
                  <button
                    key={item.year + "-" + item.titleZh}
                    type="button"
                    onClick={() => {
                      if (rating) {
                        setRatings((prev) => {
                          const next = { ...prev }
                          delete next[key]
                          return next
                        })
                      } else {
                        setRatings((prev) => ({ ...prev, [key]: 1 }))
                      }
                    }}
                    className={
                      "text-left text-sm px-2 py-1.5 rounded border flex items-center gap-2 " +
                      (rating ? "bg-green-500 text-white border-green-600" : "hover:bg-zinc-100 border-zinc-200") +
                      (inYear ? "" : " opacity-90")
                    }
                    title={item.titleEn || item.titleJa}
                  >
                    <span className="truncate flex-1">{item.titleZh}</span>
                    {rating ? <span className="text-[10px] shrink-0">已选</span> : null}
                  </button>
                )
              })}
              {pickerItems.length === 0 && (
                <div className="col-span-full text-center text-sm text-zinc-400 py-8">
                  没有匹配的作品
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
