-- AgriCluster: feedback table.
-- Run once in Supabase → SQL Editor → New query → paste → Run. Safe to run again.
--
-- Anyone using the website can SEND feedback. Nobody can read it through the
-- website: there is no select policy. The AgriCluster team reads it in the
-- Supabase dashboard (Table Editor → feedback).

create table if not exists public.feedback (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  role          text not null check (char_length(role) between 1 and 40),
  rating        smallint not null check (rating between 1 and 5),
  ease          smallint check (ease between 1 and 5),
  usefulness    smallint check (usefulness between 1 and 5),
  features      text[] not null default '{}' check (cardinality(features) <= 12),
  experience    text check (char_length(experience) <= 1000),
  suggestions   text check (char_length(suggestions) <= 1000),
  contact_email text check (contact_email is null or (char_length(contact_email) <= 120 and contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  source        text check (char_length(source) <= 20)
);

alter table public.feedback enable row level security;

drop policy if exists "anyone can send feedback" on public.feedback;
create policy "anyone can send feedback" on public.feedback
  for insert to anon
  with check (true);

grant insert on public.feedback to anon;

-- Reading responses (dashboard / SQL Editor):
--   select created_at, role, rating, ease, usefulness, features, experience, suggestions, contact_email
--   from feedback order by created_at desc;
--   select round(avg(rating), 2) as avg_rating, count(*) from feedback;
