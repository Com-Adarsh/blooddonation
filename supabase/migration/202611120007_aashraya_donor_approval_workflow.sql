alter table public.student_donors
  add column if not exists approval_status text not null default 'approved';

alter table public.student_donors
  drop constraint if exists student_donors_approval_status_check;

alter table public.student_donors
  add constraint student_donors_approval_status_check
  check (approval_status in ('pending','approved','rejected'));

update public.student_donors
set approval_status='approved'
where approval_status is null or approval_status not in ('pending','approved','rejected');

drop policy if exists "Verified members read active safe donor profiles" on public.student_donors;
create policy "Verified members read approved donor profiles"
on public.student_donors
for select
to authenticated
using (
  (select private.is_verified_member())
  and (
    (is_active and approval_status='approved')
    or user_id=(select auth.uid())
    or (select private.is_coordinator())
  )
);

create or replace function private.is_coordinator()
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select private.is_verified_member() and (
    exists (select 1 from private.coordinators c where c.user_id=auth.uid())
    or exists (
      select 1 from auth.users u
      where u.id=auth.uid()
        and lower(u.email)=lower('aashrayacusat@gmail.com')
        and u.email_confirmed_at is not null
    )
  );
$function$;

-- Registration now creates a pending donor profile. A coordinator must approve it.
-- Existing donors were preserved as approved above.

create or replace function public.register_my_donor(
  p_display_name text, p_blood_group blood_group, p_department text,
  p_study_year text, p_campus_area_id uuid, p_availability text,
  p_consent boolean, p_phone text, p_district text, p_dob date,
  p_weight_kg numeric, p_height_cm numeric, p_address text, p_passing_date date
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare verified_email text; new_id uuid; min_age_date date := (current_date - interval '18 years')::date;
begin
  if not private.is_verified_member() then raise exception 'A verified email address is required'; end if;
  select lower(u.email) into verified_email from auth.users u where u.id=auth.uid();
  if verified_email is null or not private.allowed_email_domain(verified_email) then
    raise exception 'Donor registration requires your verified CUSAT student email address';
  end if;
  if p_consent is distinct from true then raise exception 'Consent is required'; end if;
  if p_display_name is null or length(trim(p_display_name)) not between 1 and 70 then raise exception 'Enter a valid name'; end if;
  if p_department is null or length(trim(p_department)) not between 1 and 90 then raise exception 'Enter a valid department'; end if;
  if p_study_year is null or length(trim(p_study_year)) not between 1 and 32 then raise exception 'Enter a valid study year'; end if;
  if p_phone is null or length(trim(p_phone)) not between 6 and 18 then raise exception 'Enter a valid phone number'; end if;
  if p_dob is null or p_dob > min_age_date then raise exception 'Donors must be 18 or older'; end if;
  if p_dob < current_date - interval '100 years' then raise exception 'Enter a valid date of birth'; end if;
  if p_weight_kg is null or p_weight_kg not between 30 and 200 then raise exception 'Enter a valid weight'; end if;
  if p_height_cm is null or p_height_cm not between 100 and 230 then raise exception 'Enter a valid height'; end if;
  if p_address is null or length(trim(p_address)) not between 1 and 160 then raise exception 'Enter a valid address'; end if;
  if p_passing_date is null or p_passing_date < current_date then raise exception 'Expected passing date must be today or later'; end if;
  if p_district is null or length(trim(p_district)) = 0 then raise exception 'Select a district'; end if;
  if not exists (select 1 from public.campus_areas a where a.id=p_campus_area_id and a.active) then raise exception 'Select an active campus area'; end if;
  if exists (select 1 from public.student_donors d where d.user_id=auth.uid()) then raise exception 'A donor profile already exists for your account'; end if;

  insert into public.student_donors(
    user_id,display_name,blood_group,department,study_year,campus_area_id,
    availability,district,consent_at,approval_status,is_active
  )
  values(
    auth.uid(),trim(p_display_name),p_blood_group,trim(p_department),trim(p_study_year),
    p_campus_area_id,trim(p_availability),trim(p_district),now(),'pending',false
  )
  returning id into new_id;

  insert into private.donor_contacts(donor_id,email,phone)
    values(new_id,verified_email,trim(p_phone));
  insert into private.donor_details(donor_id,date_of_birth,weight_kg,height_cm,address,expected_passing_date)
    values(new_id,p_dob,p_weight_kg,p_height_cm,trim(p_address),p_passing_date);

  insert into public.notifications(user_id,kind,title,body,entity_type,entity_id)
    values(auth.uid(),'donor_review','Donor registration submitted',
      'Your donor profile is waiting for approval from the Aashraya campus coordinator.',
      'student_donor',new_id);
  return new_id;
end;
$function$;

create or replace function public.set_donor_approval(p_donor_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare donor_user uuid;
begin
  if not private.is_coordinator() then raise exception 'Coordinator access required'; end if;
  if p_status not in ('approved','rejected') then raise exception 'Invalid donor approval status'; end if;
  select user_id into donor_user from public.student_donors where id=p_donor_id for update;
  if donor_user is null then raise exception 'Donor profile not found'; end if;
  update public.student_donors
    set approval_status=p_status,is_active=(p_status='approved'),updated_at=now()
    where id=p_donor_id;
  insert into public.notifications(user_id,kind,title,body,entity_type,entity_id)
    values(
      donor_user,
      case when p_status='approved' then 'donor_approved' else 'donor_rejected' end,
      case when p_status='approved' then 'Donor profile approved' else 'Donor profile not approved' end,
      case when p_status='approved'
        then 'Your Aashraya donor profile is now visible to eligible students.'
        else 'Your Aashraya donor registration was not approved. Please contact the campus coordinator if you need help.'
      end,
      'student_donor',p_donor_id
    );
end;
$function$;

grant execute on function public.set_donor_approval(uuid,text) to authenticated;