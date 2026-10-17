# 复盘：从「功能能用」到「交付可用」

> 本文是 `smart-city-dashboard` 两周迭代的收尾复盘，记录走过的弯路、做对的取舍，以及阶段化的体积与首屏数据。
> 各天的逐日开发日志见仓库根目录 `dayN-*.txt`。

---

## 一、项目目标与实际结果

| 维度 | 立项时的设想 | 最终落地 |
| --- | --- | --- |
| 可视化 | ECharts 画几个图 | 配置驱动的图表工厂（`buildOption`），9 类图表由 JSON 描述 |
| 地图 | 放一张静态地图 | GeoJSON 热力 + 与图表联动，`registrymap` 按需注册而非全量引入 |
| AI | 输入框问一句出一张图 | Schema 校验 → 降级兜底 → 结果微调 → 会话持久化 → SSE 流式 + Markdown 渲染 |
| 工程化 | 能跑起来就行 | 分包、首屏骨架、路由预取、体积回归脚本、双平台部署 |

一句话总结：**把「Demo 能跑」推到「别人打开链接就能用」**。

---

## 二、五个真正卡住过的问题

### 1. ECharts 全量引入 = 一个 1MB 的单包

**现象**：首版 `import * as echarts from 'echarts'`，构建产物单个 JS 超过 1MB，白屏明显。

**根因**：ECharts 默认入口包含全部图表类型、全部坐标系、全部渲染器。

**做法**：改按需引入 —— 只 `use()` 用到的 Bar/Line/Pie/Map/Heatmap + CanvasRenderer，地图数据走 `registerMap` 按需注册。

**结果**：`echarts` 主体从 ~1MB 降到 462 kB（gzip 154 kB），且**不再进入首屏预加载列表**。

**教训**：包里体积最大的依赖，永远先检查它的默认入口是不是「全家桶」。

---

### 2. 骨架屏把图表挤闪了一下

**现象**：给图表加 loading 骨架后，数据回来瞬间画面抖动，像是布局塌了一下。

**根因**：骨架屏和 ECharts 容器被写成同一父容器的前后兄弟节点。`echarts.init` 往容器里追加 `canvas` 时，两者一起参与布局计算，互相挤压。

**做法**：改成**骨架屏绝对定位覆盖**（`inset: 0` + `pointer-events: none`）在容器之上，容器本身尺寸始终由父级撑满。`inView` 翻转时只是把覆盖层换成 canvas，视觉上是内容淡入，不是布局重排。

**教训**：占位元素要「不影响布局」，否则它本身就成了新的抖动源。

---

### 3. `modulepreload` 把 CSS 也塞进了 head

**现象**：首屏 `<head>` 里出现一堆 `<link rel="modulepreload">`，其中包含 css，head 体积反而变大。

**做法**：`modulePreload.resolveDependencies` 里只保留 `.js` 依赖：

```ts
modulePreload: {
  polyfill: true,
  resolveDependencies: (_filename, deps) => deps.filter((d) => /\.js$/.test(d))
}
```

**教训**：预加载提示是「提前要东西」，要错了就是纯负收益。默认行为不等于合理行为。

---

### 4. 移动端大屏缩放后字体发虚

**现象**：用 `transform: scale()` 做等比缩放，PC 上正常，高分屏/缩放下文字糊。

**根因**：整体 scale 会把已经光栅化的文本再放大，等于二次采样。

**做法**：`useScale` 只在超宽/超高时按比例缩放并配合 `transform-origin`，同时给小屏单独的流式布局分支（`DashboardLayout` 双模式），不再对小屏硬缩。

**教训**：大屏的「自适应」不是纯数学缩放，得区分「等比呈现」和「重排」两种意图。

---

### 5. SSE 流式在 Markdown 里被截断成半个标记

**现象**：流式输出时，`**加粗` 这种只到一半的标记会被渲染成字面量，或者出现结构错乱的 HTML。

**做法**：手写零依赖 Markdown 渲染器（`utils/markdown.ts`），**先转义 HTML 再解析**，并对未闭合的行内标记做「不渲染、留给下一帧」的处理；配合缓冲区按行 flush，避免半个语法块进渲染。

**教训**：流式场景下，所有「需要看到结尾才能确定」的语法都要做未完成态处理。安全上先转义再解析，天然挡住注入。

---

## 三、Day 12–14：性能收尾的三步

### 第一步（Day12）：先量，再拆

不猜，直接看构建输出。当时单包 `echarts` 640.91 kB 触发告警，于是把渲染内核 `zrender` 与应用层 `echarts` 拆开——两者版本独立、更新频率不同，分开后单包回落到阈值内，也让缓存粒度更细。

### 第二步（Day13）：把「等待」变成「有形状的等待」

- `index.html` 内联启动骨架：HTML 一解析就有画面，不等 JS。
- 路由懒加载 + 幂等 `prefetchView`：hover/focus 导航项时预取目标 chunk，点击时已经在缓存里。
- `ChartSkeleton.vue` 提供 `variant / panel / map / stat` 四种形态，与真实内容同构——「灰柱换彩图」而不是「转圈换内容」。

同时收口构建：`assetsInlineLimit: 4096` 内联小资源、`modulePreload` 只留 js。

### 第三步（Day14）：分包判据从「是什么」改成「变得多快」

Day12 的 `manualChunks` 是按「库的身份」分的（echarts / vue / 其他）。Day14 换成一条更本质的判据：

> **体积 × 变更频率**。体积大又几乎不变的，单独成块吃长期缓存；变更频率不同的，不要共享同一个 hash。

于是新增两个独立块：

