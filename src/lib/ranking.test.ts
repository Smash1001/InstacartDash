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
const perf = (runner_id: string, avg: number, week_start = WEEK): WeeklyPerformance => ({
  id: `${runner_id}-${week_start}`,
  runner_id,
  week_start,
  avg_seconds_per_item: avg,
  updated_at: '',
  updated_by: null,
})

describe('rankRunners', () => {
  it('sorts ascending — lower average ranks first', () => {
    const out = rankRunners(
      [runner('a', 'Ann'), runner('b', 'Bob'), runner('c', 'Cal')],
      [perf('a', 5), perf('b', 3.5), perf('c', 4)],
      WEEK,
    )
    expect(out.map((r) => [r.name, r.rank])).toEqual([
      ['Bob', 1],
      ['Cal', 2],
      ['Ann', 3],
    ])
  })

  it('gives ties the same rank, orders them by name, and skips the next rank', () => {
    const out = rankRunners(
      [runner('a', 'Zoe'), runner('b', 'amy'), runner('c', 'Max'), runner('d', 'Lee')],
      [perf('a', 4.25), perf('b', 4.25), perf('c', 3), perf('d', 5)],
      WEEK,
    )
    expect(out.map((r) => [r.name, r.rank, r.tied])).toEqual([
      ['Max', 1, false],
      ['amy', 2, true],
      ['Zoe', 2, true],
      ['Lee', 4, false],
    ])
  })

  it('treats 4.1 and 4.10 (and float noise) as equal', () => {
    const out = rankRunners(
      [runner('a', 'A'), runner('b', 'B')],
      [perf('a', 4.1), perf('b', 4.1000000001)],
      WEEK,
    )
    expect(out.map((r) => r.rank)).toEqual([1, 1])
  })

  it('excludes runners with no measurement and inactive runners', () => {
    const out = rankRunners(
      [runner('a', 'Active'), runner('b', 'NoTime'), runner('c', 'Gone', false)],
      [perf('a', 4), perf('c', 1)],
      WEEK,
    )
    expect(out.map((r) => r.name)).toEqual(['Active'])
  })

  it('ignores other weeks — no carry-over', () => {
    const out = rankRunners([runner('a', 'A')], [perf('a', 4, '2026-11-09')], WEEK)
    expect(out).toEqual([])
  })
})
