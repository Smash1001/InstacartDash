-- =====================================================================
-- 001_schema.sql — tables, constraints, audit triggers, Realtime.
-- Run in Supabase: SQL Editor → New query → paste → Run.
-- Then run 002_security.sql. Safe to re-run.
-- =====================================================================

-- ---------- Tables ----------------------------------------------------

create table if not exists public.runners (
    id          uuid primary key default gen_random_uuid(),
    name        text not null
                check (char_length(btrim(name)) between 1 and 60),
    is_active   boolean not null default true,
    created_at  timestamptz not null default now()
);

create table if not exists public.weekly_performance (
    id                    uuid primary key default gen_random_uuid(),
    -- RESTRICT: runners are soft-deactivated, never deleted, so history stays.
    runner_id             uuid not null references public.runners(id) on delete restrict,
    week_start            date not null,
    avg_seconds_per_item  numeric(8,2) not null,
    updated_at            timestamptz not null default now(),
    updated_by            uuid references auth.users(id) on delete set null,

    constraint positive_average   check (avg_seconds_per_item > 0),
    constraint monday_start       check (extract(isodow from week_start) = 1),
    constraint unique_runner_week unique (runner_id, week_start)
);

create table if not exists public.dashboard_settings (
    id                  integer primary key check (id = 1),
    announcement        text not null default ''
                        check (char_length(announcement) <= 280),
    display_week_start  date not null,
    updated_at          timestamptz not null default now(),
    updated_by          uuid references auth.users(id) on delete set null,

    constraint monday_display_week check (extract(isodow from display_week_start) = 1)
);

create table if not exists public.admin_profiles (
    id          uuid primary key references auth.users(id) on delete cascade,
    -- Least privilege by default; promote to 'admin' explicitly.
    role        text not null default 'viewer' check (role in ('admin', 'viewer')),
    created_at  timestamptz not null default now()
);

create index if not exists idx_weekly_performance_week
    on public.weekly_performance (week_start, avg_seconds_per_item);

-- ---------- Audit fields ----------------------------------------------
-- updated_at / updated_by are set by the database, so clients can't spoof
-- them and an upsert's ON CONFLICT UPDATE refreshes them automatically.

create or replace function public.set_audit_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at := now();
    new.updated_by := auth.uid();
    return new;
end;
$$;

drop trigger if exists weekly_performance_audit on public.weekly_performance;
create trigger weekly_performance_audit
    before insert or update on public.weekly_performance
    for each row execute function public.set_audit_fields();

drop trigger if exists dashboard_settings_audit on public.dashboard_settings;
create trigger dashboard_settings_audit
    before insert or update on public.dashboard_settings
    for each row execute function public.set_audit_fields();

-- ---------- Singleton settings row ------------------------------------
-- date_trunc('week', ...) returns the Monday of the current week.
-- Admins change the displayed week from the admin panel afterwards.

insert into public.dashboard_settings (id, announcement, display_week_start)
values (1, '', date_trunc('week', current_date)::date)
on conflict (id) do nothing;

-- ---------- Realtime --------------------------------------------------

do $$
declare
    t text;
begin
    foreach t in array array['runners', 'weekly_performance', 'dashboard_settings'] loop
        if not exists (
            select 1 from pg_publication_tables
            where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
        ) then
            execute format('alter publication supabase_realtime add table public.%I', t);
        end if;
    end loop;
end;
$$;
