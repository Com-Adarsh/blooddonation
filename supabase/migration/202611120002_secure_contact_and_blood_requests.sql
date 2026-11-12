-- Secure API wrappers and general requests. Safe to apply after 202611120001_initial_backend.sql.
create table private.coordinator_contact_access (
  id uuid primary key default gen_random_uuid(),
  coordinator_user_id uuid not null references auth.users(id) on delete cascade,
  donor_id uuid not null references public.student_donors(id) on delete cascade,
  accessed_at timestamptz not null default now()
);
alter table private.coordinator_contact_access enable row level security;
revoke all on private.coordinator_contact_access from public, anon, authenticated;

create or replace function public.is_campus_coordinator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select private.is_coordinator(); $$;
revoke all on function public.is_campus_coordinator() from public, anon;
grant execute on function public.is_campus_coordinator() to authenticated;

create or replace function public.save_my_donor_contact(p_donor_id uuid, p_phone text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare verified_email text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select u.email into verified_email from auth.users u
    where u.id = auth.uid() and u.email_confirmed_at is not null;
  if verified_email is null then raise exception 'A verified email address is required'; end if;
  if p_phone is null or length(trim(p_phone)) not between 6 and 18 then raise exception 'Enter a valid phone number'; end if;
  if not exists (select 1 from public.student_donors d where d.id = p_donor_id and d.user_id = auth.uid()) then
    raise exception 'You can only add contact details to your own donor profile';
  end if;
  insert into private.donor_contacts (donor_id, email, phone)
    values (p_donor_id, verified_email, trim(p_phone))
    on conflict (donor_id) do update set email = excluded.email, phone = excluded.phone, updated_at = now();
end;
$$;
revoke all on function public.save_my_donor_contact(uuid, text) from public, anon;
grant execute on function public.save_my_donor_contact(uuid, text) to authenticated;

create or replace function public.register_my_donor(
  p_display_name text, p_blood_group public.blood_group, p_department text, p_study_year text,
  p_campus_area_id uuid, p_availability text, p_consent boolean, p_phone text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare verified_email text; new_donor_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select u.email into verified_email from auth.users u
    where u.id = auth.uid() and u.email_confirmed_at is not null;
  if verified_email is null then raise exception 'A verified email address is required'; end if;
  if p_consent is distinct from true then raise exception 'Consent is required'; end if;
  if p_phone is null or length(trim(p_phone)) not between 6 and 18 then raise exception 'Enter a valid phone number'; end if;
  insert into public.student_donors (user_id, display_name, blood_group, department, study_year, campus_area_id, availability, consent_at)
    values (auth.uid(), trim(p_display_name), p_blood_group, trim(p_department), trim(p_study_year), p_campus_area_id, trim(p_availability), now())
    returning id into new_donor_id;
  insert into private.donor_contacts (donor_id, email, phone)
    values (new_donor_id, verified_email, trim(p_phone));
  return new_donor_id;
end;
$$;
revoke all on function public.register_my_donor(text, public.blood_group, text, text, uuid, text, boolean, text) from public, anon;
grant execute on function public.register_my_donor(text, public.blood_group, text, text, uuid, text, boolean, text) to authenticated;
revoke insert on public.student_donors from authenticated;

create or replace function public.coordinator_contact_for_donor(p_donor_id uuid)
returns table(email text, phone text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not private.is_coordinator() then raise exception 'Coordinator access required'; end if;
  insert into private.coordinator_contact_access (coordinator_user_id, donor_id)
    values (auth.uid(), p_donor_id);
  return query select c.email, c.phone from private.donor_contacts c where c.donor_id = p_donor_id;
end;
$$;
revoke all on function public.coordinator_contact_for_donor(uuid) from public, anon;
grant execute on function public.coordinator_contact_for_donor(uuid) to authenticated;

-- General help requests are routed to the Cell without selecting a donor first.
create table public.blood_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  blood_group public.blood_group not null,
  urgency text not null check (length(trim(urgency)) between 1 and 40),
  location text not null check (length(trim(location)) between 1 and 90),
  note text check (note is null or length(note) <= 180),
  status public.request_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant delete on public.student_donors to authenticated;
drop policy if exists "Students delete their own donor profile" on public.student_donors;
create policy "Students delete their own donor profile" on public.student_donors
for delete to authenticated using (user_id = (select auth.uid()));
create unique index if not exists connection_requests_active_pair_idx on public.connection_requests (donor_id, requester_user_id) where status in ('pending', 'accepted');
create index blood_requests_status_created_idx on public.blood_requests (status, created_at desc);
alter table public.blood_requests enable row level security;
revoke all on public.blood_requests from anon, authenticated;
grant select, insert, update on public.blood_requests to authenticated;
create policy "Requesters and coordinators read blood requests" on public.blood_requests
for select to authenticated using (requester_user_id = (select auth.uid()) or (select private.is_coordinator()));
create policy "Students create pending blood requests as themselves" on public.blood_requests
for insert to authenticated with check (requester_user_id = (select auth.uid()) and status = 'pending');
create policy "Coordinators update blood request status" on public.blood_requests
for update to authenticated using ((select private.is_coordinator())) with check ((select private.is_coordinator()));
create trigger blood_requests_touch_updated_at before update on public.blood_requests
for each row execute function private.touch_updated_at();


create or replace function public.deactivate_donor(p_donor_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not private.is_coordinator() then raise exception 'Coordinator access required'; end if;
  update public.student_donors set is_active = false where id = p_donor_id;
  if not found then raise exception 'Donor profile not found'; end if;
end;
$$;
revoke all on function public.deactivate_donor(uuid) from public, anon;
grant execute on function public.deactivate_donor(uuid) to authenticated;


create or replace function private.is_verified_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from auth.users u where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;
revoke all on function private.is_verified_member() from public, anon;
grant execute on function private.is_verified_member() to authenticated;

create or replace function private.is_coordinator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_verified_member() and exists (
    select 1 from private.coordinators c where c.user_id = auth.uid()
  );
$$;
revoke all on function private.is_coordinator() from public, anon;
grant execute on function private.is_coordinator() to authenticated;

-- Recreate existing policies so a signed-in but unverified/anonymous account cannot use live data.
drop policy if exists "Signed-in students read active areas" on public.campus_areas;
create policy "Verified students read active areas" on public.campus_areas
for select to authenticated using (active and (select private.is_verified_member()));
drop policy if exists "Verified members read active safe donor profiles" on public.student_donors;
create policy "Verified members read active safe donor profiles" on public.student_donors
for select to authenticated using ((select private.is_verified_member()) and (is_active or user_id = (select auth.uid()) or (select private.is_coordinator())));
drop policy if exists "Students create their own donor profile" on public.student_donors;
create policy "Students create their own donor profile" on public.student_donors
for insert to authenticated with check ((select private.is_verified_member()) and user_id = (select auth.uid()) and consent_at <= now());
drop policy if exists "Students update their own donor profile" on public.student_donors;
create policy "Students update their own donor profile" on public.student_donors
for update to authenticated using ((select private.is_verified_member()) and user_id = (select auth.uid()))
with check ((select private.is_verified_member()) and user_id = (select auth.uid()));
drop policy if exists "Students delete their own donor profile" on public.student_donors;
create policy "Students delete their own donor profile" on public.student_donors
for delete to authenticated using ((select private.is_verified_member()) and user_id = (select auth.uid()));

drop policy if exists "Owner or coordinator reads private contacts" on private.donor_contacts;
create policy "Owner or coordinator reads private contacts" on private.donor_contacts
for select to authenticated using ((select private.is_verified_member()) and (
  exists (select 1 from public.student_donors d where d.id = donor_id and d.user_id = (select auth.uid()))
  or (select private.is_coordinator())
));
drop policy if exists "Owner writes own private contacts" on private.donor_contacts;
create policy "Owner writes own private contacts" on private.donor_contacts
for insert to authenticated with check ((select private.is_verified_member()) and
  exists (select 1 from public.student_donors d where d.id = donor_id and d.user_id = (select auth.uid())));
drop policy if exists "Owner updates own private contacts" on private.donor_contacts;
create policy "Owner updates own private contacts" on private.donor_contacts
for update to authenticated using ((select private.is_verified_member()) and
  exists (select 1 from public.student_donors d where d.id = donor_id and d.user_id = (select auth.uid())))
with check ((select private.is_verified_member()) and
  exists (select 1 from public.student_donors d where d.id = donor_id and d.user_id = (select auth.uid())));

drop policy if exists "Requesters and coordinators read requests" on public.connection_requests;
create policy "Requesters and coordinators read requests" on public.connection_requests
for select to authenticated using ((select private.is_verified_member()) and
  (requester_user_id = (select auth.uid()) or (select private.is_coordinator())));
drop policy if exists "Students create pending requests as themselves" on public.connection_requests;
create policy "Students create pending requests as themselves" on public.connection_requests
for insert to authenticated with check ((select private.is_verified_member()) and requester_user_id = (select auth.uid()) and status = 'pending'
  and exists (select 1 from public.student_donors d where d.id = donor_id and d.is_active and d.user_id <> (select auth.uid())));
drop policy if exists "Coordinators update request status" on public.connection_requests;
create policy "Coordinators update request status" on public.connection_requests
for update to authenticated using ((select private.is_coordinator())) with check ((select private.is_coordinator()));

drop policy if exists "Requesters and coordinators read blood requests" on public.blood_requests;
create policy "Requesters and coordinators read blood requests" on public.blood_requests
for select to authenticated using ((select private.is_verified_member()) and
  (requester_user_id = (select auth.uid()) or (select private.is_coordinator())));
drop policy if exists "Students create pending blood requests as themselves" on public.blood_requests;
create policy "Students create pending blood requests as themselves" on public.blood_requests
for insert to authenticated with check ((select private.is_verified_member()) and requester_user_id = (select auth.uid()) and status = 'pending');
drop policy if exists "Coordinators update blood request status" on public.blood_requests;
create policy "Coordinators update blood request status" on public.blood_requests
for update to authenticated using ((select private.is_coordinator())) with check ((select private.is_coordinator()));
