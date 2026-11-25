import { addWeeks, formatWeekRange, getWeekStart, parseISODate } from '../../lib/week'
import { inputClass } from '../../lib/ui'
import { Button } from '../ui'

export function WeekBar({
  week,
  onChangeWeek,
  displayWeek,
  onShowOnTv,
}: {
  week: string
  onChangeWeek: (week: string) => void
  displayWeek: string | null
  onShowOnTv: () => void
}) {
  const isCurrentWeek = week === getWeekStart()
  const isOnTv = displayWeek === week

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-xl bg-board-light p-4 shadow-sm ring-1 ring-ink/10">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => onChangeWeek(addWeeks(week, -1))} aria-label="Previous week">
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
          onChange={(e) => e.target.value && onChangeWeek(getWeekStart(parseISODate(e.target.value)))}
        />
        <Button onClick={() => onChangeWeek(addWeeks(week, 1))} aria-label="Next week">
          →
        </Button>
        {!isCurrentWeek && (
          <Button variant="ghost" onClick={() => onChangeWeek(getWeekStart())}>
            Go to current week
          </Button>
        )}
        {isCurrentWeek && <span className="ml-1 text-sm font-medium text-slate-500">(Current week)</span>}
      </div>

      <div className="flex items-center gap-3">
        {displayWeek && !isOnTv && (
          <span className="text-xs text-slate-500">TV shows week of {formatWeekRange(displayWeek)}</span>
        )}
        {isOnTv ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            ● Showing on TV
          </span>
        ) : (
          <Button onClick={onShowOnTv} disabled={!displayWeek}>
            Show this week on TV
          </Button>
        )}
      </div>
    </div>
  )
}
