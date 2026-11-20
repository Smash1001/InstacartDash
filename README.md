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
| `/login`     | Sign in (admins and the TV viewer account)           |

## Supabase setup (one time)

1. **SQL Editor** → run [`supabase/migrations/001_schema.sql`](supabase/migrations/001_schema.sql),
   then [`002_security.sql`](supabase/migrations/002_security.sql).
2. **Authentication → Sign In / Providers**: turn off "Allow new users to sign up"
   (accounts are created by an admin only).
3. **Authentication → Users → Add user** for each admin and for the TV
   (e.g. `tv@yourstore`), with "Auto Confirm User" ticked.
4. **SQL Editor** → edit the emails in
   [`supabase/provision_users.sql`](supabase/provision_users.sql) and run it.
   New accounts have no access until they're given a role here.

Security model: Row Level Security on every table. Signed-in `viewer`s and
`admin`s can read; only `admin`s can write; nobody can change their own role;
anonymous visitors get nothing. The app only uses the publishable key.

## Development

Copy `.env.example` to `.env.local` and fill in your Supabase URL and
publishable key, then:

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
- [x] Phase 3 — Supabase integration (schema, services, upserts)
- [x] Phase 4 — Auth + Row Level Security (code + SQL; accounts provisioned in Supabase)
- [ ] Phase 5 — Realtime verification + Vercel deployment
