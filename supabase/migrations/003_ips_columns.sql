-- =====================================================================
-- 003_ips_columns.sql — replace avg_seconds_per_item with two manually
-- entered whole-number IPS values per runner per week:
--   ips_7d   IPS over the last 7 days  (required; used for ranking, lower = better)
--   ips_30d  IPS over the last 30 days (optional)
-- Run after 001 and 002. Safe to re-run.
-- =====================================================================

alter table public.weekly_performance
    add column if not exists ips_7d  integer,
    add column if not exists ips_30d integer;

-- Carry over any existing averages (rounded) into the 7-day column.
do $$
begin
    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'weekly_performance'
          and column_name = 'avg_seconds_per_item'
    ) then
        update public.weekly_performance
        set ips_7d = greatest(1, round(avg_seconds_per_item)::integer)
        where ips_7d is null;
    end if;
end;
$$;

alter table public.weekly_performance
    alter column ips_7d set not null;

alter table public.weekly_performance
    drop constraint if exists ips_7d_positive,
    drop constraint if exists ips_30d_positive;

alter table public.weekly_performance
    add constraint ips_7d_positive  check (ips_7d > 0),
    add constraint ips_30d_positive check (ips_30d is null or ips_30d > 0);

drop index if exists public.idx_weekly_performance_week;
alter table public.weekly_performance
    drop column if exists avg_seconds_per_item;

create index if not exists idx_weekly_performance_week_ips
    on public.weekly_performance (week_start, ips_7d);
