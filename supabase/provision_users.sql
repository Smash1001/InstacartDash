-- =====================================================================
-- Assign roles. Run in the SQL Editor (it runs with full privileges,
-- which is the "trusted administrative process" — the app cannot do this).
--
-- 1. Create each user first: Authentication → Users → Add user →
--    "Create new user" (tick "Auto Confirm User").
-- 2. Replace the emails below and run.
-- =====================================================================

-- Admins (can edit everything)
insert into public.admin_profiles (id, role)
select id, 'admin' from auth.users
where email in ('admin@example.com')
on conflict (id) do update set role = excluded.role;

-- TV viewer account (read-only)
insert into public.admin_profiles (id, role)
select id, 'viewer' from auth.users
where email in ('tv@example.com')
on conflict (id) do update set role = excluded.role;

-- Check the result:
select u.email, p.role
from public.admin_profiles p
join auth.users u on u.id = p.id
order by p.role, u.email;
