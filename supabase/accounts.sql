-- AgriCluster: real accounts (phone sign-in) for Supabase.
-- Run once, after turning on Phone sign-in (Authentication → Sign In / Providers → Phone):
-- Supabase dashboard → SQL Editor → New query → paste this file → Run. Safe to run again.
--
-- One table, profiles: who each signed-in person is and which role they have.
--   * Farmers are approved as soon as they join.
--   * Cluster office, buyers, providers, labour, experts and community organisers
--     wait until an admin approves them, so nobody can pose as the cluster office.
--   * Only an admin can approve, reject or change someone's role. The database
--     enforces this (trigger + row-level security), not just the website.
--   * Nobody can make themselves an admin from the website: that is done once,
--     here in the SQL Editor (see the end of this file).

create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  name         text not null check (char_length(btrim(name)) between 2 and 80),
  role         text not null check (role in ('farmer','cluster','buyer','provider','labour','expert','community')),
  status       text not null default 'pending' check (status in ('pending','approved','rejected')),
  is_admin     boolean not null default false,
  phone        text,
  organisation text check (char_length(organisation) <= 120),
  location     text check (char_length(location) <= 120),
  about        text check (char_length(about) <= 500),
  reviewed_by  uuid references auth.users(id) on delete set null,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists profiles_status on public.profiles (status);

-- True when the signed-in person is an approved admin.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select p.is_admin and p.status = 'approved' from public.profiles p where p.id = auth.uid()), false)
$$;

-- Rules the website can't skip. Requests from the SQL Editor (no signed-in user) are not limited.
create or replace function public.profiles_guard() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    new.updated_at := now();
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.phone       := (select u.phone from auth.users u where u.id = new.id);
    new.is_admin    := false;
    new.status      := case when new.role = 'farmer' then 'approved' else 'pending' end;
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.created_at  := now();
  else
    new.id         := old.id;
    new.phone      := old.phone;
    new.is_admin   := old.is_admin;
    new.created_at := old.created_at;
    if public.is_admin() and old.id <> auth.uid() then
      if new.status is distinct from old.status or new.role is distinct from old.role then
        new.reviewed_by := auth.uid();
        new.reviewed_at := now();
      end if;
    else
      -- People can edit their own name and details, not their role or approval.
      new.role        := old.role;
      new.status      := old.status;
      new.reviewed_by := old.reviewed_by;
      new.reviewed_at := old.reviewed_at;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before insert or update on public.profiles
  for each row execute function public.profiles_guard();

alter table public.profiles enable row level security;

drop policy if exists "read own profile, admins read all" on public.profiles;
create policy "read own profile, admins read all" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "create own profile" on public.profiles;
create policy "create own profile" on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists "edit own profile, admins edit all" on public.profiles;
create policy "edit own profile, admins edit all" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Make yourself the admin. Do this once, AFTER you have signed in on the website
-- with your own phone number and filled in your details.
-- Supabase stores numbers without the "+", e.g. 919845012345 for +91 98450 12345.
-- Remove the two dashes at the start of the next line, change the number, and Run:
--
-- update public.profiles set is_admin = true, status = 'approved', role = 'cluster' where phone = '919845012345';
--
-- Check it worked (shows one row with is_admin = true):
-- select name, role, status, is_admin, phone from public.profiles where is_admin;
