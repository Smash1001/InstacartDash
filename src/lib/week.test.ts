import { describe, expect, it } from 'vitest'
import { addWeeks, formatWeekRange, getWeekStart, isMonday } from './week'

describe('week helpers', () => {
  it('finds the Monday on or before a date', () => {
    expect(getWeekStart(new Date(2026, 10, 16))).toBe('2026-11-16') // Monday
    expect(getWeekStart(new Date(2026, 10, 20))).toBe('2026-11-16') // Friday
    expect(getWeekStart(new Date(2026, 10, 22))).toBe('2026-11-16') // Sunday
    expect(getWeekStart(new Date(2026, 0, 1))).toBe('2025-12-29') // crosses year
  })

  it('adds weeks across month boundaries', () => {
    expect(addWeeks('2026-11-30', 1)).toBe('2026-12-07')
    expect(addWeeks('2026-11-16', -1)).toBe('2026-11-09')
  })

  it('validates Mondays', () => {
    expect(isMonday('2026-11-16')).toBe(true)
    expect(isMonday('2026-11-17')).toBe(false)
    expect(isMonday('2026-02-30')).toBe(false)
    expect(isMonday('nope')).toBe(false)
  })

  it('formats a week range', () => {
    // ICU may use thin spaces around the dash; normalize whitespace.
    expect(formatWeekRange('2026-11-16').replace(/\s/g, ' ')).toBe('Nov 16 – 22, 2026')
    expect(formatWeekRange('2026-11-30').replace(/\s/g, ' ')).toBe('Nov 30 – Dec 6, 2026')
  })
})
