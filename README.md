# AI 数据可视化大屏 · Smart City Dashboard

基于 Vue3 + TypeScript 的智慧城市数据大屏，前端工程化实践项目。支持大屏数据可视化、GeoJSON 地图热力与联动、AI 自然语言出图与流式对话（开发中）。

## 技术栈

- **框架**：Vue 3（`<script setup>` 组合式 API）+ Vite
- **语言**：TypeScript
- **状态管理**：Pinia
- **图表**：ECharts 5（按需引入，含 Geo / 地图 / 热力组件）
- **路由**：Vue Router 4（hash 模式）
- **请求层**：Axios（拦截器统一鉴权/异常处理）

## 本地启动

```bash
# 安装依赖
npm install

# 开发模式（默认 http://localhost:5173）
npm run dev

# 生产构建（含 TS 类型检查）
npm run build

# 预览构建产物
npm run preview
```

## 环境变量

复制 `.env.example` 为 `.env.local`，并填入你的大模型 API Key：

```
VITE_LLM_BASE_URL=https://api.deepseek.com/v1
VITE_LLM_API_KEY=sk-xxx
VITE_LLM_MODEL=deepseek-chat
```

> `.env.local` 已加入 `.gitignore`，不会被提交，Key 安全。

## 目录结构

```
src/
├─ api/          # 服务层：Axios 实例 + 拦截器、数据接口（dashboard）、LLM 调用（普通/SSE 流式）
├─ assets/       # 全局样式
├─ components/   # 通用组件：BaseChart / ChartPanel / ConfigChart / MapChart / StatIndicator
├─ config/       # 配置驱动：buildOption 图表工厂 + 示例配置 demos + 地图数据 mapData
├─ hooks/        # 组合式函数：useEcharts / useScale / useResponsive / useMap / useInView（懒渲染）
├─ layouts/      # 布局层：DashboardLayout（大屏等比缩放 + 小屏流式布局）
├─ mock/         # 内置 Mock 数据（无后端演示 / 三态预览，Day7）
├─ router/       # 路由（hash 模式）
├─ stores/       # Pinia：useDashboardStore（异步数据 + 三态 + 实时序列，Day7）
├─ types/        # 全局 TS 类型
├─ utils/        # 工具：chartSchema（Schema 校验 + 降级兜底，Day8）、chartOps（结果微调，Day9）、
│               #      chatSession（会话模型 + 本地持久化，Day10）、markdown（零依赖安全渲染，Day11）
└─ views/        # 页面：DashboardView / ChartGalleryView / MapView / AiChatView
```

## 功能进度

- [x] Vue3 + TS + Pinia 工程化分层（Day 1–2）
- [x] 1920×1080 等比缩放自适应（`useScale` + ResizeObserver）
- [x] 组件化重构：抽取布局组件 + 数据配置中心（Day 3–4）
- [x] 图表层工程化：ECharts 按需引入 + vendor 分包（Day 4）
- [x] 配置驱动通用图表组件（7 类型）+ 图表图库（Day 5）
- [x] 地图与真实自适应：GeoJSON 热力地图 + 区县联动 + CSS Grid/Flex 流式布局（Day 6）
- [x] Pinia + 请求层驱动真实数据（含加载 / 错误 / 空态，Mock 可切换）—— Day 7
- [x] AI 自然语言出图（LLM Function Calling → 配置 JSON → 校验 → 渲染；无 Key 走 Mock）—— Day 8
- [x] AI 出图增强：多轮对话上下文 + 结果微调（改标题 / 换类型 / 增删数据）—— Day 9
- [x] AI 出图体验完善：多会话管理（新建 / 切换 / 重命名 / 清空 / 删除 + 本地持久化）、示例库分组、错误分类提示与重试 —— Day 10
- [x] SSE 流式对话 + 中断生成 + 助手消息 Markdown 渲染 —— Day 11
- [x] 性能优化：图表懒渲染（IntersectionObserver）+ dataset 增量更新 —— Day 7
- [x] 构建拆包优化：echarts 与 zrender 二次分包，单包全部回到 600 kB 阈值内 —— Day 12
- [x] 部署上线：GitHub Actions 自动构建并发布到 GitHub Pages —— Day 12
- [x] 文档整理：清理 README 重复段落，补充部署与体积对比说明 —— Day 12
- [x] 首屏性能：`index.html` 内联启动骨架（消除白屏）+ 路由级懒加载 + hover 预取 chunk —— Day 13
- [x] 骨架屏占位：新增 `ChartSkeleton`（chart / panel / map / stat 四变体），接入图表与整屏加载态 —— Day 13
- [x] 构建细节收口：`modulePreload` 只保留 js 依赖、小资源内联、关闭 sourcemap —— Day 13

