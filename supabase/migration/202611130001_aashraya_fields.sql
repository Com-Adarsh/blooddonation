-- Aashraya merge: adds the Aashraya registration fields (DOB, weight, height, district,
-- address, expected passing date) and Inssen-style "date + location" on blood requests.
-- Run AFTER 202611120001_initial_backend.sql and the second (wrappers) migration.

-- Public, coarse location (safe to show on donor cards).
alter table public.student_donors
  add column district text not null default 'Ernakulam'
  check (district in ('Thiruvananthapuram','Kollam','Pathanamthitta','Alappuzha','Kottayam','Idukki','Ernakulam',
                      'Thrissur','Palakkad','Malappuram','Kozhikode','Wayanad','Kannur','Kasaragod'));
grant select (district) on public.student_donors to authenticated;

-- Private health and address details: owner or coordinator only.
create table private.donor_details (
  donor_id uuid primary key references public.student_donors(id) on delete cascade,
  date_of_birth date not null,
  weight_kg numeric(5,1) not null check (weight_kg between 30 and 200),
  height_cm numeric(5,1) not null check (height_cm between 100 and 230),
  address text not null check (length(trim(address)) between 1 and 160),
  expected_passing_date date not null,
  updated_at timestamptz not null default now()
);
alter table private.donor_details enable row level security;
revoke all on private.donor_details from public, anon, authenticated;
grant select on private.donor_details to authenticated;
create policy "Owner or coordinator reads donor details" on private.donor_details
for select to authenticated using ((select private.is_verified_member()) and (
  exists (select 1 from public.student_donors d where d.id = donor_id and d.user_id = (select auth.uid()))
  or (select private.is_coordinator())
));

-- Inssen idea: a request has a needed-by date and a location.
alter table public.blood_requests add column needed_by date, add column district text;

-- Registration now stores the extra fields in one atomic call.
drop function if exists public.register_my_donor(text, public.blood_group, text, text, uuid, text, boolean, text);
create function public.register_my_donor(
  p_display_name text, p_blood_group public.blood_group, p_department text, p_study_year text,
  p_campus_area_id uuid, p_availability text, p_consent boolean, p_phone text,
  p_district text, p_dob date, p_weight_kg numeric, p_height_cm numeric, p_address text, p_passing_date date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare verified_email text; new_id uuid;
begin
  if not private.is_verified_member() then raise exception 'A verified email address is required'; end if;
  if p_consent is distinct from true then raise exception 'Consent is required'; end if;
  if p_phone is null or length(trim(p_phone)) not between 6 and 18 then raise exception 'Enter a valid phone number'; end if;
  if p_dob is null or p_dob > current_date - interval '18 years' then raise exception 'Donors must be 18 or older'; end if;
  select u.email into verified_email from auth.users u where u.id = auth.uid();
  insert into public.student_donors (user_id, display_name, blood_group, department, study_year,
    campus_area_id, availability, district, consent_at)
  values (auth.uid(), trim(p_display_name), p_blood_group, trim(p_department), trim(p_study_year),
    p_campus_area_id, trim(p_availability), p_district, now())
  returning id into new_id;
  insert into private.donor_contacts (donor_id, email, phone) values (new_id, verified_email, trim(p_phone));
  insert into private.donor_details (donor_id, date_of_birth, weight_kg, height_cm, address, expected_passing_date)
  values (new_id, p_dob, p_weight_kg, p_height_cm, trim(p_address), p_passing_date);
  return new_id;
end;
$$;
revoke all on function public.register_my_donor(text, public.blood_group, text, text, uuid, text, boolean, text, text, date, numeric, numeric, text, date) from public, anon;
grant execute on function public.register_my_donor(text, public.blood_group, text, text, uuid, text, boolean, text, text, date, numeric, numeric, text, date) to authenticated;

-- Coordinators see contact + details together; every view is still logged.
drop function if exists public.coordinator_contact_for_donor(uuid);
create function public.coordinator_contact_for_donor(p_donor_id uuid)
returns table(email text, phone text, address text, date_of_birth date, weight_kg numeric, height_cm numeric, expected_passing_date date)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_coordinator() then raise exception 'Coordinator access required'; end if;
  insert into private.coordinator_contact_access (coordinator_user_id, donor_id) values (auth.uid(), p_donor_id);
  return query
    select c.email, c.phone, d.address, d.date_of_birth, d.weight_kg, d.height_cm, d.expected_passing_date
    from private.donor_contacts c left join private.donor_details d on d.donor_id = c.donor_id
    where c.donor_id = p_donor_id;
end;
$$;
revoke all on function public.coordinator_contact_for_donor(uuid) from public, anon;
grant execute on function public.coordinator_contact_for_donor(uuid) to authenticated;
