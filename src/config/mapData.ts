/**
 * Day6：地图数据配置中心
 *
 * - CHONGQING_MAP：地图元信息（mapName + GeoJSON 地址）
 *   GeoJSON 来自阿里云 DataV.GeoAtlas，全国 / 省市县边界可直接按 adcode 取用：
 *   500000 为重庆市，`_full` 后缀表示包含下辖全部区县。
 * - districtStats：区县指标数据，供地图热力渲染与联动详情使用。
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
  url: 'https://geo.datav.aliyun.com/areas_v3/bound/500000_full.json'
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
