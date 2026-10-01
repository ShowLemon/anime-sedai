# 动画世代（本地修改版）

一张可交互的动漫年代表格：勾选你看过的动画，生成统计与 AI 锐评提示词。

基于 [egoist/anime-sedai](https://github.com/egoist/anime-sedai)（MIT 协议）修改。
完整改动说明见页面底部的「详细修改说明」，源码在 [`src/changelog.tsx`](src/changelog.tsx)。

## 数据

- 2000–2025 年，每年 20 部，共 520 部
- 榜单与评分来自 bgm.tv 官方 API（`sort=heat`，累计热度）
- 英文名与原产国判定来自 AniList
- 搜索索引覆盖 4200 余部（含未进表格的作品）

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

## 数据更新

`data/` 目录保留了抓取产物与缓存，可复现整套流程：

| 文件 | 说明 |
|---|---|
| `data/bgm-all-tv-cache.json` | bgm.tv 原始榜单缓存 |
| `data/anilist-media.json` | AniList 元数据缓存（原产国 / 时长 / 英文名） |
| `data/anime-data-v2.json` | 最终结构化数据（年份 → 作品） |
| `src/search-index.ts` | 搜索索引，由上述数据生成 |

## 许可证

MIT。表格创意与原始实现归 [egoist](https://github.com/egoist/anime-sedai) 所有。
