import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Day6：真实屏幕适配（非等比缩放）
 *
 * 与 Day2 的 useScale（1920×1080 整体等比缩放）互补：
 * useResponsive 关注「当前视口」，提供断点 / 网格列数等信号，
 * 供布局层用 CSS Grid / Flex 做流式排布（元素尺寸随视口自适应，不整体拉伸变形）。
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'large'

export function useResponsive() {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : 1920)
  const height = ref(typeof window !== 'undefined' ? window.innerHeight : 1080)

  function update() {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', update)
  })

  const device = computed<DeviceType>(() => {
    const w = width.value
    if (w < 768) return 'mobile'
    if (w < 1280) return 'tablet'
    if (w < 1920) return 'desktop'
    return 'large'
  })

  // 流式布局下建议的主内容列数
  const columns = computed(() => {
    switch (device.value) {
      case 'mobile':
        return 1
      case 'tablet':
        return 2
      default:
        return 3
    }
  })

  const landscape = computed(() => width.value >= height.value)

  return { width, height, device, columns, landscape }
}
