-- Aashraya CUSAT backend: safe directory, private contacts, coordinator-mediated requests.
create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create type public.blood_group as enum ('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-');
create type public.request_status as enum ('pending', 'accepted', 'declined', 'closed');

create table public.campus_areas (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.student_donors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) between 1 and 70),
  blood_group public.blood_group not null,
  department text not null check (length(trim(department)) between 1 and 90),
  study_year text not null check (length(trim(study_year)) between 1 and 32),
  campus_area_id uuid not null references public.campus_areas(id),
  availability text not null check (length(trim(availability)) between 1 and 40),
  consent_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Kept in a non-exposed schema so directory queries can never return these fields.
create table private.donor_contacts (
  donor_id uuid primary key references public.student_donors(id) on delete cascade,
  email text not null,
  phone text not null,
  updated_at timestamptz not null default now()
);

create table private.coordinators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.student_donors(id) on delete restrict,
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  request_blood_group public.blood_group not null,
  urgency text not null check (length(trim(urgency)) between 1 and 40),
  note text check (note is null or length(note) <= 180),
  status public.request_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index student_donors_search_idx on public.student_donors (blood_group, campus_area_id) where is_active;
create index connection_requests_donor_status_created_idx on public.connection_requests (donor_id, status, created_at desc);
create index connection_requests_requester_created_idx on public.connection_requests (requester_user_id, created_at desc);
create unique index connection_requests_active_pair_idx on public.connection_requests (donor_id, requester_user_id) where status in ('pending', 'accepted');

create or replace function private.is_coordinator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from private.coordinators c where c.user_id = auth.uid()
  );
$$;
revoke all on function private.is_coordinator() from public, anon;
grant execute on function private.is_coordinator() to authenticated;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$ begin new.updated_at = now(); return new; end; $$;

revoke all on function private.touch_updated_at() from public, anon, authenticated;

create trigger student_donors_touch_updated_at before update on public.student_donors
for each row execute function private.touch_updated_at();
create trigger connection_requests_touch_updated_at before update on public.connection_requests
for each row execute function private.touch_updated_at();

alter table public.campus_areas enable row level security;
alter table public.student_donors enable row level security;
alter table private.donor_contacts enable row level security;
alter table private.coordinators enable row level security;
alter table public.connection_requests enable row level security;

revoke all on public.campus_areas, public.student_donors, public.connection_requests from anon, authenticated;
revoke all on private.donor_contacts, private.coordinators from public, anon, authenticated;
grant select on public.campus_areas to authenticated;
revoke select on public.student_donors from authenticated;
grant select (id, display_name, blood_group, department, study_year, campus_area_id, availability, consent_at, is_active, created_at, updated_at) on public.student_donors to authenticated;
grant insert (user_id, display_name, blood_group, department, study_year, campus_area_id, availability, consent_at, is_active) on public.student_donors to authenticated;
grant update (display_name, blood_group, department, study_year, campus_area_id, availability, consent_at, is_active) on public.student_donors to authenticated;
grant select, insert, update on public.connection_requests to authenticated;
grant delete on public.student_donors to authenticated;
grant select, insert, update on private.donor_contacts to authenticated;

create policy "Signed-in students read active areas" on public.campus_areas
for select to authenticated using (active);

create policy "Verified members read active safe donor profiles" on public.student_donors
for select to authenticated using (is_active or user_id = (select auth.uid()) or (select private.is_coordinator()));
create policy "Students create their own donor profile" on public.student_donors
for insert to authenticated with check (user_id = (select auth.uid()) and consent_at <= now());
create policy "Students update their own donor profile" on public.student_donors
for update to authenticated using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Students delete their own donor profile" on public.student_donors
for delete to authenticated using (user_id = (select auth.uid()));

create policy "Owner or coordinator reads private contacts" on private.donor_contacts
for select to authenticated using (
  exists (select 1 from public.student_donors d where d.id = donor_id and d.user_id = (select auth.uid()))
  or (select private.is_coordinator())
);
create policy "Owner writes own private contacts" on private.donor_contacts
for insert to authenticated with check (
  exists (select 1 from public.student_donors d where d.id = donor_id and d.user_id = (select auth.uid()))
);
create policy "Owner updates own private contacts" on private.donor_contacts
for update to authenticated using (
  exists (select 1 from public.student_donors d where d.id = donor_id and d.user_id = (select auth.uid()))
) with check (
  exists (select 1 from public.student_donors d where d.id = donor_id and d.user_id = (select auth.uid()))
);

create policy "Requesters and coordinators read requests" on public.connection_requests
for select to authenticated using (requester_user_id = (select auth.uid()) or (select private.is_coordinator()));
create policy "Students create pending requests as themselves" on public.connection_requests
for insert to authenticated with check (
  requester_user_id = (select auth.uid()) and status = 'pending'
  and exists (select 1 from public.student_donors d where d.id = donor_id and d.is_active and d.user_id <> (select auth.uid()))
);
create policy "Coordinators update request status" on public.connection_requests
for update to authenticated using ((select private.is_coordinator()))
with check ((select private.is_coordinator()));

insert into public.campus_areas (name) values
  ('CUSAT Main Campus'), ('Kalamassery'), ('Hostel area'), ('School of Engineering')
on conflict (name) do nothing;

-- Add coordinator accounts manually after they sign in, using the SQL editor:
-- insert into private.coordinators (user_id) select id from auth.users where email = 'coordinator@cusat.ac.in';
-- In Supabase Auth settings, restrict signups to the institution's confirmed email domain.




