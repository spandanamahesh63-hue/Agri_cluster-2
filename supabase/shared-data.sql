-- AgriCluster: shared data for real accounts (run AFTER accounts.sql).
-- Supabase dashboard → SQL Editor → New query → paste this file → Run. Safe to run again.
--
-- items        every listing, booking, request, notification, post… one row each.
--              Each row says who can see it (viewers) and who besides its creator
--              may change parts of it (editors). Entries look like:
--                'all'             every approved member
--                'role:cluster'    everyone approved in that role
--                'user:<uuid>'     one person
-- item_rules   per kind of record: which roles may create it, which fields other
--              people may change, and which lists people may add/remove themselves to.
-- user_state   each person's private settings and farm plan.
-- members()    the member directory: names, roles and places of approved people
--              (no phone numbers).
--
-- Only approved accounts can read or write anything here. The database enforces
-- every rule below; the website can't skip them.

-- ---------------------------------------------------------------------------
-- Who am I, as the list of principals that viewers/editors entries can match.
create or replace function public.my_principals() returns text[]
language sql stable security definer set search_path = public
as $$
  select coalesce((
    select array['all', 'role:' || p.role, 'user:' || p.id::text] || case when p.is_admin then array['admin'] else '{}'::text[] end
    from public.profiles p
    where p.id = auth.uid() and p.status = 'approved'
  ), '{}'::text[])
$$;
grant execute on function public.my_principals() to authenticated;

-- ---------------------------------------------------------------------------
create table if not exists public.item_rules (
  collection     text primary key,
  creators       text[] not null,            -- principals allowed to create, e.g. {role:farmer} or {all}
  shared_keys    text[] not null default '{}', -- fields editors (not the creator) may change
  self_list_keys text[] not null default '{}'  -- id lists any viewer may join or leave (only their own id)
);

insert into public.item_rules (collection, creators, shared_keys, self_list_keys) values
  ('listings',        '{role:farmer}',                  '{status,agreedWith,offerDeclinedBy,requirementId}', '{}'),
  ('interests',       '{role:buyer}',                   '{status}',                                          '{}'),
  ('requirements',    '{role:buyer}',                   '{}',                                                '{}'),
  ('bookings',        '{role:farmer}',                  '{status}',                                          '{}'),
  ('labourRequests',  '{role:farmer}',                  '{status}',                                          '{}'),
  ('serviceRequests', '{role:farmer}',                  '{status}',                                          '{}'),
  ('consultations',   '{role:farmer}',                  '{status,answer,scheduledAt,mode,outcome}',          '{}'),
  ('equipment',       '{role:provider,role:cluster}',   '{}',                                                '{}'),
  ('technologies',    '{role:provider,role:cluster}',   '{}',                                                '{}'),
  ('crews',           '{role:labour}',                  '{}',                                                '{}'),
  ('experts',         '{role:expert}',                  '{}',                                                '{}'),
  ('posts',           '{all}',                          '{}',                                                '{}'),
  ('replies',         '{all}',                          '{}',                                                '{}'),
  ('notifications',   '{all}',                          '{read}',                                            '{}'),
  ('groups',          '{role:community,role:cluster}',  '{}',                                                '{memberUserIds}'),
  ('events',          '{role:community,role:cluster}',  '{}',                                                '{attendeeUserIds}'),
  ('supportRequests', '{role:farmer}',                  '{status,officeNote,landReport}',                    '{}')
on conflict (collection) do update
  set creators = excluded.creators, shared_keys = excluded.shared_keys, self_list_keys = excluded.self_list_keys;

alter table public.item_rules enable row level security;
drop policy if exists "members read rules" on public.item_rules;
create policy "members read rules" on public.item_rules for select to authenticated using (true);
revoke all on public.item_rules from anon;
grant select on public.item_rules to authenticated;

-- ---------------------------------------------------------------------------
create table if not exists public.items (
  collection text not null references public.item_rules(collection),
  id         text not null check (id ~ '^[A-Za-z0-9_-]{3,64}$'),
  owner      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  viewers    text[] not null default '{}' check (cardinality(viewers) <= 20),
  editors    text[] not null default '{}' check (cardinality(editors) <= 20),
  data       jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 50000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);
create index if not exists items_owner on public.items (owner);
create index if not exists items_viewers on public.items using gin (viewers);
create index if not exists items_updated on public.items (updated_at);

create or replace function public.items_guard() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  me     text[] := public.my_principals();
  rule   public.item_rules%rowtype;
  k      text;
  added  text[];
  gone   text[];
