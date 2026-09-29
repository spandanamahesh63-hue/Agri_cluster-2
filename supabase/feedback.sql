-- AgriCluster: feedback table (the version run on the live project).
-- Run once in Supabase → SQL Editor → New query → paste → Run. Safe to run again.
--
-- Anyone using the website can SEND feedback. Nobody can read or delete it
-- through the website: there is only an insert policy. The AgriCluster team
-- reads responses in the Supabase dashboard (Table Editor → feedback).
-- Lengths and the reply email are checked by the form before sending.

create table if not exists public.feedback (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  role          text not null,
  rating        smallint not null check (rating between 1 and 5),
  ease          smallint check (ease between 1 and 5),
  usefulness    smallint check (usefulness between 1 and 5),
  features      text[] not null default '{}',
  experience    text,
  suggestions   text,
  contact_email text,
  source        text
);

alter table public.feedback enable row level security;

drop policy if exists "anyone can send feedback" on public.feedback;

create policy "anyone can send feedback"
  on public.feedback for insert to anon
  with check (true);

grant insert on public.feedback to anon;

-- Reading responses (dashboard / SQL Editor):
--   select created_at, role, rating, ease, usefulness, features, experience, suggestions, contact_email
--   from feedback order by created_at desc;
--   select round(avg(rating), 2) as avg_rating, count(*) from feedback;
