-- AgriCluster: database setup for Supabase (PostgreSQL).
-- Run once: Supabase dashboard → SQL Editor → New query → paste this file → Run.
-- Safe to run again.
--
-- Two tables:
--   workspaces  one row per demo space: plan, profile, decisions, saved items (JSON)
--   records     one row per listing, booking, request, notification, post…
--
-- Security: row-level security (RLS) lets a browser read and write only the rows
-- of the demo space whose id it sends in the x-workspace-id header. The public
-- (anon) key alone can't list or read other spaces. This is prototype-grade:
-- before storing real farmers' data, add Supabase Auth (phone OTP) and base the
-- policies on auth.uid() and each role's permissions.

create table if not exists public.workspaces (
  id          text primary key check (id ~ '^[A-Za-z0-9-]{20,64}$'),
  state       jsonb not null default '{}'::jsonb check (pg_column_size(state) < 500000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.records (
  workspace_id text not null references public.workspaces(id) on delete cascade,
  collection   text not null check (collection in (
                 'listings','bookings','labourRequests','serviceRequests','consultations','interests',
                 'requirements','equipment','posts','replies','notifications','groups','events','supportRequests')),
  id           text not null check (char_length(id) <= 64),
  position     integer not null default 0,
  data         jsonb not null check (pg_column_size(data) < 50000),
  updated_at   timestamptz not null default now(),
  primary key (workspace_id, collection, id)
);

create index if not exists records_workspace_collection on public.records (workspace_id, collection);

-- The demo space id sent by the browser with every request.
create or replace function public.request_workspace() returns text
language sql stable
as $$
  select coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-workspace-id', '')
$$;

alter table public.workspaces enable row level security;
alter table public.records    enable row level security;

drop policy if exists "own demo space" on public.workspaces;
create policy "own demo space" on public.workspaces
  for all to anon
  using (id = public.request_workspace())
  with check (id = public.request_workspace());

drop policy if exists "own demo space records" on public.records;
create policy "own demo space records" on public.records
  for all to anon
  using (workspace_id = public.request_workspace())
  with check (workspace_id = public.request_workspace());

grant usage on schema public to anon;
grant select, insert, update, delete on public.workspaces, public.records to anon;
grant execute on function public.request_workspace() to anon;

-- Handy for looking around in the Table Editor / SQL Editor:
--   select collection, count(*) from records group by collection;
--   select data from records where collection = 'listings';
