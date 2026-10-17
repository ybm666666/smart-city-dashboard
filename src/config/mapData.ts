/**
 * Day6：地图数据配置中心
 *
 * - CHONGQING_MAP：地图元信息（mapName + GeoJSON 地址）
 * - districtStats：区县指标数据，供地图热力渲染与联动详情使用。
 *
 * Day12-hotfix：GeoJSON 改为**本地内置**，不再依赖阿里云 DataV 外链。
 *
 * 背景：原先直接请求 `https://geo.datav.aliyun.com/...`，本地开发可用，
 * 但部署到 GitHub Pages 后该域名返回 403（外链被拒 / 跨域限制），
 * 地图页直接白屏。因为这份 GeoJSON 是**静态且不变**的，
 * 放在 public/ 下随站点一起发布最稳：
 *   - 不受第三方限流、跨域、可访问性变化影响
 *   - 同源请求，无 CORS 问题
 *   - 走静态资源缓存，二次访问几乎零成本
 *
 * 路径用 `import.meta.env.BASE_URL` 拼接：GitHub Pages 部署在
 * `/smart-city-dashboard/` 子路径下（见 vite.config.ts 的 base），
 * 硬编码 `/geojson/...` 会 404。
 * 数据来自 DataV.GeoAtlas 的 500000_full（重庆，含下辖全部区县），
 * 已固化到 public/geojson/chongqing.json。
 */

export interface DistrictStat {
  name: string
  /** GDP（亿元） */
  gdp: number
  /** 常住人口（万人） */
  population: number
  /** 综合发展指数（0-100） */
  index: number
  /** 三次产业结构占比 [一产, 二产, 三产] */
  industry: [number, number, number]
}

export const CHONGQING_MAP = {
  name: 'chongqing',
  // 本地静态资源：随构建产物一起发布，BASE_URL 兼容子路径部署
  url: `${import.meta.env.BASE_URL}geojson/chongqing.json`
} as const

// 重庆主城都市区核心区县（名称与 GeoJSON 中的 feature.name 对齐，如「渝中区」）
export const districtStats: DistrictStat[] = [
  { name: '渝中区', gdp: 121, population: 57, index: 92, industry: [0, 20, 80] },
  { name: '江北区', gdp: 96, population: 92, index: 88, industry: [1, 35, 64] },
  { name: '渝北区', gdp: 220, population: 220, index: 90, industry: [3, 52, 45] },
  { name: '沙坪坝区', gdp: 92, population: 148, index: 85, industry: [2, 40, 58] },
  { name: '九龙坡区', gdp: 148, population: 121, index: 83, industry: [2, 45, 53] },
  { name: '南岸区', gdp: 78, population: 96, index: 80, industry: [2, 42, 56] },
  { name: '北碚区', gdp: 65, population: 82, index: 76, industry: [4, 55, 41] },
  { name: '巴南区', gdp: 90, population: 105, index: 74, industry: [6, 58, 36] },
  { name: '大渡口区', gdp: 42, population: 35, index: 70, industry: [1, 60, 39] }
]
