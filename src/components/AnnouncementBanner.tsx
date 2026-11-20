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
    <footer className="flex shrink-0 items-center gap-[2vw] bg-emerald-500 px-[3vw] py-[2.2vh] text-emerald-950">
      <span
        className="grid size-[clamp(2.5rem,3.6vw,4.5rem)] shrink-0 place-items-center rounded-full bg-emerald-950/15 text-[clamp(1.25rem,1.9vw,2.4rem)]"
        aria-hidden
      >
        📣
      </span>
      <p
        className={`min-w-0 flex-1 font-bold leading-snug line-clamp-2 ${
          long ? 'text-[clamp(1rem,1.6vw,2rem)]' : 'text-[clamp(1.15rem,2.1vw,2.6rem)]'
        } ${text ? '' : 'opacity-50'}`}
      >
        {text || 'No announcement right now.'}
      </p>
      {lastUpdated !== undefined && (
        <p className="shrink-0 text-right text-[clamp(0.7rem,0.85vw,1.05rem)] font-medium leading-tight text-emerald-950/70">
          Last updated
          <br />
          <span className="font-semibold">{formatTimestamp(lastUpdated)}</span>
        </p>
      )}
    </footer>
  )
}
