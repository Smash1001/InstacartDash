import { describe, expect, it } from 'vitest'
import type { Runner, WeeklyPerformance } from '../types'
import { rankRunners } from './ranking'

const WEEK = '2026-11-16'
const runner = (id: string, name: string, is_active = true): Runner => ({
  id,
  name,
  is_active,
  created_at: '',
})
const perf = (
  runner_id: string,
  ips_7d: number,
  ips_30d: number | null = null,
  week_start = WEEK,
): WeeklyPerformance => ({
  id: `${runner_id}-${week_start}`,
  runner_id,
  week_start,
  ips_7d,
  ips_30d,
  updated_at: '',
  updated_by: null,
})

describe('rankRunners', () => {
  it('sorts ascending by 7-day IPS — lower ranks first', () => {
    const out = rankRunners(
      [runner('a', 'Ann'), runner('b', 'Bob'), runner('c', 'Cal')],
      [perf('a', 50, 40), perf('b', 35, 60), perf('c', 40)],
      WEEK,
    )
    expect(out.map((r) => [r.name, r.rank, r.ips30d])).toEqual([
      ['Bob', 1, 60],
      ['Cal', 2, null],
      ['Ann', 3, 40],
    ])
  })

  it('ranks by 7-day only, ignoring 30-day', () => {
    const out = rankRunners(
      [runner('a', 'A'), runner('b', 'B')],
      [perf('a', 30, 99), perf('b', 31, 1)],
      WEEK,
    )
    expect(out.map((r) => r.name)).toEqual(['A', 'B'])
  })

  it('gives ties the same rank, orders them by name, and skips the next rank', () => {
    const out = rankRunners(
      [runner('a', 'Zoe'), runner('b', 'amy'), runner('c', 'Max'), runner('d', 'Lee')],
      [perf('a', 42), perf('b', 42), perf('c', 30), perf('d', 50)],
      WEEK,
    )
    expect(out.map((r) => [r.name, r.rank, r.tied])).toEqual([
      ['Max', 1, false],
      ['amy', 2, true],
      ['Zoe', 2, true],
      ['Lee', 4, false],
    ])
  })

  it('excludes runners with no measurement and inactive runners', () => {
    const out = rankRunners(
      [runner('a', 'Active'), runner('b', 'NoTime'), runner('c', 'Gone', false)],
      [perf('a', 40), perf('c', 10)],
      WEEK,
    )
    expect(out.map((r) => r.name)).toEqual(['Active'])
  })

  it('ignores other weeks — no carry-over', () => {
    const out = rankRunners([runner('a', 'A')], [perf('a', 40, null, '2026-11-09')], WEEK)
    expect(out).toEqual([])
  })
})
