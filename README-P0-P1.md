# P0–P1 上手说明：环境 + 工程化（Day 0–2）

本目录 `dashboard-vue/` 是你「AI 数据可视化大屏」的新版工程（Vue3 + Vite + TS + Pinia）。
原有的静态版（`index.html` / `css` / `js` / `8.10`）保留不动，作为视觉基线参考。

---

## 一、Day 0：环境准备

1. 安装 **Node.js ≥ 18**（本工程已在 Node v20 下验证），确认：
   ```bash
   node -v
   npm -v
   ```
2. 配置大模型 Key（`.env.local`）：
   - 文件已生成：`dashboard-vue/.env.local`
   - 把 `VITE_LLM_API_KEY=sk-your-key-here` 换成你自己的真实 Key。
   - `.env.local` 已在 `.gitignore` 中，**不会被提交**。
   - 可参考同目录的 `.env.example`。
3. 初始化 Git（如果还没做）：
   ```bash
   cd dashboard-vue
   git init
   git add .
   git commit -m "chore: init vue3+ts+pinia dashboard"
   ```

> ⚠️ 安全提醒：前端直连大模型会把 Key 暴露在浏览器里。仅用于本地学习/演示；真正部署时建议加一层自己的服务端代理（Serverless / Cloudflare Worker）。

---

## 二、Day 1–2：工程化与分层

### 启动方式
```bash
cd dashboard-vue
npm install
npm run dev        # 开发：默认 http://localhost:5173
npm run build      # 生产构建（含 TS 类型检查）
npm run preview    # 预览构建产物
```

### 目录分层（简历要求的「布局层 / 图表层 / 服务层」）
```
dashboard-vue/
├─ index.html
├─ package.json
├─ vite.config.ts         # alias @ -> src / dev proxy
├─ tsconfig.json
├─ .env.example / .env.local / .gitignore
└─ src/
   ├─ api/                # 服务层：http.ts(axios 拦截器) / llm.ts(大模型调用)
   ├─ assets/             # 全局样式 main.css
   ├─ components/         # 通用组件：BaseChart / ChartPanel / StatIndicator
   ├─ config/charts/      # 配置驱动：buildOption 工厂
   ├─ hooks/              # 组合式函数：useEcharts / useScale
   ├─ layouts/            # 布局层：DashboardLayout(1920×1080 等比缩放)
   ├─ router/             # 路由
   ├─ stores/             # Pinia：useDashboardStore
   ├─ types/              # 全局 TS 类型
   ├─ utils/              # 工具：chartSchema(Schema 校验 + 降级兜底)
   ├─ views/              # 页面：DashboardView / AiChatView
   ├─ App.vue
   └─ main.ts
```

### 各层职责与已实现的能力（对照简历）
| 层 | 文件 | 已实现 |
|---|---|---|
| 服务层 | `api/http.ts` | Axios 实例 + 请求拦截（注入 token）+ 响应拦截（统一解包/异常/401）|
| 服务层 | `api/llm.ts` | 大模型调用；`chatStream` 用 Fetch+ReadableStream 读 SSE，支持 AbortSignal 中断 |
| 状态层 | `stores/dashboard.ts` | Pinia：图表数据、loading/error、对话消息 |
| 图表层 | `components/BaseChart.vue` | 通用图表基座（传 option 即渲染）|
| 图表层 | `config/charts/index.ts` | 配置驱动 `buildOption(type, data)` |
| 图表层 | `hooks/useEcharts.ts` | init/resize/dispose，防内存泄漏 |
| 布局层 | `hooks/useScale.ts` | scale 等比缩放 + ResizeObserver，1080P~4K |
| 布局层 | `layouts/DashboardLayout.vue` | 1920×1080 设计稿整体缩放居中 |
| 工具层 | `utils/chartSchema.ts` | 图表配置 Schema 校验 + 降级兜底 |

### 当前完成度
- ✅ Day 0：环境 + `.env.local` + Git
- ✅ Day 1：Vite/Vue3/TS/Pinia 空工程 + alias + proxy + 分层目录
- ✅ Day 2：分层骨架落地，含一个**可运行的示例大屏**（`DashboardView`：GDP 折线、产业饼图、指标滚动、屏幕缩放）
- 🟡 待办（后续 Day）：通用图表 6+ 类型（Day5）、地图与真实自适应（Day6）、Pinia 驱动真实数据（Day7）、AI 出图（Day8–10）、SSE 对话（Day11–12）

### 验收（Day 2 收工自检）
- [ ] `npm run dev` 打开出现大屏（左侧两张图 + 指标数字滚动）
- [ ] `npm run build` 无 TS 报错
- [ ] 缩放到不同分辨率，内容整体等比缩放、不变形
- [ ] `src/` 分层目录齐全
- [ ] `.env.local` 未被 git 跟踪（`git status` 看不到它）
