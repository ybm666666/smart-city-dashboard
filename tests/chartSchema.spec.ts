import { describe, expect, it } from 'vitest'
import { extractJson, fallbackChartConfig, validateChartConfig } from '@/utils/chartSchema'

/**
 * 校验链是「AI 出图」的安全阀：
 * 模型返回的任何东西都要先过这里，非法一律返回 null 交给上层降级，
 * 而不是抛异常或把脏配置塞进图表。
 */
describe('extractJson：从模型文本里捞 JSON', () => {
  it('解析 ```json 代码块', () => {
    const text = '```json\n{"type":"line","xAxis":["A"],"series":[1]}\n```'
    expect(extractJson(text)).toEqual({ type: 'line', xAxis: ['A'], series: [1] })
  })

  it('解析前后带解释文字的裸 JSON', () => {
    expect(extractJson('好的，配置如下：{"type":"bar"} 以上')).toEqual({ type: 'bar' })
  })

  it('非字符串原样返回', () => {
    expect(extractJson(null)).toBeNull()
    expect(extractJson(undefined)).toBeUndefined()
  })

  it('没有 JSON / JSON 非法都返回 null', () => {
    expect(extractJson('这里没有任何配置')).toBeNull()
    expect(extractJson('{不是合法的 json}')).toBeNull()
    expect(extractJson('} 反序括号 {')).toBeNull()
  })
})

describe('validateChartConfig：按类型深度校验', () => {
  it('line 正常配置被清洗后返回', () => {
    const out = validateChartConfig({
      type: 'line',
      title: 'GDP 趋势',
      xAxis: ['2021', '2022'],
      series: [1, 2]
    })
    expect(out).toEqual({ type: 'line', title: 'GDP 趋势', xAxis: ['2021', '2022'], series: [1, 2] })
  })

  it('line 的 xAxis 数字会转成字符串，series 字符串数字会转成 number', () => {
    const out = validateChartConfig({ type: 'bar', xAxis: [1, 2], series: ['10', '20'] })
    expect(out?.xAxis).toEqual(['1', '2'])
    expect(out?.series).toEqual([10, 20])
  })

  it('line 支持多系列二维数组', () => {
    const out = validateChartConfig({
      type: 'line',
      xAxis: ['A', 'B'],
      series: [
        [1, 2],
        [3, 4]
      ]
    })
    expect(out?.series).toEqual([
      [1, 2],
      [3, 4]
    ])
  })

  it('line 缺 xAxis / xAxis 为空 / series 非数字都判非法', () => {
    expect(validateChartConfig({ type: 'line', series: [1, 2] })).toBeNull()
    expect(validateChartConfig({ type: 'line', xAxis: [], series: [1] })).toBeNull()
    expect(validateChartConfig({ type: 'line', xAxis: ['A'], series: ['不是数字'] })).toBeNull()
    expect(validateChartConfig({ type: 'line', xAxis: ['A'], series: [1, 'x'] })).toBeNull()
  })

  it('pie 正常数据通过，空数据 / 缺 name 判非法', () => {
    expect(validateChartConfig({ type: 'pie', data: [{ name: '一产', value: 10 }] })).toEqual({
      type: 'pie',
      data: [{ name: '一产', value: 10 }]
    })
    expect(validateChartConfig({ type: 'pie', data: [] })).toBeNull()
    expect(validateChartConfig({ type: 'pie', data: [{ value: 10 }] })).toBeNull()
    expect(validateChartConfig({ type: 'pie', data: [{ name: '一产', value: 'NaN' }] })).toBeNull()
  })

  it('gauge 缺 value 判非法，max 缺省补 100', () => {
    expect(validateChartConfig({ type: 'gauge', gauge: {} })).toBeNull()
    const out = validateChartConfig({ type: 'gauge', gauge: { value: '66' } })
    expect(out?.gauge).toEqual({ value: 66, max: 100 })
  })

  it('radar 缺 indicators 判非法，radarData 缺省补零', () => {
    expect(validateChartConfig({ type: 'radar' })).toBeNull()
    const out = validateChartConfig({
      type: 'radar',
      indicators: [
        { name: 'A', max: 100 },
        { name: 'B', max: 100 }
      ]
    })
    expect(out?.radarData).toEqual([0, 0])
  })

  it('map 允许只有类型，mapData 非法时降级为不设置', () => {
    expect(validateChartConfig({ type: 'map' })).toEqual({ type: 'map' })
    const out = validateChartConfig({ type: 'map', mapName: '杭州市', mapData: 'x' })
    expect(out).toEqual({ type: 'map', mapName: '杭州市' })
  })

  it('未知类型 / 非对象 / 空输入一律 null', () => {
    expect(validateChartConfig({ type: 'sunburst' })).toBeNull()
    expect(validateChartConfig(null)).toBeNull()
    expect(validateChartConfig('随便一句话')).toBeNull()
    expect(validateChartConfig({})).toBeNull()
  })

  it('直接传模型原文（带代码块）也能走完整链路', () => {
    const out = validateChartConfig('```json\n{"type":"pie","data":[{"name":"A","value":1}]}\n```')
    expect(out?.type).toBe('pie')
  })
})

describe('fallbackChartConfig：降级兜底', () => {
  it('返回一份自身合法的 line 配置（不会再被校验打回）', () => {
    const fallback = fallbackChartConfig()
    expect(validateChartConfig(fallback)).toEqual(fallback)
  })

  it('每次调用都是新对象，避免共享引用被改坏', () => {
    const a = fallbackChartConfig()
    const b = fallbackChartConfig()
    expect(a).not.toBe(b)
    expect(a).toEqual(b)
  })
})
