export type Language = "zh" | "en" | "ja"

export const translations = {
  zh: {
    title: "动画世代",
    subtitle: "点击选择你看过的动画",
    fillerLabel: "填表人：",
    watchedCount: "我看过 {{count}}/{{total}} 部动画",
    selectAll: "全选",
    clear: "清除",
    copyImage: "复制图片",
    downloadImage: "下载图片",
    copySuccess: "复制成功",
    downloadSuccess: "下载成功",
    copyFailed: "复制失败: {{error}}",
    downloadFailed: "下载失败: {{error}}",
    copying: "复制中",
    downloading: "下载中",
    unknownError: "未知错误",
    promptType: "锐评提示词",
    promptNormal: "普通",
    promptZako: "杂鱼❤",
    copy: "复制",
    openInChatWise: "在 ChatWise 中打开 (需要先安装)",
    year: "年",
    watched: "看过",
    notWatched: "没看过",
    none: "无",
    legendGood: "好评",
    legendNeutral: "中立",
    legendBad: "差评",
    legendNone: "没看过",
    promptRecordHeader: "我的动画观看记录",
    promptRatingNote: "好评 / 中立 / 差评；未列出的表示没看过",
    promptStatsHeader: "统计摘要",
    promptStatTotal: "共评价 {{total}} 部 —— 好评 {{good}} 部、中立 {{neutral}} 部、差评 {{bad}} 部",
    promptStatRate: "整体好评率 {{rate}}%",
    promptStatSpan: "评价跨度 {{from}} – {{to}}",
    promptStatTopYears: "评价最集中的年份：{{years}}",
    promptStatBestYear: "好评率最高的年份：{{year}}（{{good}}/{{total}}）",
    promptStatWorstYear: "差评最多的年份：{{year}}（{{count}} 部）",
    promptUnwatchedMore: "（其余 {{count}} 部未列出）",
    yearRange: "年份范围",
    last5Years: "近 5 年",
    last10Years: "近 10 年",
    last15Years: "近 15 年",
    allYears: "全部",
    language: "语言",
    chinese: "中文",
    english: "English",
    japanese: "日本語",
    homeIntro: "逐部过一遍，比在表格里点几百个格子轻松得多",
    browserHint: "部分应用内置浏览器会影响图表生成，建议复制链接到默认浏览器使用",
    startReview: "开始逐部评测",
    continueReview: "继续上次",
    continueFrom: "{{year}} 年 · 第 {{index}}/{{total}} 部",
    openTable: "查看表格总览",
    backHome: "返回首页",
    pickStartYear: "从哪一年开始",
    reviewProgress: "{{year}} 年 · 第 {{index}}/{{total}} 部",
    reviewGood: "看过，好评",
    reviewNeutral: "看过，中评",
    reviewBad: "看过，差评",
    reviewNone: "没看过",
    reviewPrev: "上一个",
    reviewKeyboardHint: "键盘：1 好评 · 2 中评 · 3 差评 · 4 没看过 · ← 上一个 · Esc 退出",
    yearSummary: "{{year}} 年走完了",
    summaryNextYear: "继续 {{year}} 年",
    summaryToTable: "先看表格",
    reviewDone: "26 年全部走完了",
    reviewDoneHint: "去表格里看结果，或换个年份重来",
    reviewRestart: "另选年份",
    exportData: "导出记录",
    importData: "导入记录",
    exportDone: "已发起下载；若没收到文件，请点「查看记录」手动复制",
    importDone: "已导入 {{count}} 条记录",
    importFailed: "导入失败：{{error}}",
    poolProgress: "已评测 {{count}}/{{total}}",
    coverMissing: "暂无封面",
    summaryStat: "好评 {{good}} · 中评 {{neutral}} · 差评 {{bad}} · 没看过 {{none}}",
    yearFinished: "{{year}} 年已走完",
    viewData: "查看记录",
    selectAllText: "全选",
    selectAllHint: "已全选，按 Ctrl+C 复制",
    close: "关闭",
  },
  en: {
    title: "Anime Sedai",
    subtitle: "Click to select anime you have watched",
    fillerLabel: "Filled in by: ",
    watchedCount: "I have watched {{count}}/{{total}} anime",
    selectAll: "Select All",
    clear: "Clear",
    copyImage: "Copy Image",
    downloadImage: "Download Image",
    copySuccess: "Copy successful",
    downloadSuccess: "Download successful",
    copyFailed: "Copy failed: {{error}}",
    downloadFailed: "Download failed: {{error}}",
    copying: "Copying",
    downloading: "Downloading",
    unknownError: "Unknown error",
    promptType: "AI Prompt",
    promptNormal: "Normal",
    promptZako: "Zako❤",
    copy: "Copy",
    openInChatWise: "Open in ChatWise (installation required)",
    year: "",
    watched: "Watched",
    notWatched: "Not Watched",
    none: "None",
    legendGood: "Good",
    legendNeutral: "Neutral",
    legendBad: "Bad",
    legendNone: "Not watched",
    promptRecordHeader: "My anime viewing record",
    promptRatingNote: "liked / neutral / disliked; anything unlisted means not watched",
    promptStatsHeader: "Summary statistics",
    promptStatTotal: "{{total}} titles rated — {{good}} liked, {{neutral}} neutral, {{bad}} disliked",
    promptStatRate: "Overall like rate {{rate}}%",
    promptStatSpan: "Span {{from}} – {{to}}",
    promptStatTopYears: "Busiest years: {{years}}",
    promptStatBestYear: "Highest like rate: {{year}} ({{good}}/{{total}})",
    promptStatWorstYear: "Most disliked: {{year}} ({{count}} titles)",
    promptUnwatchedMore: " ({{count}} more not listed)",
    yearRange: "Years",
    last5Years: "Last 5 years",
    last10Years: "Last 10 years",
    last15Years: "Last 15 years",
    allYears: "All",
    language: "Language",
    chinese: "中文",
    english: "English",
    japanese: "日本語",
    homeIntro: "Going title by title beats clicking hundreds of cells",
    browserHint: "Some in-app browsers break image export — copy the link and open it in your default browser",
    startReview: "Start rating",
    continueReview: "Continue",
    continueFrom: "{{year}} · {{index}}/{{total}}",
    openTable: "View the table",
    backHome: "Back to start",
    pickStartYear: "Start from which year",
    reviewProgress: "{{year}} · {{index}}/{{total}}",
    reviewGood: "Watched · liked",
    reviewNeutral: "Watched · neutral",
    reviewBad: "Watched · disliked",
    reviewNone: "Not watched",
    reviewPrev: "Previous",
    reviewKeyboardHint: "Keys: 1 liked · 2 neutral · 3 disliked · 4 not watched · ← previous · Esc exit",
    yearSummary: "{{year}} done",
    summaryNextYear: "Continue with {{year}}",
    summaryToTable: "View table",
    reviewDone: "All 26 years done",
    reviewDoneHint: "Check the table, or start over from another year",
    reviewRestart: "Pick another year",
    exportData: "Export",
    importData: "Import",
    exportDone: "Download started. If no file appeared, use “View data” to copy it manually",
    importDone: "Imported {{count}} records",
    importFailed: "Import failed: {{error}}",
    poolProgress: "{{count}}/{{total}} rated",
    coverMissing: "No cover",
    summaryStat: "{{good}} liked · {{neutral}} neutral · {{bad}} disliked · {{none}} not watched",
    yearFinished: "{{year}} finished",
    viewData: "View data",
    selectAllText: "Select all",
    selectAllHint: "Selected — press Ctrl+C to copy",
    close: "Close",
  },
  ja: {
    title: "アニメ世代",
    subtitle: "見たアニメをタップして選択する",
    fillerLabel: "記入者：",
    watchedCount: "{{count}}/{{total}} のアニメを見た",
    selectAll: "すべて選択",
    clear: "クリア",
    copyImage: "イメージをコピー",
    downloadImage: "イメージをダウンロード",
    copySuccess: "コピー成功",
    downloadSuccess: "ダウンロード成功",
    copyFailed: "コピー失敗: {{error}}",
    downloadFailed: "ダウンロード失敗: {{error}}",
    copying: "コピー中",
    downloading: "ダウンロード中",
    unknownError: "未知のエラー",
    promptType: "コメントプロンプト",
    promptNormal: "通常",
    promptZako: "雑魚❤",
    copy: "コピー",
    openInChatWise: "ChatWiseでオープン (インストール必要)",
    year: "年",
    watched: "見た",
    notWatched: "見ていない",
    none: "なし",
    legendGood: "高評価",
    legendNeutral: "普通",
    legendBad: "低評価",
    legendNone: "未視聴",
    promptRecordHeader: "私のアニメ視聴記録",
    promptRatingNote: "高評価 / 普通 / 低評価、記載のないものは未視聴",
    promptStatsHeader: "統計サマリー",
    promptStatTotal: "評価した作品は {{total}} 本 —— 高評価 {{good}}、普通 {{neutral}}、低評価 {{bad}}",
    promptStatRate: "全体の高評価率 {{rate}}%",
    promptStatSpan: "評価期間 {{from}} – {{to}}",
    promptStatTopYears: "評価が最も集中した年：{{years}}",
    promptStatBestYear: "高評価率が最も高い年：{{year}}（{{good}}/{{total}}）",
    promptStatWorstYear: "低評価が最も多い年：{{year}}（{{count}} 本）",
    promptUnwatchedMore: "（残り {{count}} 本は省略）",
    yearRange: "年範囲",
    last5Years: "直近 5 年",
    last10Years: "直近 10 年",
    last15Years: "直近 15 年",
    allYears: "すべて",
    language: "言語",
    chinese: "中文",
    english: "English",
    japanese: "日本語",
    homeIntro: "表をクリックして回るより、1 本ずつ見ていくほうがずっと楽です",
    browserHint: "一部のアプリ内蔵ブラウザでは画像を書き出せません。リンクをコピーして通常のブラウザで開いてください",
    startReview: "1 本ずつ評価する",
    continueReview: "続きから",
    continueFrom: "{{year}} 年 · {{index}}/{{total}} 本目",
    openTable: "表を見る",
    backHome: "最初に戻る",
    pickStartYear: "どの年から始める",
    reviewProgress: "{{year}} 年 · {{index}}/{{total}} 本目",
    reviewGood: "見た・高評価",
    reviewNeutral: "見た・普通",
    reviewBad: "見た・低評価",
    reviewNone: "見ていない",
    reviewPrev: "前の作品",
    reviewKeyboardHint: "キー：1 高評価 · 2 普通 · 3 低評価 · 4 未視聴 · ← 前へ · Esc 終了",
    yearSummary: "{{year}} 年が終わりました",
    summaryNextYear: "{{year}} 年へ進む",
    summaryToTable: "表を見る",
    reviewDone: "26 年分すべて完了",
    reviewDoneHint: "表で結果を確認するか、別の年からやり直せます",
    reviewRestart: "年を選び直す",
    exportData: "記録を書き出す",
    importData: "記録を読み込む",
    exportDone: "ダウンロードを開始しました。ファイルが保存されない場合は「記録を表示」から手動でコピーしてください",
    importDone: "{{count}} 件を読み込みました",
    importFailed: "読み込み失敗：{{error}}",
    poolProgress: "{{count}}/{{total}} 評価済み",
    coverMissing: "画像なし",
    summaryStat: "高評価 {{good}} · 普通 {{neutral}} · 低評価 {{bad}} · 未視聴 {{none}}",
    yearFinished: "{{year}} 年は完了",
    viewData: "記録を表示",
    selectAllText: "すべて選択",
    selectAllHint: "選択しました。Ctrl+C でコピーしてください",
    close: "閉じる",
  },
}