## 地图说明（Day 6）

- 地图 GeoJSON 以**本地静态资源**内置在 `public/geojson/chongqing.json`（重庆全域 38 个区县，约 162 KB），
  运行时用 `import.meta.env.BASE_URL` 拼接路径异步加载，并用 `sessionStorage` 缓存；
  不打包进 bundle，避免主包体积膨胀（呼应 Day 4 的按需引入 / 分包思路）。
  早期版本曾直接外链第三方 CDN，在部分托管环境下会因跨域 / Referer 策略返回 403 导致地图白屏，
  改为本地内置后该问题不再复现。
- `useMap` 负责「加载 → `echarts.registerMap` → 幂等复用」；`MapChart` 负责注册完成后再渲染，
  并对加载中 / 加载失败给出状态提示。
- 点击地图区县会触发 `chart-click`，联动展示该区县的指标详情（GDP / 人口 / 综合指数 / 产业结构）。

## 数据层（Day 7）

- 大屏数据统一由 **Pinia + 请求层** 驱动：视图挂载时调用 `useDashboardStore.loadDashboard()`，
  经 `api/dashboard.ts`（默认回退内置 Mock）拉取 `DashboardData`，组件不再直接依赖静态配置。
- **三态处理**：`PanelState` 统一封装「加载中 / 加载失败（可重试）/ 空数据」；
  通过 `.env` 的 `VITE_MOCK_SCENARIO=normal|empty|error` 可本地预览三态。
- **性能优化**：`useInView`（IntersectionObserver）让图表进入视口后才初始化实例（懒渲染）；
  `buildOption` 支持 `dataset` + `encode`，配合 `setOption({ lazyUpdate })` 做增量更新。

## AI 出图（Day 8）

- 进入 `/#/ai`：用一句话描述需求，AI 生成图表并实时预览，可展开查看配置 JSON。
- 链路：**自然语言 → 请求层出图 → 配置校验 → Pinia → 渲染**。
  - `api/llm.ts`：`generateChartConfig()` 走 OpenAI 兼容的 **Function Calling**（`render_chart` 工具），
    强制模型返回结构化配置；
  - `utils/chartSchema.ts`：`extractJson` + 按类型深度校验 / 归一化，非法配置返回 `null`；
  - `stores/ai.ts`：维护对话 / 加载 / 错误态，校验失败时用 `fallbackChartConfig()` **降级兜底**，保证不崩页。
- **无 Key 可演示**：未配置有效 API Key（或 `VITE_USE_MOCK_LLM=true`）时自动走 `mock/llm.ts`
  的关键词规则出图，流程与真实模型一致。

## AI 出图增强（Day 9）

- **多轮上下文**：`stores/ai.ts` 保存对话历史（最近 12 条），请求时连同**当前图表配置**一起交给模型，
  支持「在此基础上修改」（如「把标题改成城市概览」「换成柱状图」）；`generateChartConfig(text, { history, current })`
  会把这些拼进 messages，模型沿用原结构只改所需部分。
- **结果微调**：`utils/chartOps.ts` 提供纯函数式微调（改标题 / 换类型 / 追加数据点 / 删除末项），
  在预览区工具条点击即**本地即时生效**，无需再次请求模型；也可作为模型微调失败时的兜底。
- **Mock 微调**：`mock/llm.ts` 的 `mockRefine` 基于关键词把指令映射为 `chartOps` 调用，无 Key 也能演示多轮微调。

