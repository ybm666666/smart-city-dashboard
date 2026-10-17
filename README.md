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

## 规划与复盘

开发按 Day 递进推进，各阶段的目标、实现与踩坑复盘见仓库根目录的 `dayN-*.txt` 开发日志。
