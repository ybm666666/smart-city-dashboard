import { describe, expect, it } from 'vitest'
import type { ChartConfig } from '@/types'
import {
  appendPoint,
  applyRefine,
  changeType,
  describeRefine,
  removeLast,
  setTitle
} from '@/utils/chartOps'

/**
 * 微调是「本地零延迟」路径：不经过模型，直接改配置。
 * 这类逻辑一旦出错不会有任何报错，只会静默渲染出错图表 —— 所以必须单测。
 */
const line: ChartConfig = {
  type: 'line',
  title: 'GDP 趋势',
  xAxis: ['2021', '2022', '2023'],
  series: [100, 120, 140]
}

describe('setTitle', () => {
  it('改标题并保持其它字段', () => {
    const out = setTitle(line, '  新标题  ')
    expect(out.title).toBe('新标题')
    expect(out.xAxis).toEqual(line.xAxis)
  })

  it('传空串清除标题', () => {
    expect(setTitle(line, '   ').title).toBeUndefined()
  })

  it('不改动入参（纯函数）', () => {
    const before = JSON.stringify(line)
    setTitle(line, '会被忽略')
    expect(JSON.stringify(line)).toBe(before)
  })
})

describe('changeType', () => {
  it('line → pie 复用类目与数值', () => {
    const out = changeType(line, 'pie')
    expect(out.type).toBe('pie')
    expect(out.data).toEqual([
      { name: '2021', value: 100 },
      { name: '2022', value: 120 },
      { name: '2023', value: 140 }
    ])
    expect(out.title).toBe('GDP 趋势')
    expect(out.xAxis).toBeUndefined()
  })

  it('line → gauge 取最后一个值作为指针', () => {
    const out = changeType(line, 'gauge')
    expect(out.gauge?.value).toBe(140)
    expect(out.gauge?.max).toBe(140)
  })

  it('line → radar 生成维度并同步数值', () => {
    const out = changeType(line, 'radar')
    expect(out.indicators).toHaveLength(3)
    expect(out.radarData).toEqual([100, 120, 140])
  })

  it('转到 map 时原样返回（地图依赖地理数据，不做转换）', () => {
    expect(changeType(line, 'map')).toEqual(line)
    expect(changeType(line, 'map')).not.toBe(line)
  })

  it('空配置也能换类型，用 A/B/C 占位避免空图', () => {
    const out = changeType({ type: 'line' }, 'line')
    expect(out.xAxis).toEqual(['A', 'B', 'C'])
    expect(out.series).toEqual([1, 2, 3])
  })

  it('不改动入参', () => {
    const before = JSON.stringify(line)
    changeType(line, 'pie')
    expect(JSON.stringify(line)).toBe(before)
  })
})

describe('appendPoint', () => {
  it('追加指定名称与数值', () => {
    const out = appendPoint(line, '2024', 160)
    expect(out.xAxis).toEqual(['2021', '2022', '2023', '2024'])
    expect(out.series).toEqual([100, 120, 140, 160])
  })

  it('不传名称时按「类目N」自增命名', () => {
    expect(appendPoint(line).xAxis?.at(-1)).toBe('类目4')
  })

  it('不传数值时生成 20~100 之间的整数', () => {
    const v = (appendPoint(line).series as number[]).at(-1) as number
    expect(Number.isInteger(v)).toBe(true)
    expect(v).toBeGreaterThanOrEqual(20)
    expect(v).toBeLessThanOrEqual(100)
  })

  it('pie 追加到 data 数组', () => {
    const pie: ChartConfig = { type: 'pie', data: [{ name: 'A', value: 1 }] }
    expect(appendPoint(pie, 'B', 2).data).toEqual([
      { name: 'A', value: 1 },
      { name: 'B', value: 2 }
    ])
  })

  it('不改动入参', () => {
    const before = JSON.stringify(line)
    appendPoint(line, 'X', 1)
    expect(JSON.stringify(line)).toBe(before)
  })
})

describe('removeLast', () => {
  it('line 同时删类目与数值，保持等长', () => {
    const out = removeLast(line)
    expect(out.xAxis).toEqual(['2021', '2022'])
    expect(out.series).toEqual([100, 120])
  })

  it('pie 删最后一个扇区', () => {
    const pie: ChartConfig = {
      type: 'pie',
      data: [
        { name: 'A', value: 1 },
        { name: 'B', value: 2 }
      ]
    }
    expect(removeLast(pie).data).toEqual([{ name: 'A', value: 1 }])
  })

  it('空数据不报错', () => {
    expect(() => removeLast({ type: 'line' })).not.toThrow()
    expect(removeLast({ type: 'pie' }).data).toBeUndefined()
  })
})

describe('applyRefine：统一入口', () => {
  it('按 action.kind 分发', () => {
    expect(applyRefine(line, { kind: 'setTitle', title: 'T' }).title).toBe('T')
    expect(applyRefine(line, { kind: 'changeType', type: 'pie' }).type).toBe('pie')
    expect((applyRefine(line, { kind: 'appendPoint', name: 'N', value: 9 }).xAxis ?? []).length).toBe(
      4
    )
    expect((applyRefine(line, { kind: 'removeLast' }).xAxis ?? []).length).toBe(2)
  })
})

describe('describeRefine：生成中文描述', () => {
  it('各类操作的文案', () => {
    expect(describeRefine({ kind: 'setTitle', title: '新标题' })).toBe('修改标题为「新标题」')
    expect(describeRefine({ kind: 'changeType', type: 'pie' })).toBe('切换为饼图')
    expect(describeRefine({ kind: 'appendPoint' })).toBe('追加一个数据点')
    expect(describeRefine({ kind: 'removeLast' })).toBe('删除最后一个数据点')
  })
})
