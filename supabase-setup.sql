-- Idea Dimension App — Supabase Events Table Setup
-- Run this entire file in the Supabase SQL Editor:
-- supabase.com → your project → SQL Editor → New query → paste → Run

-- ─── Create the events table ──────────────────────────────────────────────────

create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  band        text not null,
  location    text not null,
  starts_at   timestamptz not null,
  image_url   text,
  description text,
  ticket_url  text,
  is_published boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Auto-update updated_at on row changes ────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_updated_at
  before update on public.events
  for each row execute procedure public.set_updated_at();

-- ─── Row Level Security (RLS) ─────────────────────────────────────────────────
-- The mobile app uses the anon key and can only READ published events.
-- Only you (authenticated via Supabase dashboard) can insert/edit/delete.

alter table public.events enable row level security;

-- Allow anyone (including the app with the anon key) to read published events
create policy "Public can read published events"
  on public.events
  for select
  using (is_published = true);

-- ─── Optional: seed a test event ──────────────────────────────────────────────
-- Remove or edit this before going live.

insert into public.events (name, band, location, starts_at, description, is_published)
values (
  'Test Gig',
  'Idea Dimension',
  'Your Venue, Your City',
  now() + interval '30 days',
  'This is a test event added during setup. Replace or delete it.',
  true
);