## AI 出图体验完善（Day 10）

- **多会话管理**：`stores/ai.ts` 由「单条消息数组」升级为 `sessions: ChatSession[] + activeId`，
  支持新建 / 切换 / 重命名 / 清空 / 删除；删空后自动补一个新会话，界面不会出现「无会话」空壳。
- **本地持久化**：`utils/chatSession.ts` 把会话读写收敛成纯函数 + 最薄的 `localStorage` 层，
  刷新页面不丢对话与图表；读取时逐字段校验，脏数据不进 store。
- **示例库分组**：内置示例按「趋势 / 构成 / 对比 / 评价」分组，空会话时展示，降低体验门槛。
- **错误分类与重试**：`describeError()` 把 401 / 429 / 超时 / 网络 / 5xx / 配置非法翻译成可操作提示，
  并给出「是否可重试」；可重试错误提供按钮，重试复用最后一次提问且不重复追加用户消息。
- **与 Day 9 微调共存**：切换会话时图表与微调状态一并切换，微调仍走本地 `chartOps` 即时生效。

## 流式对话与 Markdown（Day 11）

- **SSE 流式输出**：图表生成后，助手说明以流式方式逐字写入——请求层 `chatStream`（Fetch + ReadableStream）
  走真实 SSE；无 Key 时由 `api/stream.ts` 按句块「打字机」模拟，两种模式共用同一套 `onDelta` 回调。
- **中断生成**：`AbortController` 贯穿请求层与状态层，界面上「生成图表」按钮在流式期间切换为「停止」；
  中断不视为错误，保留已生成内容并标注「已中断」，空内容时回退为「已中断生成」。
- **Markdown 渲染**：`utils/markdown.ts` 零依赖实现标题 / 列表 / 引用 / 代码块 / 行内代码 / 加粗斜体 /
  链接等子集，**先 HTML 转义再渲染**，并对链接做协议白名单，从根上规避 XSS。

## 构建拆包与部署上线（Day 12）

### 1. 为什么还要拆包

Day 4 起 `useEcharts.ts` 就已按需引入（`echarts/core` + 具体 charts/components/renderer），
但 Day 12 实测发现 **echarts 单 chunk 仍有 640.91 kB（gzip 213.34 kB）**，超过 Vite 默认 600 kB 告警线。

原因是 `manualChunks` 只按包名把 echarts 收进一个 chunk，而 echarts 依赖的渲染内核
**zrender** 体积占比很大，两者被打在同一个包里。

### 2. 做法：二次分包

在 `vite.config.ts` 的 `manualChunks` 里把 zrender 单独拎出来：

```ts
manualChunks(id: string) {
  if (!id.includes('node_modules')) return
  if (id.includes('zrender')) return 'echarts-zrender'  // 渲染内核，变动少
  if (id.includes('echarts')) return 'echarts'          // 图表逻辑
  if (id.includes('vue') || id.includes('pinia')) return 'vue'
  return 'vendor'
}
```

拆开的好处不止是「过告警线」：

- **缓存命中率更高**：zrender 属于底层依赖，很少随业务代码变动，长期缓存；
  业务更新只会击穿 `echarts` 与页面 chunk
- **并行加载**：两个包可同时下载，而非串行等一个 640 kB 大包
- **定位问题更快**：体积异常时能一眼看出是内核还是图表层膨胀

### 3. 优化前后对比（实测）

| chunk | 优化前 | 优化后 |
|---|---|---|
| `echarts` | 640.91 kB（gzip 213.34 kB） | 462.47 kB（gzip 155.47 kB） |
| `echarts-zrender` | —（合并在上面） | 180.24 kB（gzip 57.93 kB） |
| 构建告警 | ⚠️ 超过 600 kB | ✅ 无告警 |

### 4. 部署到 GitHub Pages

新增 `.github/workflows/deploy.yml`，推送 `master` 自动构建并发布：

