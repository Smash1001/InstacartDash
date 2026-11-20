import { useCallback, useEffect, useState } from 'react'
import type { Runner } from '../../types'
import { errorMessage, inputClass } from '../../lib/ui'
import {
  createRunner,
  listRunners,
  renameRunner,
  setRunnerActive,
} from '../../services/runnerService'
import { Button, Card, Notice, type NoticeState } from '../ui'

export function RunnersTab() {
  const [runners, setRunners] = useState<Runner[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<NoticeState>(null)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setRunners(await listRunners())
    } catch (e) {
      setNotice({ kind: 'error', text: `Could not load runners: ${errorMessage(e)}` })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function run(action: () => Promise<unknown>, success: string, id: string | null = null) {
    setNotice(null)
    setBusyId(id)
    try {
      await action()
      setNotice({ kind: 'success', text: success })
      await load()
      return true
    } catch (e) {
      setNotice({ kind: 'error', text: errorMessage(e) })
      return false
    } finally {
      setBusyId(null)
    }
  }

  async function add() {
    setAdding(true)
    const name = newName.trim()
    if (await run(() => createRunner(newName), `Added ${name}.`)) setNewName('')
    setAdding(false)
  }

  async function saveRename(r: Runner) {
    if (editName.trim() === r.name) return setEditingId(null)
    if (await run(() => renameRunner(r.id, editName), `Renamed to ${editName.trim()}.`, r.id)) {
      setEditingId(null)
    }
  }

  function toggleActive(r: Runner) {
    if (
      r.is_active &&
      !confirm(`Deactivate ${r.name}? They'll be hidden from the leaderboard. Their past times are kept.`)
    ) {
      return
    }
    run(
      () => setRunnerActive(r.id, !r.is_active),
      r.is_active ? `${r.name} deactivated.` : `${r.name} reactivated.`,
      r.id,
    )
  }

  const active = runners.filter((r) => r.is_active)
  const inactive = runners.filter((r) => !r.is_active)

  const renderRow = (r: Runner) => (
    <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
      {editingId === r.id ? (
        <form
          className="flex flex-1 flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            saveRename(r)
          }}
        >
          <input
            autoFocus
            aria-label="Runner name"
            className={`${inputClass} min-w-48 flex-1`}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setEditingId(null)}
          />
          <Button type="submit" variant="primary" disabled={busyId === r.id}>
            Save
          </Button>
          <Button variant="ghost" onClick={() => setEditingId(null)}>
            Cancel
          </Button>
        </form>
      ) : (
        <>
          <span className={`flex-1 font-medium ${r.is_active ? 'text-slate-900' : 'text-slate-500'}`}>
            {r.name}
          </span>
          <Button
            variant="ghost"
            onClick={() => {
              setEditingId(r.id)
              setEditName(r.name)
            }}
          >
            Rename
          </Button>
          <Button
            variant={r.is_active ? 'danger' : 'secondary'}
            disabled={busyId === r.id}
            onClick={() => toggleActive(r)}
          >
            {r.is_active ? 'Deactivate' : 'Reactivate'}
          </Button>
        </>
      )}
    </li>
  )

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            add()
          }}
        >
          <label htmlFor="new-runner" className="sr-only">
            New runner name
          </label>
          <input
            id="new-runner"
            placeholder="New runner’s name"
            className={`${inputClass} min-w-48 flex-1`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button type="submit" variant="primary" disabled={adding || !newName.trim()}>
            Add runner
          </Button>
        </form>
        <div className="mt-3">
          <Notice notice={notice} />
        </div>
      </Card>

      <Card>
        <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
          Active runners ({active.length})
        </h2>
        {loading ? (
          <p className="p-4 text-sm text-slate-500">Loading…</p>
        ) : active.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No active runners yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">{active.map(renderRow)}</ul>
        )}
      </Card>

      {inactive.length > 0 && (
        <Card>
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
            Deactivated ({inactive.length})
          </h2>
          <ul className="divide-y divide-slate-100">{inactive.map(renderRow)}</ul>
        </Card>
      )}
    </div>
  )
}
