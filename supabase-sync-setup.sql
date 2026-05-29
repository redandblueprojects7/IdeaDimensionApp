-- Idea Dimension App — Sync-ready database setup
-- Run this in Supabase SQL Editor after your current supabase-setup.sql.

-- 1) Reusable updated_at trigger function
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2) Events table additions for source feeds
alter table public.events
  add column if not exists source text not null default 'manual',
  add column if not exists source_event_id text,
  add column if not exists source_url text;

drop index if exists public.events_source_event_unique;
create unique index if not exists events_source_event_unique
  on public.events (source, source_event_id);

create index if not exists events_source_idx
  on public.events (source);

create index if not exists events_starts_at_idx
  on public.events (starts_at);

-- 3) Artists table for app carousel/page
create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  members text[] not null default '{}',
  logo_url text,
  image_url text,
  description text not null default '',
  external_url text,
  external_label text,
  sort_order int,
  is_published boolean not null default true,
  source text not null default 'manual',
  source_artist_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- If artists already exists from earlier setup, ensure sync columns exist.
alter table public.artists
  add column if not exists members text[] not null default '{}',
  add column if not exists logo_url text,
  add column if not exists image_url text,
  add column if not exists description text not null default '',
  add column if not exists external_url text,
  add column if not exists external_label text,
  add column if not exists sort_order int,
  add column if not exists is_published boolean not null default true,
  add column if not exists source text not null default 'manual',
  add column if not exists source_artist_id text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

drop index if exists public.artists_source_artist_unique;
create unique index if not exists artists_source_artist_unique
  on public.artists (source, source_artist_id);

create index if not exists artists_sort_name_idx
  on public.artists (sort_order, name);

create index if not exists artists_source_idx
  on public.artists (source);

-- 4) Trigger wiring (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'events_updated_at'
  ) then
    create trigger events_updated_at
      before update on public.events
      for each row execute procedure public.set_updated_at();
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'artists_updated_at'
  ) then
    create trigger artists_updated_at
      before update on public.artists
      for each row execute procedure public.set_updated_at();
  end if;
end
$$;

-- 5) RLS and policies
alter table public.artists enable row level security;

-- Public app access: published rows only
-- Use guarded creation so reruns do not fail.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'events'
      and policyname = 'Public can read published events'
  ) then
    create policy "Public can read published events"
      on public.events
      for select
      using (is_published = true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'artists'
      and policyname = 'Public can read published artists'
  ) then
    create policy "Public can read published artists"
      on public.artists
      for select
      using (is_published = true);
  end if;
end
$$;