- 触发：`push` 到 `master`，也支持手动 `workflow_dispatch`
- 权限：`pages: write` + `id-token: write`（OIDC 部署所需的最小权限）
- 并发：`group: pages` + `cancel-in-progress`，新推送会取消排队中的旧部署
- 流程：`checkout` → `setup-node`（Node 20 + npm 缓存）→ `npm ci` → `npm run build`
  → `configure-pages` → `upload-pages-artifact` → `deploy-pages`

**base 路径**：GitHub Pages 的项目站点部署在 `https://<user>.github.io/<repo>/` 子路径下，
若 `base` 仍为 `/`，JS/CSS 会 404。因此 `vite.config.ts` 中：

```ts
base: process.env.GITHUB_ACTIONS ? '/smart-city-dashboard/' : '/'
```

在 Actions 中自动切到仓库子路径，本地开发与 Vercel 等平台仍用根路径。

**路由**：项目使用 hash 模式（`/#/ai` 这类地址），刷新不会打到服务器路径，
因此 GitHub Pages 无需额外配置 404.html 回退。

## 首屏性能优化（Day 13）

Day12 把 `echarts` 单包从 640.91 kB 拆到 462.47 kB 后，构建告警已经消除，
问题随即从「包太大」变成「**JS 到手之前用户看到什么**」。
体积再小，弱网下从白屏到画出内容仍有数秒空窗，所以 Day13 分两条线推进：

| 关注点 | 手段 |
|---|---|
| 内容何时**出现** | `index.html` 内联首屏启动骨架 |
| 内容何时**就绪** / 切换多快 | 路由级懒加载 + hover 预取 chunk |
| 等待期间**看到什么** | `ChartSkeleton` 骨架屏占位 |

### 1. 首屏启动骨架（`index.html`）

把一段极小的内联样式与 HTML 直接放进 `#app`：深色渐变底 + 标题 + 进度条 + 「正在加载可视化模块…」。

- **为什么放在 `#app` 里**：`app.mount('#app')` 会清空容器内容，占位被整体替换，
  不需要额外写「挂载后删除」的逻辑，也不会残留节点；
- **为什么样式必须内联**：外链 CSS 本身要一次请求，等于把「白屏」换成「无样式白屏」；
- **底色与 `DashboardLayout` 对齐**（`#0a1929 → #1a2332`），挂载瞬间不闪白；
- 附带 `prefers-reduced-motion` 降级，动画可关。

### 2. 路由级懒加载 + hover 预取

`router/index.ts` 把四个视图的 loader 抽成 `viewLoaders` 对象，路由配置与预取函数
**共用同一份引用**——避免两处各写一次 `import()` 导致路径漂移、chunk 重复打包。

```ts
const viewLoaders = {
  dashboard: () => import('@/views/DashboardView.vue'),
  'chart-gallery': () => import('@/views/ChartGalleryView.vue'),
  'map-view': () => import('@/views/MapView.vue'),
  'ai-chat': () => import('@/views/AiChatView.vue')
}

const prefetched = new Set<ViewName>()

export function prefetchView(name: ViewName): void {
  if (prefetched.has(name)) return          // 幂等：重复 hover 不重复请求
  prefetched.add(name)
  void viewLoaders[name]().catch(() => {
    prefetched.delete(name)                 // 失败回滚，允许下次重试
  })
}
```

`AppHeader` 的导航项在 `mouseenter` / `focus` 时调用 `prefetchView(name)`，
用户点下去时模块已在内存里。**用 hover 而不是 idle 全量预取**：
hover 是「有明确意图」的信号，idle 预取会把所有路由 chunk 都拉一遍，对流量敏感场景是浪费。

顺带补了 `scrollBehavior: () => ({ top: 0 })`，切路由不再停在上页滚动位置。

### 3. 骨架屏占位（`ChartSkeleton.vue`）

纯 CSS 微光动画，零依赖零请求，四个变体：`chart`（柱条）/ `panel`（标题条 + 柱条）/
`map`（同心圆）/ `stat`（数值行）。柱高用 `28 + (i * 37) % 66` 生成伪随机感，
动画延迟递增 90ms，避免一排等高的「假图表」。

接入两处：