- `vue-libs`（`vue-router` + `pinia`）：它们升级节奏与 `vue` 本体不同，合在一起会让 vue 的 hash 被牵连。
- `http`（`axios`）：请求基础设施几乎不随业务改，独立后业务提交不会击穿它。

**踩坑**：`vue-router`、`pinia` 的模块 id 字符串里都含 `vue`，如果 `vue` 的判断写在前面，它们会被误吸进 `vue` 块。因此判断顺序必须是「先 router/pinia，再 @vue/vue」。

### 实测对比（同一台机器，`npm run build`）

| 指标 | Day13 | Day14 | 变化 |
| --- | --- | --- | --- |
| 首屏关键 JS（原始） | 150.74 kB | **101.45 kB** | −49.29 kB（−32.7%） |
| 首屏关键 JS（gzip） | 58.34 kB | **40.62 kB** | −17.72 kB（−30.4%） |
| 分包数 | 4 类 | 6 类 | 缓存粒度更细 |
| chunk 体积告警 | 无 | 无（阈值收紧至 500 kB） | — |

Day14 分档结果：

```
echarts          462.47 kB │ gzip: 154.61 kB
echarts-zrender  180.24 kB │ gzip:  59.29 kB
vue               68.32 kB │ gzip:  27.03 kB   ★首屏
http              51.44 kB │ gzip:  19.49 kB
vue-libs          29.68 kB │ gzip:  11.82 kB   ★首屏
vendor             1.28 kB │ gzip:   0.73 kB
```

首屏只剩 `index` + `vue` + `vue-libs` 三个 JS，合计 gzip 40.62 kB。`echarts`、`axios` 都随路由按需加载。

> ★ = 出现在 `index.html` 的预加载列表里。

---

## 四、体积回归：把「感觉变大了」变成「数字变大了」

肉眼盯构建日志不可靠。新增 `scripts/analyze-dist.mjs`（零依赖，只用 `node:fs` / `node:zlib`）：

```bash
npm run build && npm run analyze
```

它做三件事：

1. 读 `dist` 全部资源，输出**原始体积 + 真实 gzip 体积**，按体积降序；
2. 解析 `index.html` 的 `src` / `modulepreload`，标出**首屏关键 JS** 并汇总；
3. 单块 gzip 超过预算（默认 160 KB）时明确告警，非零退出便于接入 CI。

**为什么不用现成的 `rollup-plugin-visualizer`**：它产出的是交互式 HTML 报告，体积趋势要人去看图；而收尾阶段真正需要的是**能在 CI 里断言的数字**。22 行 gzip 逻辑换一个可回归的基线，比多装一个依赖划算。

---

## 五、部署：双平台，各取所需

### GitHub Pages（主）

`.github/workflows/deploy.yml`，推 `master` 即构建部署。三个容易漏的点：

1. **`base` 必须带仓库名**：Pages 站点在 `/<repo>/` 子路径下，否则 JS/CSS 全部 404。用 `process.env.GITHUB_ACTIONS` 区分 CI 与本地，本地仍是 `/`。
2. **权限要显式声明**：`pages: write` + `id-token: write`，缺一个就在 deploy 步骤失败。
3. **`concurrency` 加 group**：同一时间只跑一个部署，新推送取消旧任务，避免并发部署互相覆盖。

### Vercel（备）

`vercel.json` 里做了三件 Pages 做不到的事：

- `assets/(.*)` 打 `immutable` 长缓存（文件名带 hash，天然可永久缓存）；
- 其余路径 rewrite 到 `index.html`（虽然本项目用 hash 路由不依赖 history fallback，但保留这条对以后换模式更稳）；
- `cleanUrls: true` 去掉 `.html` 后缀。

**为什么两个都要**：Pages 免费且与仓库同源，适合当主站；Vercel 的 CDN 节点更近、能自定义 header，适合当演示备用。配置都在仓库里，切换成本为零。

---

## 六、复盘：做对了什么，哪里还能更好

### 做对的

- **先测量再优化**。每一次分包调整都有构建输出做对照，没有凭感觉改配置。
- **占位与内容同构**。骨架屏按真实版式画，加载完成只是「换色」，没有布局跳变。
- **配置驱动**。图表、地图、AI 出图都收敛到一个 Schema，新增一种图表只写配置不改组件。
- **零依赖优先**。Markdown 渲染、体积分析、SSE 解析都是手写几十行，避免为小功能引入大依赖——这本身就是首屏优化。

### 还能更好的

- **没有自动化测试**。全程靠手点验证，AI 出图的 Schema 降级逻辑尤其值得加单测。
- **体积只做了基线告警，没做趋势**。理想是把每次构建的首屏 gzip 存成历史曲线，做真正的回归拦截。
- **`dayN-*.txt` 日志没纳入版本管理**。它们散在本地，检索和协作都不方便，后续应整理成 `docs/log/`。
- **地图数据 158 kB 未压缩传输**。GeoJSON 走 CDN 时开 Brotli 能再降一截，目前只是靠 gzip。

### 如果重来一次

第一周就会先做「按需引入 + 分包 + 体积脚本」这三件基础设施，而不是留到最后。**性能是架构问题，不是收尾工作**——把收尾当成补课，成本会更高。

---

## 七、交付清单

- 源码：`src/`，43 个文件，Vue3 + TS + Pinia
- 构建：`npm run build`（含 `vue-tsc` 类型检查）
- 体积：`npm run analyze`
- 部署：GitHub Pages（`.github/workflows/deploy.yml`）、Vercel（`vercel.json`）
- 文档：`README.md`（技术栈 / 各天专题）、`docs/RETROSPECTIVE.md`（本文）
