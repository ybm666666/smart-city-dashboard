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
├─ utils/        # 工具：chartSchema（Schema 校验 + 降级兜底）、chartOps（结果微调，Day9）
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
- [ ] SSE 流式对话 + 中断 + Markdown —— Day 11–12
- [x] 性能优化：图表懒渲染（IntersectionObserver）+ dataset 增量更新 —— Day 7
- [ ] 部署上线（GitHub Pages / Vercel）

## 地图说明（Day 6）

- 地图 GeoJSON 采用运行时异步加载（阿里云 DataV.GeoAtlas），并用 `sessionStorage` 缓存，
  不打包进 bundle，避免主包体积膨胀（呼应 Day 4 的按需引入 / 分包思路）。
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

## 规划与复盘

详细开发计划见根目录 `两周开发任务计划.md`。
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
├─ utils/        # 工具：chartSchema（Schema 校验 + 降级兜底）
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
- [ ] SSE 流式对话 + 中断 + Markdown —— Day 11–12
- [x] 性能优化：图表懒渲染（IntersectionObserver）+ dataset 增量更新 —— Day 7
- [ ] 部署上线（GitHub Pages / Vercel）

## 地图说明（Day 6）

- 地图 GeoJSON 采用运行时异步加载（阿里云 DataV.GeoAtlas），并用 `sessionStorage` 缓存，
  不打包进 bundle，避免主包体积膨胀（呼应 Day 4 的按需引入 / 分包思路）。
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

## 规划与复盘

详细开发计划见根目录 `两周开发任务计划.md`。
