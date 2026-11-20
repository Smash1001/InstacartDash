import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DashboardSettings, Runner, WeeklyPerformance } from '../../types'
import { formatSeconds, formatTimestamp } from '../../lib/format'
import { addWeeks, formatWeekRange, getWeekStart, parseISODate } from '../../lib/week'
import { getDashboardSettings, setDisplayWeek } from '../../services/announcementService'
import {
  clearAverage,
  listPerformanceForWeek,
  parseAverage,
  saveAverage,
} from '../../services/performanceService'
import { listRunners } from '../../services/runnerService'
import { errorMessage, inputClass } from '../../lib/ui'
import { Button, Card, Notice, type NoticeState } from '../ui'

type Drafts = Record<string, string>

const savedText = (p: WeeklyPerformance | undefined) => (p ? formatSeconds(p.avg_seconds_per_item) : '')

export function WeeklyPerformanceTab() {
  const [week, setWeek] = useState(getWeekStart)
  const [runners, setRunners] = useState<Runner[]>([])
  const [records, setRecords] = useState<Map<string, WeeklyPerformance>>(new Map())
  const [settings, setSettings] = useState<DashboardSettings | null>(null)
  const [drafts, setDrafts] = useState<Drafts>({})
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<NoticeState>(null)

  const load = useCallback(async (weekStart: string) => {
    setLoading(true)
    try {
      const [rs, perf, s] = await Promise.all([
        listRunners(),
        listPerformanceForWeek(weekStart),
        getDashboardSettings(),
      ])
      const byRunner = new Map(perf.map((p) => [p.runner_id, p]))
      setRunners(rs)
      setRecords(byRunner)
      setSettings(s)
      setDrafts(Object.fromEntries(rs.map((r) => [r.id, savedText(byRunner.get(r.id))])))
      setRowErrors({})
    } catch (e) {
      setNotice({ kind: 'error', text: `Could not load week: ${errorMessage(e)}` })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(week)
  }, [load, week])

  const activeRunners = useMemo(() => runners.filter((r) => r.is_active), [runners])
  // Deactivated runners keep their history; show it read-only.
  const inactiveWithRecords = useMemo(
    () => runners.filter((r) => !r.is_active && records.has(r.id)),
    [runners, records],
  )
  const isDirty = (id: string) => {
    const raw = (drafts[id] ?? '').trim()
    const saved = savedText(records.get(id))
    // "4.5" and "4.50" are the same value — not a change.
    return raw !== saved && !(raw && saved && Number(raw) === Number(saved))
  }
  const dirtyIds = activeRunners.filter((r) => isDirty(r.id)).map((r) => r.id)
  const measuredCount = activeRunners.filter((r) => records.has(r.id)).length
  const isCurrentWeek = week === getWeekStart()
  const isOnTv = settings?.display_week_start === week

  function changeWeek(next: string) {
    if (next === week) return
    if (dirtyIds.length && !confirm('You have unsaved changes. Discard them?')) return
    setNotice(null)
    setWeek(next)
  }

  async function saveAll() {
    setNotice(null)
    const errors: Record<string, string> = {}
    const toSave: { id: string; avg: number }[] = []
    const toClear: string[] = []

    for (const id of dirtyIds) {
      const raw = (drafts[id] ?? '').trim()
      if (raw === '') {
        toClear.push(id)
        continue
      }
      try {
        toSave.push({ id, avg: parseAverage(raw) })
      } catch (e) {
        errors[id] = errorMessage(e)
      }
    }
    setRowErrors(errors)
    if (Object.keys(errors).length) {
      setNotice({ kind: 'error', text: 'Fix the highlighted values before saving.' })
      return
    }
    if (
      toClear.length &&
      !confirm(`Remove ${toClear.length} saved time${toClear.length > 1 ? 's' : ''} for this week?`)
    ) {
      return
    }

    setSaving(true)
    const results = await Promise.allSettled([
      ...toSave.map((s) => saveAverage(s.id, week, s.avg)),
      ...toClear.map((id) => clearAverage(id, week)),
    ])
    setSaving(false)

    const failures = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[]
    await load(week)
    setNotice(
      failures.length
        ? {
            kind: 'error',
            text: `${failures.length} change(s) failed to save: ${errorMessage(failures[0].reason)}`,
          }
        : { kind: 'success', text: `Saved ${results.length} change${results.length === 1 ? '' : 's'}.` },
    )
  }

  async function showOnTv() {
    try {
      setSettings(await setDisplayWeek(week))
      setNotice({ kind: 'success', text: `The TV now shows the week of ${formatWeekRange(week)}.` })
    } catch (e) {
      setNotice({ kind: 'error', text: errorMessage(e) })
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => changeWeek(addWeeks(week, -1))} aria-label="Previous week">
              ←
            </Button>
            <label className="sr-only" htmlFor="week-picker">
              Week
            </label>
            <input
              id="week-picker"
              type="date"
              className={inputClass}
              value={week}
              onChange={(e) => e.target.value && changeWeek(getWeekStart(parseISODate(e.target.value)))}
            />
            <Button onClick={() => changeWeek(addWeeks(week, 1))} aria-label="Next week">
              →
            </Button>
            {!isCurrentWeek && (
              <Button variant="ghost" onClick={() => changeWeek(getWeekStart())}>
                This week
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isOnTv ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                ● Showing on TV
              </span>
            ) : (
              <Button onClick={showOnTv} disabled={!settings}>
                Show this week on TV
              </Button>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-bold text-slate-900">
            Week of {formatWeekRange(week)}
            {isCurrentWeek && <span className="ml-2 text-sm font-medium text-slate-500">(this week)</span>}
          </h2>
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">
              {measuredCount} of {activeRunners.length}
            </span>{' '}
            runners updated
          </p>
        </div>
        {settings && !isOnTv && (
          <p className="mt-1 text-xs text-slate-500">
            TV is currently showing the week of {formatWeekRange(settings.display_week_start)}.
          </p>
        )}
      </Card>

      <Card>
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : activeRunners.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No active runners. Add runners in the Runners tab.</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              saveAll()
            }}
          >
            <ul className="divide-y divide-slate-100">
              {activeRunners.map((r) => {
                const rec = records.get(r.id)
                const err = rowErrors[r.id]
                const dirty = dirtyIds.includes(r.id)
                return (
                  <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                    <div className="min-w-40 flex-1">
                      <p className="font-medium text-slate-900">{r.name}</p>
                      <p className="text-xs text-slate-500">
                        {rec ? `Saved ${formatTimestamp(rec.updated_at)}` : 'Not entered'}
                        {dirty && <span className="ml-1 font-semibold text-amber-600">• unsaved</span>}
                      </p>
                    </div>
                    <div className="w-44">
                      <div className="relative">
                        <input
                          aria-label={`Average seconds per item for ${r.name}`}
                          aria-invalid={!!err}
                          inputMode="decimal"
                          placeholder="—"
                          className={`${inputClass} w-full pr-20 text-right tabular-nums ${err ? 'ring-rose-400' : ''}`}
                          value={drafts[r.id] ?? ''}
                          onChange={(e) => {
                            const value = e.target.value
                            setDrafts((d) => ({ ...d, [r.id]: value }))
                            if (err) setRowErrors((errs) => ({ ...errs, [r.id]: '' }))
                          }}
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">
                          sec/item
                        </span>
                      </div>
                      {err && <p className="mt-1 text-xs text-rose-600">{err}</p>}
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t border-slate-200 bg-white/95 p-4 backdrop-blur">
              <div className="min-w-0 flex-1">
                <Notice notice={notice} />
                {!notice && (
                  <p className="text-xs text-slate-500">
                    Enter the weekly average (positive, up to 2 decimals). Clear a box to remove a time.
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  disabled={!dirtyIds.length || saving}
                  onClick={() => load(week)}
                >
                  Discard
                </Button>
                <Button type="submit" variant="primary" disabled={!dirtyIds.length || saving}>
                  {saving ? 'Saving…' : `Save ${dirtyIds.length || ''} change${dirtyIds.length === 1 ? '' : 's'}`}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Card>

      {inactiveWithRecords.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-slate-700">Deactivated runners with times this week</h3>
          <p className="text-xs text-slate-500">Kept for history; not shown on the TV.</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {inactiveWithRecords.map((r) => (
              <li key={r.id} className="flex justify-between">
                <span>{r.name}</span>
                <span className="tabular-nums">{savedText(records.get(r.id))} sec/item</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