begin
  if auth.uid() is null then  -- SQL Editor
    new.updated_at := now();
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.owner      := auth.uid();
    new.data       := new.data || jsonb_build_object('id', new.id);
    new.created_at := now();
    new.updated_at := now();
    return new;
  end if;

  -- UPDATE
  if new.collection <> old.collection or new.id <> old.id then
    raise exception 'A record''s kind and id can''t change.';
  end if;
  new.owner      := old.owner;
  new.created_at := old.created_at;
  new.data       := new.data || jsonb_build_object('id', old.id);
  new.updated_at := now();
  if old.owner = auth.uid() then
    return new;
  end if;

  -- Someone else's record: only shared fields (as an editor) or their own id in a list.
  new.viewers := old.viewers;
  new.editors := old.editors;
  select * into rule from public.item_rules where collection = old.collection;
  for k in
    select key from (select jsonb_object_keys(old.data) as key union select jsonb_object_keys(new.data)) keys
  loop
    continue when (old.data -> k) is not distinct from (new.data -> k);
    if k = any(rule.shared_keys) and old.editors && me then
      continue;
    end if;
    if k = any(rule.self_list_keys) and (old.viewers && me or old.editors && me) then
      select coalesce(array_agg(x), '{}') into added from jsonb_array_elements_text(coalesce(new.data -> k, '[]')) x
        where x not in (select jsonb_array_elements_text(coalesce(old.data -> k, '[]')));
      select coalesce(array_agg(x), '{}') into gone from jsonb_array_elements_text(coalesce(old.data -> k, '[]')) x
        where x not in (select jsonb_array_elements_text(coalesce(new.data -> k, '[]')));
      continue when added <@ array[auth.uid()::text] and gone <@ array[auth.uid()::text];
    end if;
    raise exception 'You can''t change "%" on this %.', k, old.collection;
  end loop;
  return new;
end;
$$;

drop trigger if exists items_guard on public.items;
create trigger items_guard before insert or update on public.items
  for each row execute function public.items_guard();

alter table public.items enable row level security;

drop policy if exists "see own, shared or admin" on public.items;
create policy "see own, shared or admin" on public.items
  for select to authenticated
  using (
    cardinality(public.my_principals()) > 0
    and (owner = auth.uid() or viewers && public.my_principals() or editors && public.my_principals() or 'admin' = any(public.my_principals()))
  );

drop policy if exists "create what your role may" on public.items;
create policy "create what your role may" on public.items
  for insert to authenticated
  with check (
    owner = auth.uid()
    and exists (select 1 from public.item_rules r where r.collection = items.collection and r.creators && public.my_principals())
  );

drop policy if exists "change own or shared" on public.items;
create policy "change own or shared" on public.items
  for update to authenticated
  using (
    cardinality(public.my_principals()) > 0
    and (owner = auth.uid() or editors && public.my_principals() or viewers && public.my_principals())
  )
  with check (true); -- the trigger decides which fields may change

drop policy if exists "delete own" on public.items;
create policy "delete own" on public.items
  for delete to authenticated
  using (owner = auth.uid() and cardinality(public.my_principals()) > 0);

revoke all on public.items from anon;
grant select, insert, update, delete on public.items to authenticated;

-- Change a few fields of a record in one step, so two people editing different
-- fields at the same time don't overwrite each other.
create or replace function public.patch_item(p_collection text, p_id text, p_patch jsonb) returns public.items
language sql security invoker set search_path = public
as $$
  update public.items set data = data || p_patch where collection = p_collection and id = p_id returning *
$$;
grant execute on function public.patch_item(text, text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
create table if not exists public.user_state (
  user_id    uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  state      jsonb not null default '{}'::jsonb check (jsonb_typeof(state) = 'object' and pg_column_size(state) < 500000),
  updated_at timestamptz not null default now()
);
alter table public.user_state enable row level security;
drop policy if exists "own state" on public.user_state;
create policy "own state" on public.user_state
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
revoke all on public.user_state from anon;
grant select, insert, update on public.user_state to authenticated;

-- ---------------------------------------------------------------------------
-- Member directory for approved people: no phone numbers, no approval notes.
create or replace function public.members()
returns table (id uuid, name text, role text, organisation text, location text, joined timestamptz)
language sql stable security definer set search_path = public
as $$
  select p.id, p.name, p.role, p.organisation, p.location, p.created_at
  from public.profiles p
  where p.status = 'approved' and cardinality(public.my_principals()) > 0
  order by p.created_at
$$;
revoke all on function public.members() from anon, public;
grant execute on function public.members() to authenticated;