const promptTemplates: Record<Language, Record<"normal" | "zako", string>> = {
  zh: {
    normal: `以下是我的动画观看记录和统计摘要。

请完成两件事：

1. 口味画像
分析我的动画口味偏好 —— 从题材倾向、年代分布、评价宽严度、看番节奏等角度给出有依据的判断。每一条都要引用具体作品或数据作为证据，不要泛泛而谈。

2. 锐评
直接说出你注意到的问题 —— 我口味的盲区、自相矛盾的地方、以及任何有意思的模式。该说重话就说，不必照顾我的情绪。

注意：
- 每条判断都要有具体作品或数字支撑
- 不要复述我给你的数据，直接给结论
- 不要写标题，不要使用 markdown 格式`,
    zako: `你是一个精通二次元文化的傲娇雌小鬼，需要根据我的动画观看记录（含好评/中立/差评三级评价）和统计摘要，写一份辛辣的锐评报告。

1. 结构
  - 写 5-6 个嘲讽段落
  - 每个段落的全部内容都写在 ">> 标签" 这一行之后！！
  - 每段主题必须不同，而且要够尖锐
  - 大量使用"杂鱼"、"❤"、"杂鱼~"、"杂鱼❤~"、"不会吧不会吧"等雌小鬼常用词
  - 不要写标题，也不要使用任何 markdown 样式，这一点非常非常重要！！

2. 内容
  - 必须从我的记录里挑出具体的作品名和年份当靶子，不许空泛地骂
  - 素材要自己从数据里挖：哪一年差评扎堆、哪个类型反复出现、哪几年完全空白、哪些公认的好作品我居然没看、我的好评和差评之间有没有自相矛盾
  - 不要套用放之四海皆准的段子，也不要复述我的统计数字，要把数字变成攻击的点
  - 每一段换一个角度，不要反复用同一种嘲讽方式

3. 格式示意（只示意格式，内容必须完全来自我的数据）
"""
>> 标签

正文

>> 标签

正文
"""

现在开始分析我的观看记录，按上述格式输出锐评报告。`,
  },
  en: {
    normal: `Below is my anime viewing record and a statistics summary.

Please do two things:

1. Taste profile
Analyse my anime taste — genre leanings, era distribution, how strict or lenient my ratings are, viewing pace. Back every judgement with specific titles or numbers; no vague generalities.

2. Sharp review
State plainly what you notice — blind spots in my taste, self-contradictions, and any interesting patterns. Don't soften your wording to spare my feelings.

Notes:
- Every claim must be supported by specific titles or figures
- Do not restate the data I gave you; go straight to conclusions
- No headings, no markdown formatting`,
    zako: `You are a proud, bratty little devil girl (mesugaki) deeply versed in anime culture. Based on my anime viewing record (three-tier ratings: liked / neutral / disliked) and the statistics summary, write a scathing review.

1. Structure
  - Write 5-6 mocking paragraphs
  - ALL content of each paragraph must come after a line beginning with ">> tag"!!
  - Every paragraph must have a different theme and be genuinely cutting
  - Use plenty of mesugaki vocabulary: "zako", "❤", "zako~", "zako❤~", "no way no way"
  - No titles and no markdown styling whatsoever — this is very, very important!!

2. Content
  - You MUST pick specific titles and years from my record as targets; vague insults are forbidden
  - Dig the material out of the data yourself: which years are piled with dislikes, which genre keeps repeating, which years are blank, which acclaimed titles I never watched, whether my likes and dislikes contradict each other
  - Do not recycle one-size-fits-all jokes, and do not restate my statistics — turn the numbers into ammunition
  - Attack from a different angle in every paragraph; do not reuse the same kind of mockery

3. Format sketch (format only — content must come entirely from my data)
"""
>> tag

body

>> tag

body
"""

Now analyse my viewing record and output the review in the format above.`,
  },
  ja: {
    normal: `以下は私のアニメ視聴記録と統計サマリーです。

次の二つをお願いします：

1. 好みの分析
私のアニメの好みを分析してください —— ジャンルの傾向、年代の分布、評価の厳しさ・甘さ、視聴ペースなどの観点から、根拠のある判断を示してください。すべての発言に具体的な作品名か数字を根拠として添えること。漠然とした一般論は不要です。

2. 辛口レビュー
気づいた問題点を率直に述べてください —— 好みの盲点、矛盾している点、面白いパターンなど。遠慮は要りません。

注意：
- すべての判断に具体的な作品名か数字の裏付けをつけること
- 与えられたデータを復唱せず、結論だけを述べること
- 見出しは書かないこと、マークダウン記法も使わないこと`,
    zako: `あなたは二次元文化に精通したツンデレ系のメスガキです。私のアニメ視聴記録（高評価／普通／低評価の三段階評価つき）と統計サマリーをもとに、辛口レビューを書いてください。

1. 構成
  - 煽り段落を 5〜6 個
  - 各段落のすべての内容は必ず「>> タグ」で始まる 1 行のあとに含めること！！
  - 各段落はテーマを変え、鋭く突き刺すこと
  - 「雑魚」「❤」「雑魚~」「雑魚❤~」「まさかまさか～？」など、メスガキがよく使う表現をたっぷり使うこと
  - 見出しやマークダウン記法は絶対に含めないこと！！これは非常に重要です！！

2. 内容
  - 私の記録から具体的な作品名と年を必ず標的にすること。漠然とした罵倒は禁止
  - 材料は自分でデータから掘ること：低評価が集中した年、繰り返し出てくるジャンル、まったく評価がない年、名作なのに見ていない作品、高評価と低評価の矛盾
  - どこにでも当てはまる定型ネタの使い回しは禁止。統計の数字を復唱せず、攻撃の材料に変えること
  - 段落ごとに切り口を変え、同じ煽り方を繰り返さないこと

3. 書式の見本（書式のみ。内容は必ず私のデータから）
"""
>> タグ

本文

>> タグ

本文
"""

今から私の視聴記録を分析し、上記のフォーマットでレビューを出力してください。`,
  },
}

export const getPromptTemplate = (lang: Language) => {
  return promptTemplates[lang] || promptTemplates.zh
}
