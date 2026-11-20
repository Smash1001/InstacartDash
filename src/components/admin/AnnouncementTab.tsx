import { useEffect, useState } from 'react'
import type { DashboardSettings } from '../../types'
import { formatTimestamp } from '../../lib/format'
import {
  MAX_ANNOUNCEMENT_LENGTH,
  getDashboardSettings,
  saveAnnouncement,
} from '../../services/announcementService'
import { AnnouncementBanner } from '../AnnouncementBanner'
import { errorMessage, inputClass } from '../../lib/ui'
import { Button, Card, Notice, type NoticeState } from '../ui'

export function AnnouncementTab() {
  const [settings, setSettings] = useState<DashboardSettings | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<NoticeState>(null)

  useEffect(() => {
    getDashboardSettings()
      .then((s) => {
        setSettings(s)
        setDraft(s.announcement)
      })
      .catch((e) => setNotice({ kind: 'error', text: `Could not load: ${errorMessage(e)}` }))
  }, [])

  const tooLong = draft.trim().length > MAX_ANNOUNCEMENT_LENGTH
  const changed = settings !== null && draft.trim() !== settings.announcement

  async function publish() {
    setSaving(true)
    setNotice(null)
    try {
      const s = await saveAnnouncement(draft)
      setSettings(s)
      setDraft(s.announcement)
      setNotice({ kind: 'success', text: 'Published — the TV banner will update automatically.' })
    } catch (e) {
      setNotice({ kind: 'error', text: errorMessage(e) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <label htmlFor="announcement" className="text-sm font-semibold text-slate-700">
          Announcement
        </label>
        <textarea
          id="announcement"
          rows={3}
          className={`${inputClass} mt-2 w-full resize-y`}
          placeholder="e.g. Great work this week, team!"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={!settings}
        />
        <div className="mt-1 flex justify-between text-xs">
          <span className="text-slate-500">
            Last published: {formatTimestamp(settings?.updated_at)}
          </span>
          <span className={tooLong ? 'font-semibold text-rose-600' : 'text-slate-500'}>
            {draft.trim().length}/{MAX_ANNOUNCEMENT_LENGTH}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Notice notice={notice} />
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              disabled={!changed || saving}
              onClick={() => setDraft(settings?.announcement ?? '')}
            >
              Revert
            </Button>
            <Button variant="primary" disabled={!changed || tooLong || saving} onClick={publish}>
              {saving ? 'Publishing…' : 'Publish'}
            </Button>
          </div>
        </div>
      </Card>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">TV preview</p>
        <div className="overflow-hidden rounded-xl ring-1 ring-slate-300">
          <AnnouncementBanner text={draft.trim()} />
        </div>
      </div>
    </div>
  )
}
