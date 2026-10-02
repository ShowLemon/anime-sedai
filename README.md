# 动画世代（本地修改版）

一张可交互的动漫年代表格：勾选你看过的动画，生成统计与 AI 锐评提示词。

也可以在「逐部评测」模式里一屏一部地过 —— 看着封面选好评 / 中评 / 差评 / 没看过，
比在几百个格子里点来点去轻松得多，键盘 1 / 2 / 3 / 4 连按即可。

基于 [egoist/anime-sedai](https://github.com/egoist/anime-sedai)（MIT 协议）修改。
完整改动说明见页面底部的「详细修改说明」，源码在 [`src/changelog.tsx`](src/changelog.tsx)。

## 数据

- **表格**：2000–2025 年，每年 20 部，共 520 部
- **评测池**：2000–2025 年，每年 30 部，共 780 部（前 20 部与表格逐部一致，第 21–30 部为热度顺位上的后续候选）
- 榜单与评分来自 bgm.tv 官方 API（`sort=heat`，累计热度）
- 英文名与原产国判定来自 AniList
- 搜索索引覆盖 4200 余部（含未进表格的作品）
- 780 张封面已本地化到 `public/covers/`（约 31 MB，按需加载，不进首屏）

## 本地开发

需要 Node.js 18+。

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build     # 产物在 dist/
npm run preview   # 本地预览构建产物
```

## 部署到 GitHub Pages

1. 在 GitHub 新建一个**公开**仓库（例如 `anime-sedai`），不要勾选初始化 README
2. 把本项目推送到该仓库的 `main` 分支
3. 仓库 **Settings → Pages → Source** 选择 **GitHub Actions**
4. 等 Actions 跑完，访问 `https://<你的用户名>.github.io/<仓库名>/`

`.github/workflows/deploy.yml` 已经写好，推送后会自动构建并部署。它会根据仓库名自动决定
`base` 路径（仓库名若为 `<用户名>.github.io` 则部署在根路径），无需手动改配置。

> 注意：站点现在自带约 31 MB 封面图，推送到 GitHub 会让仓库明显变大。
> 如果不想把图放进仓库，可把 `public/covers/` 加进 `.gitignore`，部署前用
> `data/pipeline-5-download-covers.mjs` 重新下载（脚本支持断点续传）。

## 数据更新

`data/` 目录保留了抓取产物、缓存与可复现的流水线脚本。

数据文件：

| 文件 | 说明 |
|---|---|
| `data/bgm-all-tv-cache.json` | bgm.tv 原始榜单缓存（每年前 320 部 TV） |
| `data/anilist-media.json` | AniList 元数据缓存（原产国 / 时长 / 分级 / 英文名） |
| `data/anime-data-v2.json` | 表格数据源（每年 20 部） |
| `data/finalized-top30.json` | 评测池数据源（每年 30 部） |
| `data/vendor/bangumi-data.json` | bgm id ↔ AniList id 映射（来自 bangumi-data） |
| `src/review-data.ts` | 评测池，由脚本生成，勿手改 |
| `src/search-index.ts` | 搜索索引（4204 部），由脚本生成，勿手改 |

流水线脚本（按序号执行）：

| 脚本 | 作用 | 联网 |
|---|---|---|
| `data/pipeline-1-fetch-rankings.mjs` | 抓 bgm.tv 逐年榜单 | 需要代理（约 30 分钟） |
| `data/pipeline-2-apply-series-rules.mjs` | 套系列规则，产出候选池 | 否 |
| `data/pipeline-3-finalize.mjs` | 国别 / 泡面番过滤 + 补英文名，产出每年 30 部 | AniList 直连 |
| `data/pipeline-4-build-review-pool.mjs` | 生成 `src/review-data.ts` | 否 |
| `data/pipeline-5-download-covers.mjs` | 下载封面到 `public/covers/` | 需要代理 |

跑需要代理的脚本前设置：

```powershell
$env:NODE_USE_ENV_PROXY = "1"
$env:HTTP_PROXY  = "http://127.0.0.1:7890"
$env:HTTPS_PROXY = "http://127.0.0.1:7890"
```

## 许可证

MIT。表格创意与原始实现归 [egoist](https://github.com/egoist/anime-sedai) 所有。
