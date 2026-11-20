# Instacart Runner Leaderboard

A TV dashboard that ranks Instacart runners by weekly average seconds per item
(lower is better), plus an admin panel for entering times, managing runners,
and publishing a store announcement.

Stack: React + TypeScript (Vite), Tailwind CSS, Supabase (Postgres, Auth,
Realtime), deployed on Vercel.

## Routes

| Route        | Purpose                                              |
| ------------ | ---------------------------------------------------- |
| `/dashboard` | Full-screen, read-only TV leaderboard + announcement |
| `/admin`     | Weekly times, runner management, announcement        |

## Development

```bash
npm install
npm run dev      # http://localhost:5173/dashboard and /admin
npm test         # unit tests (ranking + week logic)
npm run build    # type-check + production build
```

## Project layout

```
src/
├── components/        TV components (Leaderboard, RunnerRow, AnnouncementBanner),
│   └── admin/         admin tabs (WeeklyPerformance, Runners, Announcement)
├── pages/             Dashboard, AdminPanel
├── services/          data access — the only code that talks to the backend
├── hooks/             useLeaderboard (fetch + live updates + reconnect)
├── lib/               week math, ranking, formatting (pure, unit-tested)
└── types/
```

## Status

- [x] Phase 1 — TV dashboard prototype (sample data)
- [x] Phase 2 — Admin interface with validation
- [ ] Phase 3 — Supabase integration
- [ ] Phase 4 — Auth + Row Level Security
- [ ] Phase 5 — Realtime + Vercel deployment

> Until Phase 3, data is sample data stored in the browser's localStorage
> (admin and TV tabs in the same browser stay in sync).
