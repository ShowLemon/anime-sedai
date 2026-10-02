export const Changelog = () => (
  <details className="max-w-screen-md w-full mx-auto text-sm border rounded-md bg-white">
    <summary className="cursor-pointer select-none px-3 py-2 font-medium text-zinc-700 hover:bg-zinc-50 rounded-md">
      详细修改说明
    </summary>
    <div className="px-4 pb-4 pt-1 space-y-4 text-zinc-600 leading-relaxed">
      <section className="space-y-2">
        <h3 className="font-semibold text-zinc-800">
          一、与原版统计口径的差异
        </h3>
        <p>
          原版按 bgm.tv 的 <code>sort=trends</code>
          （趋势排序）抓取第一页 24 条。趋势反映的是抓取当下的讨论热度，与「累计关注度」并不完全等价，也会随时间推移而变化。
          受此影响，一些高热度作品未能出现在原版中 —— 例如 JOJO的奇妙冒险 黄金之风（当时官方热度第
          9）、进击的巨人 第三季、命运石之门 0、工作细胞、鬼灭之刃 游郭篇等，它们大多是续作或多季作品。
        </p>
        <p>
          此外，原版 <code>src/app.tsx</code> 中有一处{" "}
          <code>items.slice(0, 12)</code>{" "}
          的截断：数据文件中实际存有 15–22 部，页面只渲染了前 12 部。
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-zinc-800">二、数据重建</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <b>范围</b>：2006–2025 → <b>2000–2025</b>，共 26 年
          </li>
          <li>
            <b>每年部数</b>：12 → <b>20 部</b>（该年候选池 65–250 部）
          </li>
          <li>
            <b>排序</b>：改用 bgm.tv 官方 API 的 <code>sort=heat</code>
            （累计热度），翻页抓取至榜位 300 左右再筛选
          </li>
          <li>
            <b>系列规则</b>：
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>连贯续作只保留第一部</li>
              <li>
                独立故事系列每部独立：JOJO的奇妙冒险（按部）、赛马娘 Pretty
                Derby（按季）、机动战士高达（按世界观）、Fate 系列（按故事线）、Love
                Live!（按代）、BanG Dream!（MyGO 独立成部）
              </li>
              <li>
                外传：同一世界观 + 不同主角 + 不同故事 → 独立作品；仅视角不同、故事线与正传一致
                → 续作
              </li>
              <li>分割放送、总集篇、重制版并入前作</li>
              <li>作品首部早于 2000 年的，按新作处理</li>
            </ul>
          </li>
          <li>
            <b>剔除</b>：无主旨短篇集（搞笑漫画日和、监狱兔）、非日本动画、泡面番（单集
            ≤5 分钟）
          </li>
          <li>
            <b>标题</b>：中文名与日文原名来自 bgm.tv；英文名来自 AniList（官方英文名优先，无则用罗马字）
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-zinc-800">三、交互与功能</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <b>四态评级</b>（原为二态「看过 / 没看过」）：点击循环 白 → 绿（好评）→
            黄（中立）→ 红（差评）→ 白，表格上方新增图例
          </li>
          <li>
            <b>全局搜索</b>：跨 2000–2025 搜索全部 4200
            余部作品（含未进表格的），支持中 / 英 / 日文名；点已在表中的作品会滚动定位并高亮，不在表中的则追加到对应年份行尾
          </li>
          <li>
            <b>按需加载索引</b>：搜索索引约 550 KB，改为首次使用搜索或按年面板时才加载，首屏体积减少约 62%
          </li>
          <li>
            <b>按年选择面板</b>：每行末尾新增「＋」，可浏览该年全部作品并勾选
          </li>
          <li>
            <b>提示词改造</b>：数据按好评 / 中立 / 差评三级分组；新增统计摘要（评价总量与分布、整体好评率、评价跨度、最集中的年份、好评率最高年、差评最多年）；「没看过」只列该年热度前
            10 部中的；<code>normal</code> 模板增加口味画像分析；<code>zako</code>{" "}
            模板改为给出取材方向而非枚举梗类型，避免生成高度同质化的文本；三语同步
          </li>
          <li>
            <b>视觉调整</b>：年份标签由红色改为深灰（避免与「差评」红混淆）；差评色改用更柔和的{" "}
            <code>red-400</code>；移除原作者的站点地址与页脚宣传
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-zinc-800">
          四、逐部评测模式（新增）
        </h3>
        <p>
          表格要在一屏里放下 26 × 20
          个格子，只靠标题很难立刻想起「这到底是哪一部」；一部部点下来也很费眼。
          所以在表格之外新增了一条更轻松的录入路径。
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <b>评测池</b>：2000–2025 每年 <b>30 部</b>，共 780 部。前 20
            部与表格里的名单逐部一致，第 21–30
            部是热度顺位上的后续候选，只在评测时出现
          </li>
          <li>
            <b>逐部过</b>：一屏一部，展示封面 + 中文名 + 日文原名 + 英文名，下方五个按钮 ——
            看过好评 / 看过中评 / 看过差评 / 没看过 / 上一个
          </li>
          <li>
            <b>键盘操作</b>：<code>1</code>/<code>2</code>/<code>3</code>/
            <code>4</code> 对应四种选择，<code>←</code> 或退格回上一个，
            <code>Esc</code> 退出；选完自动翻到下一部
          </li>
          <li>
            <b>年度小结</b>：每年 30 部走完给一次小结，再决定继续下一年还是先回表格
          </li>
          <li>
            <b>进度可续</b>：中途关掉页面也没关系，首页会出现「继续上次」
          </li>
          <li>
            <b>结果回流表格</b>：评了好 / 中 / 差的第 21–30
            部会追加到对应年份行尾，之后仍可在表格里改；选「没看过」的只记录状态，不占表格格子
          </li>
          <li>
            <b>导入 / 导出</b>：评级、追加的作品与评测进度可导出为 JSON，用于备份或换设备。
            若有环境会拦截下载（例如 DSH 内置浏览器会拒绝所有下载），可用「查看记录」直接查看
            并手动复制内容
          </li>
          <li>
            <b>封面本地化</b>：780 张封面打包在站点内（<code>public/covers/</code>），不依赖外部图床
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-zinc-800">五、数据来源</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            榜单与评分：bgm.tv 官方 API（<code>api.bgm.tv/v0/search/subjects</code>）
          </li>
          <li>英文名与原产国判定：AniList GraphQL API</li>
        </ul>
      </section>

      <section className="space-y-1">
        <h3 className="font-semibold text-zinc-800">六、署名</h3>
        <p>
          表格创意与原始实现归{" "}
          <a
            href="https://github.com/egoist/anime-sedai"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            egoist
          </a>{" "}
          所有，本版本基于其 MIT 协议开源的 anime-sedai 修改。
        </p>
      </section>
    </div>
  </details>
)
