-- ===========================================================================
-- WorkSense — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard -> SQL -> New query).
-- ===========================================================================

create table if not exists public.responses (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),

  -- Demographics
  age_group   text not null,
  gender      text not null,
  experience  integer not null check (experience >= 0 and experience <= 60),
  sector      text not null check (sector in ('IT','Education','Manufacturing','Service','Other')),

  -- Physical Environment
  pe1 integer not null check (pe1 between 1 and 5),
  pe2 integer not null check (pe2 between 1 and 5),
  pe3 integer not null check (pe3 between 1 and 5),
  pe4 integer not null check (pe4 between 1 and 5),

  -- Social Environment
  se1 integer not null check (se1 between 1 and 5),
  se2 integer not null check (se2 between 1 and 5),
  se3 integer not null check (se3 between 1 and 5),
  se4 integer not null check (se4 between 1 and 5),

  -- Psychological Environment
  ps1 integer not null check (ps1 between 1 and 5),
  ps2 integer not null check (ps2 between 1 and 5),
  ps3 integer not null check (ps3 between 1 and 5),
  ps4 integer not null check (ps4 between 1 and 5),

  -- Facilities & Work-Life
  wl1 integer not null check (wl1 between 1 and 5),
  wl2 integer not null check (wl2 between 1 and 5),
  wl3 integer not null check (wl3 between 1 and 5),
  wl4 integer not null check (wl4 between 1 and 5),

  -- Employee Performance
  ep1 integer not null check (ep1 between 1 and 5),
  ep2 integer not null check (ep2 between 1 and 5),
  ep3 integer not null check (ep3 between 1 and 5),
  ep4 integer not null check (ep4 between 1 and 5)
);

-- ---------------------------------------------------------------------------
-- Row Level Security
--   * The public (anon) role may INSERT survey responses only.
--   * No one can SELECT/UPDATE/DELETE with the anon key.
--   * Reads happen server-side via the service_role key (bypasses RLS),
--     used by the /api/responses route.
-- ---------------------------------------------------------------------------
alter table public.responses enable row level security;

-- Allow anonymous inserts (public survey, no login).
drop policy if exists "public can insert responses" on public.responses;
create policy "public can insert responses"
  on public.responses
  for insert
  to anon
  with check (true);

-- NOTE: intentionally NO select/update/delete policy for anon,
-- so survey responses cannot be read or modified from the browser.