- **`BaseChart` 懒渲染等待期**：Day7 的 `useInView` 让图表进入视口才初始化，
  等待期间容器是空的，没有固定高度就会出现「先塌陷、后撑开」。
  这里有个坑：骨架屏**不能**和 ECharts 容器做成同一父容器的前后节点——
  `echarts.init` 会往容器追加 `canvas`，两者会互相挤压导致闪动。
  最终改为**兄弟节点 + 绝对定位覆盖**（`inset: 0` + `pointer-events: none`），
  `inView` 翻转时原地换成 canvas，视觉上只是内容淡入。
- **`PanelState` 的 loading 态**：新增 `skeleton` 开关，打开后渲染 `variant="panel"`
  骨架屏，与真实图表同构（都有标题条 + 主体区），数据回来只是「灰柱换彩图」。
  `DashboardView` 的整屏加载态直接使用。

> 没有全站替换 spinner：小面积、短耗时场景转圈更合适，骨架屏适合「有明确版式、等待较久」的区域。

### 4. 构建侧收口

```ts
build: {
  chunkSizeWarningLimit: 600,
  assetsInlineLimit: 4096,     // 小资源内联，省请求
  sourcemap: false,
  modulePreload: {
    polyfill: true,
    resolveDependencies: (_f, deps) => deps.filter((d) => /\.js$/.test(d))
  }
}
```

`modulePreload.resolveDependencies` 只保留 `.js` 依赖，避免把 css 等也塞进
`<link rel="modulepreload">` 白白膨胀首屏 head。

### 实测（Day 13 构建）

```
✓ built in ~3.5s，无 chunk 体积告警

dist/index.html                              2.48 kB │ gzip:   1.38 kB
dist/assets/DashboardView-*.js               5.54 kB │ gzip:   2.51 kB
dist/assets/ChartGalleryView-*.js            1.65 kB │ gzip:   1.10 kB
dist/assets/MapView-*.js                     4.24 kB │ gzip:   2.30 kB
dist/assets/AiChatView-*.js                 24.82 kB │ gzip:  11.37 kB
dist/assets/vendor-*.js                     52.71 kB │ gzip:  20.13 kB
dist/assets/vue-*.js                        98.03 kB │ gzip:  38.21 kB
dist/assets/echarts-zrender-*.js           180.24 kB │ gzip:  59.29 kB
dist/assets/echarts-*.js                   462.47 kB │ gzip: 154.61 kB
```

关键点：**echarts 不再出现在首屏预加载列表里**，四个路由各自成 chunk，
首页只加载主包 + `DashboardView`。

## 打包优化与部署收尾（Day 14）

Day 14 做三件事：把分包判据从「是什么库」换成「变得多快」、补上体积回归脚本、补齐 Vercel 部署配置并写复盘。

### 1. 分包判据：体积 × 变更频率

Day 12 的 `manualChunks` 是按库的身份分的（`echarts` / `vue` / 其余）。问题在于：
`vue-router`、`pinia` 的升级节奏和 `vue` 本体并不一致，合在一个 chunk 里会让任一方升级
都刷新整块 hash，缓存全部失效。

Day 14 改成按**体积 × 变更频率**分档：

```ts
manualChunks(id: string) {
  if (!id.includes('node_modules')) return
  if (id.includes('zrender')) return 'echarts-zrender'        // 体积大 + 几乎不变
  if (id.includes('echarts')) return 'echarts'
  // ⚠ vue-router / pinia 的 id 里也含 "vue"，必须排在 vue 判断之前
  if (id.includes('vue-router') || id.includes('pinia')) return 'vue-libs'
  if (id.includes('@vue/') || id.includes('/vue/')) return 'vue'
  if (id.includes('axios')) return 'http'                     // 请求基础设施，不随业务改
  return 'vendor'
}
```

判断顺序是这里唯一的坑：`vue-router`、`pinia` 的模块路径字符串里都含 `vue`，
若 `vue` 的判断写在前，它们会被误吸进 `vue` 块，等于白拆。

同时把 `chunkSizeWarningLimit` 从 600 收紧到 **500**——分档之后已经不该有块摸到这条线，
阈值收紧才能在下一次退化时立刻报警。

### 2. 体积回归：`npm run analyze`

