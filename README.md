# AI 数据可视化大屏 · Smart City Dashboard

基于 Vue3 + TypeScript 的智慧城市数据大屏，前端工程化实践项目。支持大屏数据可视化、AI 自然语言出图与流式对话（开发中）。

## 技术栈

- **框架**：Vue 3（`<script setup>` 组合式 API）+ Vite
- **语言**：TypeScript
- **状态管理**：Pinia
- **图表**：ECharts 5
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
├─ api/          # 服务层：Axios 实例 + 拦截器、LLM 调用（普通/SSE 流式）
├─ assets/       # 全局样式
├─ components/   # 通用组件：BaseChart / ConfigChart / ChartPanel / StatIndicator
├─ config/       # 配置驱动：buildOption 图表工厂 + 示例配置 demos
├─ hooks/        # 组合式函数：useEcharts / useScale / useSSE
├─ layouts/      # 布局层：DashboardLayout（1920×1080 等比缩放）
├─ router/       # 路由（hash 模式）
├─ stores/       # Pinia：useDashboardStore
├─ types/        # 全局 TS 类型
├─ utils/        # 工具：chartSchema（Schema 校验 + 降级兜底）
└─ views/        # 页面：DashboardView / ChartGalleryView / AiChatView
```

## 功能进度

- [x] Vue3 + TS + Pinia 工程化分层（Day 1–2）
- [x] 1920×1080 等比缩放自适应（`useScale` + ResizeObserver）
- [x] 组件化重构：抽取布局组件 + 数据配置中心（Day 3–4）
- [x] 图表层工程化：ECharts 按需引入 + vendor 分包（Day 4）
- [x] 配置驱动通用图表组件（7 类型）+ 图表图库（Day 5）
- [ ] 地图与真实自适应 —— Day 6
- [ ] Pinia + 请求层驱动真实数据 —— Day 7
- [ ] AI 自然语言出图（LLM → 配置 JSON → 渲染）—— Day 8–10
- [ ] SSE 流式对话 + 中断 + Markdown —— Day 11–12
- [ ] 性能优化（懒渲染 / dataset 增量更新）—— Day 7–14
- [ ] 部署上线（GitHub Pages / Vercel）

## 规划与复盘

详细开发计划见根目录 `两周开发任务计划.md`。
