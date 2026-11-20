-- =====================================================================
-- 002_security.sql — role helpers + Row Level Security.
-- Run after 001_schema.sql. Safe to re-run.
--
-- Policy intent:
--   * Signed-in users with a profile (admin or viewer) can read dashboard data.
--   * Only admins can write runners, performance, and settings.
--   * Users can read only their own profile and can never change roles
--     (no write policies on admin_profiles — provision via SQL Editor).
--   * Anonymous (not signed in) users get nothing.
-- =====================================================================

-- ---------- Role helpers ----------------------------------------------
-- SECURITY DEFINER so they can read admin_profiles regardless of its RLS
-- (avoids policy recursion). Empty search_path + fully-qualified names.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1 from public.admin_profiles
        where id = auth.uid() and role = 'admin'
    );
$$;

create or replace function public.has_dashboard_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1 from public.admin_profiles
        where id = auth.uid() and role in ('admin', 'viewer')
    );
$$;

revoke all on function public.is_admin() from public, anon;
revoke all on function public.has_dashboard_access() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.has_dashboard_access() to authenticated;

revoke all on function public.set_audit_fields() from public, anon, authenticated;

-- ---------- Lock out anonymous access entirely ------------------------

revoke all on public.runners, public.weekly_performance,
             public.dashboard_settings, public.admin_profiles from anon;

-- ---------- Enable RLS ------------------------------------------------

alter table public.runners            enable row level security;
alter table public.weekly_performance enable row level security;
alter table public.dashboard_settings enable row level security;
alter table public.admin_profiles     enable row level security;

-- ---------- runners ---------------------------------------------------
-- No DELETE policy: runners are deactivated, never deleted.

drop policy if exists "runners: dashboard users read" on public.runners;
create policy "runners: dashboard users read" on public.runners
    for select to authenticated
    using ((select public.has_dashboard_access()));

drop policy if exists "runners: admins insert" on public.runners;
create policy "runners: admins insert" on public.runners
    for insert to authenticated
    with check ((select public.is_admin()));

drop policy if exists "runners: admins update" on public.runners;
create policy "runners: admins update" on public.runners
    for update to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

-- ---------- weekly_performance ----------------------------------------

drop policy if exists "performance: dashboard users read" on public.weekly_performance;
create policy "performance: dashboard users read" on public.weekly_performance
    for select to authenticated
    using ((select public.has_dashboard_access()));

drop policy if exists "performance: admins insert" on public.weekly_performance;
create policy "performance: admins insert" on public.weekly_performance
    for insert to authenticated
    with check ((select public.is_admin()));

drop policy if exists "performance: admins update" on public.weekly_performance;
create policy "performance: admins update" on public.weekly_performance
    for update to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

drop policy if exists "performance: admins delete" on public.weekly_performance;
create policy "performance: admins delete" on public.weekly_performance
    for delete to authenticated
    using ((select public.is_admin()));

-- ---------- dashboard_settings ----------------------------------------
-- Singleton row is seeded by 001; only UPDATE is allowed.

drop policy if exists "settings: dashboard users read" on public.dashboard_settings;
create policy "settings: dashboard users read" on public.dashboard_settings
    for select to authenticated
    using ((select public.has_dashboard_access()));

drop policy if exists "settings: admins update" on public.dashboard_settings;
create policy "settings: admins update" on public.dashboard_settings
    for update to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

-- ---------- admin_profiles --------------------------------------------
-- Read own profile only. No insert/update/delete policies = no self-promotion.

drop policy if exists "profiles: read own" on public.admin_profiles;
create policy "profiles: read own" on public.admin_profiles
    for select to authenticated
    using (id = (select auth.uid()));