新增 `scripts/analyze-dist.mjs`，零依赖（只用 `node:fs` / `node:zlib`）：

```bash
npm run build && npm run analyze
```

输出三段：

1. 全部资源的**原始体积 + 真实 gzip 体积**，按体积降序；
2. 解析 `index.html` 的 `src` / `modulepreload`，标出**首屏关键 JS** 并汇总；
3. 单块 gzip 超过预算（默认 160 KB）时明确告警。

没有用 `rollup-plugin-visualizer`：它给的是交互式 HTML，体积趋势要人去看图；
收尾阶段更需要**能在 CI 里断言的数字**。二十几行 gzip 逻辑换一个可回归基线，比多装一个依赖划算。

### 3. 实测：首屏 JS 降 33%

同一台机器 `npm run build`，Day 13 与 Day 14 对比：

| 指标 | Day 13 | Day 14 | 变化 |
| --- | --- | --- | --- |
| 首屏关键 JS（原始） | 150.74 kB | **101.45 kB** | −49.29 kB（−32.7%） |
| 首屏关键 JS（gzip） | 58.34 kB | **40.62 kB** | −17.72 kB（−30.4%） |
| 分包数 | 4 类 | 6 类 | 缓存粒度更细 |
| chunk 体积告警 | 无 | 无（阈值收紧至 500 kB） | — |

Day 14 分档结果：

```
dist/assets/echarts-*.js           462.47 kB │ gzip: 154.61 kB
dist/assets/echarts-zrender-*.js   180.24 kB │ gzip:  59.29 kB
dist/assets/vue-*.js                68.32 kB │ gzip:  27.03 kB   ★首屏
dist/assets/http-*.js               51.44 kB │ gzip:  19.49 kB
dist/assets/vue-libs-*.js           29.68 kB │ gzip:  11.82 kB   ★首屏
dist/assets/vendor-*.js              1.28 kB │ gzip:   0.73 kB

✓ built in 7.22s，无 chunk 体积告警
```

★ = 出现在 `index.html` 预加载列表里。首屏只剩 `index` + `vue` + `vue-libs` 三个 JS，
`echarts` 与 `axios` 都随路由按需加载。

变化来自两处：`vue-libs` 独立后首屏不再为 router/pinia 付整块代价；
`http`（axios）独立后首屏完全不加载它。

### 4. 双平台部署

**GitHub Pages（主）** —— `.github/workflows/deploy.yml`，推 `master` 即构建部署。三个易漏点：

- `base` 必须带仓库名（`/smart-city-dashboard/`），否则子路径下 JS/CSS 全部 404；用 `process.env.GITHUB_ACTIONS` 区分 CI 与本地。
- 权限需显式声明 `pages: write` + `id-token: write`，缺一个就在 deploy 步骤失败。
- `concurrency.group: pages` 保证同一时间只跑一个部署，新推送取消旧任务。

**Vercel（备）** —— `vercel.json`：

```json
{
  "framework": "vite",
  "installCommand": "npm ci",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "cleanUrls": true,
  "headers": [
    { "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }
  ],
  "rewrites": [{ "source": "/((?!assets/).*)", "destination": "/index.html" }]
}
```

`/assets/*` 打 `immutable` 长缓存（文件名带 hash，天然可永久缓存）；
其余路径 rewrite 到 `index.html`（当前用 hash 路由不依赖 history fallback，但保留这条对以后换模式更稳）。

### 5. 复盘文档

`docs/RETROSPECTIVE.md` 记录了从「功能能用」到「交付可用」的完整复盘：
五个真正卡住过的问题（ECharts 全量引入、骨架屏挤压、modulepreload 塞 CSS、
大屏缩放发虚、SSE 截断 Markdown）、Day 12–14 的三步性能收尾、以及「如果重来一次」的取舍。

## 规划与复盘

开发按 Day 递进推进。各阶段的目标、实现与踩坑复盘见仓库根目录的 `dayN-*.txt` 开发日志；
两周迭代的整体复盘见 [`docs/RETROSPECTIVE.md`](docs/RETROSPECTIVE.md)。
