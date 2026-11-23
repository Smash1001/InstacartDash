import type { ReactNode } from 'react'
import type { Runner, WeeklyPerformance } from '../../types'
import { formatIps } from '../../lib/format'
import { inputClass } from '../../lib/ui'
import {
  fieldKey,
  type FieldErrors,
  type NewRunnerDraft,
  type RunnerDraft,
} from '../../hooks/useAdminEditor'
import { Button } from '../ui'

const GRID = 'grid grid-cols-[minmax(0,1fr)_7rem_7rem_7.5rem] items-start gap-3'

function Field({
  label,
  value,
  onChange,
  error,
  disabled,
  placeholder,
  numeric,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  disabled?: boolean
  placeholder?: string
  numeric?: boolean
}) {
  return (
    <div>
      <input
        aria-label={label}
        aria-invalid={!!error}
        inputMode={numeric ? 'numeric' : undefined}
        placeholder={placeholder}
        disabled={disabled}
        className={`${inputClass} w-full disabled:bg-slate-50 disabled:text-slate-400 ${
          numeric ? 'text-right tabular-nums' : 'font-medium'
        } ${error ? 'ring-2 ring-rose-400' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  )
}

function Row({ children, tone }: { children: ReactNode; tone?: 'dirty' | 'muted' | 'new' }) {
  const bg =
    tone === 'new'
      ? 'bg-emerald-50/60'
      : tone === 'dirty'
        ? 'bg-amber-50/60'
        : tone === 'muted'
          ? 'bg-board-dark/60'
          : ''
  return <li className={`${GRID} px-4 py-2.5 ${bg}`}>{children}</li>
}

export function RunnerEditor({
  runners,
  records,
  drafts,
  newRows,
  errors,
  isRunnerDirty,
  onDraft,
  onAddRow,
  onUpdateNewRow,
  onRemoveNewRow,
}: {
  runners: Runner[]
  records: Map<string, WeeklyPerformance>
  drafts: Record<string, RunnerDraft>
  newRows: NewRunnerDraft[]
  errors: FieldErrors
  isRunnerDirty: (id: string) => boolean
  onDraft: (id: string, patch: Partial<RunnerDraft>) => void
  onAddRow: () => void
  onUpdateNewRow: (key: string, patch: Partial<NewRunnerDraft>) => void
  onRemoveNewRow: (key: string) => void
}) {
  // Main list: currently active runners plus any staged for reactivation.
  const main = runners.filter((r) => r.is_active || drafts[r.id]?.isActive)
  const inactive = runners.filter((r) => !r.is_active && !drafts[r.id]?.isActive)

  return (
    <section className="rounded-xl bg-board-light shadow-sm ring-1 ring-ink/10">
      <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
        <h2 className="font-semibold text-slate-900">Runners &amp; IPS</h2>
        <p className="text-xs text-slate-500">Whole numbers · lower is better · ranked by 7-day</p>
      </div>

      <div
        className={`${GRID} border-b border-ink/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500`}
      >
        <span>Runner</span>
        <span className="text-right">IPS · 7 days</span>
        <span className="text-right">IPS · 30 days</span>
        <span />
      </div>

      <ul className="divide-y divide-ink/10">
        {main.map((r) => {
          const d = drafts[r.id]
          if (!d) return null
          const deactivating = r.is_active && !d.isActive
          const reactivating = !r.is_active && d.isActive
          return (
            <Row key={r.id} tone={deactivating ? 'muted' : isRunnerDirty(r.id) ? 'dirty' : undefined}>
              <div>
                <Field
                  label={`Name for ${r.name}`}
                  value={d.name}
                  onChange={(name) => onDraft(r.id, { name })}
                  error={errors[fieldKey(r.id, 'name')]}
                  disabled={deactivating}
                />
                <p className="mt-1 text-xs text-slate-500">
                  {deactivating
                    ? 'Will be hidden from the leaderboard (history kept)'
                    : reactivating
                      ? 'Will be reactivated'
                      : records.has(r.id)
                        ? null
                        : 'No IPS entered this week'}
                </p>
              </div>
              <Field
                label={`IPS last 7 days for ${r.name}`}
                numeric
                placeholder="—"
                value={d.ips7}
                onChange={(ips7) => onDraft(r.id, { ips7 })}
                error={errors[fieldKey(r.id, 'ips7')]}
                disabled={deactivating}
              />
              <Field
                label={`IPS last 30 days for ${r.name}`}
                numeric
                placeholder="—"
                value={d.ips30}
                onChange={(ips30) => onDraft(r.id, { ips30 })}
                error={errors[fieldKey(r.id, 'ips30')]}
                disabled={deactivating}
              />
              {deactivating || reactivating ? (
                <Button variant="ghost" onClick={() => onDraft(r.id, { isActive: r.is_active })}>
                  Undo
                </Button>
              ) : (
                <Button variant="danger" onClick={() => onDraft(r.id, { isActive: false })}>
                  Deactivate
                </Button>
              )}
            </Row>
          )
        })}

        {newRows.map((n) => (
          <Row key={n.key} tone="new">
            <div>
              <Field
                label="New runner name"
                placeholder="New runner’s name"
                value={n.name}
                onChange={(name) => onUpdateNewRow(n.key, { name })}
                error={errors[fieldKey(n.key, 'name')]}
              />
              <p className="mt-1 text-xs font-semibold text-emerald-700">New runner</p>
            </div>
            <Field
              label="New runner IPS last 7 days"
              numeric
              placeholder="—"
              value={n.ips7}
              onChange={(ips7) => onUpdateNewRow(n.key, { ips7 })}
              error={errors[fieldKey(n.key, 'ips7')]}
            />
            <Field
              label="New runner IPS last 30 days"
              numeric
              placeholder="—"
              value={n.ips30}
              onChange={(ips30) => onUpdateNewRow(n.key, { ips30 })}
              error={errors[fieldKey(n.key, 'ips30')]}
            />
            <Button variant="ghost" onClick={() => onRemoveNewRow(n.key)}>
              Remove
            </Button>
          </Row>
        ))}
      </ul>

      <div className="border-t border-ink/10 p-3">
        <Button variant="ghost" className="text-emerald-700" onClick={onAddRow}>
          + Add runner
        </Button>
      </div>

      {inactive.length > 0 && (
        <details className="border-t border-ink/10">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-board">
            Deactivated runners ({inactive.length})
          </summary>
          <ul className="divide-y divide-ink/10">
            {inactive.map((r) => (
              <li key={r.id} className={`${GRID} items-center px-4 py-2 text-sm text-slate-500`}>
                <span className="truncate">{r.name}</span>
                <span className="text-right tabular-nums">{formatIps(records.get(r.id)?.ips_7d)}</span>
                <span className="text-right tabular-nums">{formatIps(records.get(r.id)?.ips_30d)}</span>
                <Button onClick={() => onDraft(r.id, { isActive: true })}>Reactivate</Button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
