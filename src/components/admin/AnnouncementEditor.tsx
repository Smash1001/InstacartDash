import { inputClass } from '../../lib/ui'
import { MAX_ANNOUNCEMENT_LENGTH } from '../../services/announcementService'

export function AnnouncementEditor({
  value,
  onChange,
  error,
  dirty,
}: {
  value: string
  onChange: (v: string) => void
  error?: string
  dirty: boolean
}) {
  const length = value.trim().length
  const tooLong = length > MAX_ANNOUNCEMENT_LENGTH

  return (
    <section className={`rounded-xl bg-board-light p-4 shadow-sm ring-1 ${dirty ? 'ring-amber-400' : 'ring-ink/10'}`}>
      <label htmlFor="announcement" className="font-semibold text-slate-900">
        Announcement
      </label>
      <textarea
        id="announcement"
        rows={4}
        className={`${inputClass} mt-2 w-full resize-y ${error ? 'ring-2 ring-rose-400' : ''}`}
        placeholder="e.g. Great work this week, team!"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="mt-1 flex justify-end text-xs">
        <span className={tooLong ? 'font-semibold text-rose-600' : 'text-slate-500'}>
          {length}/{MAX_ANNOUNCEMENT_LENGTH}
        </span>
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </section>
  )
}
