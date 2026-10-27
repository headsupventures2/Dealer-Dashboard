-- Leading Edge Detailing — Dealer Dashboard schema
-- Run this once in the Supabase SQL editor (Project → SQL → New query).

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Companies (dealerships / fleet accounts) and their rates
-- ─────────────────────────────────────────────────────────────
create table if not exists public.companies (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  contact_name      text,
  contact_email     text,
  contact_phone     text,
  -- Detail (per vehicle)
  price_per_vehicle numeric(10,2) not null default 0,
  cost_per_vehicle  numeric(10,2),
  -- Lot rinse (per vehicle rinsed)
  lot_rinse_price   numeric(10,2) not null default 0,
  lot_rinse_cost    numeric(10,2),
  -- Fuel fill-up service fee (per vehicle, fuel billed separately)
  fuel_fill_price   numeric(10,2) not null default 0,
  fuel_fill_cost    numeric(10,2),
  created_at        timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Users: one profile row per auth user
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  role       text not null check (role in ('admin', 'client')),
  company_id uuid references public.companies(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint client_needs_company check (role = 'admin' or company_id is not null)
);

-- ─────────────────────────────────────────────────────────────
-- Requests / jobs
-- ─────────────────────────────────────────────────────────────
create table if not exists public.jobs (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies(id) on delete cascade,
  service_type        text not null default 'detail'
                        check (service_type in ('detail', 'lot_rinse', 'fuel_fill')),
  vehicle_year        text,
  vehicle_make        text,
  vehicle_model       text,
  vehicle_color       text,
  stock_or_vin        text,
  vehicle_count       integer not null default 1 check (vehicle_count > 0), -- lot rinse: vehicles on the lot
  lot_area            text,          -- lot rinse: row / section
  request_notes       text,
  checklist           jsonb not null default '[]'::jsonb, -- [{key, label, done}]
  preferred_date      date,
  status              text not null default 'new'
                        check (status in ('new', 'scheduled', 'in_progress', 'completed')),
  scheduled_at        timestamptz,
  completed_at        timestamptz,
  price_at_completion numeric(10,2), -- service revenue, locked when the job is completed
  cost_at_completion  numeric(10,2),
  fuel_gallons        numeric(8,2),  -- fuel fill-up: recorded at completion
  fuel_amount         numeric(10,2), -- fuel fill-up: fuel cost billed through to the dealer
  client_notes        text,          -- visible to the dealership
  created_by          uuid references auth.users(id),
  created_at          timestamptz not null default now()
);
create index if not exists jobs_company_idx on public.jobs(company_id);
create index if not exists jobs_status_idx on public.jobs(status);

-- Internal notes live in their own admin-only table so clients can never read them.
create table if not exists public.job_internal_notes (
  job_id     uuid primary key references public.jobs(id) on delete cascade,
  notes      text,
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Photos
-- ─────────────────────────────────────────────────────────────
create table if not exists public.photos (
  id           uuid primary key default gen_random_uuid(),
  job_id       uuid not null references public.jobs(id) on delete cascade,
  type         text not null check (type in ('before', 'after')),
  storage_path text not null,
  created_at   timestamptz not null default now()
);
create index if not exists photos_job_idx on public.photos(job_id);

-- ─────────────────────────────────────────────────────────────
-- Role helpers
-- ─────────────────────────────────────────────────────────────
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_company_id() returns uuid
language sql stable security definer set search_path = public as $$
  select company_id from public.profiles where id = auth.uid();
$$;

-- ─────────────────────────────────────────────────────────────
-- Job guards: clients can only create plain "new" requests, and the
-- price is locked from the company's current rate the moment a job completes.
-- ─────────────────────────────────────────────────────────────
create or replace function public.jobs_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  c public.companies%rowtype;
begin
  if tg_op = 'INSERT' and not public.is_admin() then
    new.company_id := public.my_company_id();
    new.status := 'new';
    new.scheduled_at := null;
    new.completed_at := null;
    new.price_at_completion := null;
    new.cost_at_completion := null;
    new.client_notes := null;
    new.fuel_gallons := null;
    new.fuel_amount := null;
    new.created_by := auth.uid();
  end if;

  if new.status = 'completed' and (tg_op = 'INSERT' or old.status is distinct from 'completed') then
    select * into c from public.companies where id = new.company_id;
    new.completed_at := coalesce(new.completed_at, now());
    -- Rates are per vehicle; a lot rinse covers vehicle_count vehicles.
    if new.price_at_completion is null then
      new.price_at_completion := new.vehicle_count * case new.service_type
        when 'lot_rinse' then c.lot_rinse_price
        when 'fuel_fill' then c.fuel_fill_price
        else c.price_per_vehicle end;
      new.cost_at_completion := new.vehicle_count * case new.service_type
        when 'lot_rinse' then c.lot_rinse_cost
        when 'fuel_fill' then c.fuel_fill_cost
        else c.cost_per_vehicle end;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists jobs_guard on public.jobs;
create trigger jobs_guard before insert or update on public.jobs
  for each row execute function public.jobs_guard();

-- ─────────────────────────────────────────────────────────────
-- Row level security
-- ─────────────────────────────────────────────────────────────
alter table public.companies          enable row level security;
alter table public.profiles           enable row level security;
alter table public.jobs               enable row level security;
alter table public.job_internal_notes enable row level security;
alter table public.photos             enable row level security;

-- companies
drop policy if exists companies_admin on public.companies;
create policy companies_admin on public.companies for all
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists companies_client_read on public.companies;
create policy companies_client_read on public.companies for select
  using (id = public.my_company_id());

-- profiles
drop policy if exists profiles_admin on public.profiles;
create policy profiles_admin on public.profiles for all
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles for select
  using (id = auth.uid());

-- jobs
drop policy if exists jobs_admin on public.jobs;
create policy jobs_admin on public.jobs for all
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists jobs_client_read on public.jobs;
create policy jobs_client_read on public.jobs for select
  using (company_id = public.my_company_id());
drop policy if exists jobs_client_insert on public.jobs;
create policy jobs_client_insert on public.jobs for insert
  with check (company_id = public.my_company_id());

-- internal notes: admin only
drop policy if exists notes_admin on public.job_internal_notes;
create policy notes_admin on public.job_internal_notes for all
  using (public.is_admin()) with check (public.is_admin());

-- photos
drop policy if exists photos_admin on public.photos;
create policy photos_admin on public.photos for all
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists photos_client_read on public.photos;
create policy photos_client_read on public.photos for select
  using (exists (select 1 from public.jobs j
                 where j.id = photos.job_id and j.company_id = public.my_company_id()));

-- ─────────────────────────────────────────────────────────────
-- Photo storage (private bucket; path = <company_id>/<job_id>/<file>)
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('job-photos', 'job-photos', false)
on conflict (id) do nothing;

drop policy if exists job_photos_admin on storage.objects;
create policy job_photos_admin on storage.objects for all
  using (bucket_id = 'job-photos' and public.is_admin())
  with check (bucket_id = 'job-photos' and public.is_admin());
drop policy if exists job_photos_client_read on storage.objects;
create policy job_photos_client_read on storage.objects for select
  using (bucket_id = 'job-photos'
         and (storage.foldername(name))[1] = public.my_company_id()::text);

-- ─────────────────────────────────────────────────────────────
-- First admin: create your user in Authentication → Users, then run:
--   insert into public.profiles (id, email, role)
--   select id, email, 'admin' from auth.users where email = 'you@leadingedgeaviationdetail.com';
-- ─────────────────────────────────────────────────────────────
