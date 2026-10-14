import { ref } from 'vue'
import { echarts } from '@/hooks/useEcharts'

/**
 * Day6：地图注册组合式函数
 *
 * 职责：
 * - 按需拉取 GeoJSON（阿里云 DataV.GeoAtlas，全国 / 省市县边界）
 * - 用 echarts.registerMap 注册到全局地图仓库
 * - 同一张地图（mapName）只注册一次，避免重复请求与重复注册
 * - sessionStorage 缓存，刷新页面前不再重复下载
 *
 * 说明：GeoJSON 属于体积较大的静态资源，采用「运行时异步加载 + 缓存」而非打包进
 * bundle，避免主包体积膨胀（呼应 Day4 的按需引入 / 分包思路）。
 */

const registered = new Map<string, boolean>()
const pendingTasks = new Map<string, Promise<void>>()

function cacheKey(url: string) {
  return `geojson:${url}`
}

async function loadGeoJson(url: string): Promise<unknown> {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const cached = window.sessionStorage.getItem(cacheKey(url))
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch {
        // 缓存损坏则忽略，走网络重新拉取
        window.sessionStorage.removeItem(cacheKey(url))
      }
    }
  }

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`GeoJSON 加载失败（HTTP ${res.status}）`)
  }
  const geo = await res.json()

  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      window.sessionStorage.setItem(cacheKey(url), JSON.stringify(geo))
    } catch {
      // 超出存储配额时忽略，不影响本次渲染
    }
  }
  return geo
}

export function isMapRegistered(name: string): boolean {
  return registered.has(name)
}

/** 确保某张地图已注册（幂等，并发安全） */
export function ensureMapRegistered(name: string, url: string): Promise<void> {
  if (registered.has(name)) return Promise.resolve()
  const existing = pendingTasks.get(name)
  if (existing) return existing

  const task = loadGeoJson(url)
    .then((geo) => {
      // geo 为 GeoJSON 对象；类型上 echarts 接受宽松输入
      echarts.registerMap(name, geo as Parameters<typeof echarts.registerMap>[1])
      registered.set(name, true)
    })
    .finally(() => {
      pendingTasks.delete(name)
    })

  pendingTasks.set(name, task)
  return task
}

/** 组件内使用：返回地图注册状态（ready / pending / error） */
export function useMap(name: string, url: string) {
  const ready = ref(isMapRegistered(name))
  const pending = ref(!ready.value && !!url)
  const error = ref<string | null>(null)

  if (!ready.value) {
    ensureMapRegistered(name, url)
      .then(() => {
        ready.value = true
      })
      .catch((e: unknown) => {
        error.value = e instanceof Error ? e.message : String(e)
      })
      .finally(() => {
        pending.value = false
      })
  }

  return { ready, pending, error }
}
