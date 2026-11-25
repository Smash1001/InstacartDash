export function AnnouncementBanner({ text }: { text: string }) {
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
    </footer>
  )
}
