import { formatTimestamp } from '../lib/format'

export function AnnouncementBanner({
  text,
  lastUpdated,
}: {
  text: string
  lastUpdated?: string | null
}) {
  const long = text.length > 140
  return (
    <footer className="flex shrink-0 items-center gap-[1.5vw] border-t border-ink/15 px-[3vw] py-[2vh] text-ink">
      <span className="shrink-0 text-[clamp(1.25rem,2vw,2.5rem)]" aria-hidden>
        📣
      </span>
      <p
        className={`min-w-0 flex-1 font-bold leading-snug line-clamp-2 ${
          long ? 'text-[clamp(1rem,1.6vw,2rem)]' : 'text-[clamp(1.15rem,2vw,2.5rem)]'
        } ${text ? '' : 'text-slate-500'}`}
      >
        {text || 'No announcement right now.'}
      </p>
      {lastUpdated !== undefined && (
        <p className="shrink-0 text-right text-[clamp(0.7rem,0.85vw,1.05rem)] font-medium leading-tight text-slate-600">
          Last updated
          <br />
          <span className="font-semibold text-slate-700">{formatTimestamp(lastUpdated)}</span>
        </p>
      )}
    </footer>
  )
}
