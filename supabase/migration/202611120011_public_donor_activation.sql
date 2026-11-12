-- Aashraya: donor volunteers are active immediately after verified-email registration.
-- Coordinator approval is not part of donor onboarding. Coordinators continue to manage requests and may deactivate donors.

create or replace function public.register_my_donor(
  p_display_name text,p_blood_group public.blood_group,p_department text,p_study_year text,
  p_campus_area_id uuid,p_availability text,p_consent boolean,p_phone text,p_district text,
  p_dob date,p_weight_kg numeric,p_height_cm numeric,p_address text,p_passing_date date
)
returns uuid language plpgsql security definer set search_path=''
as $$
declare verified_email text; new_id uuid; min_age_date date := (current_date - interval '18 years')::date;
begin
  if not private.is_verified_member() then raise exception 'Verify your email address before registering'; end if;
  select lower(u.email) into verified_email from auth.users u where u.id=auth.uid();
  if verified_email is null then raise exception 'A verified email address is required'; end if;
  if p_consent is distinct from true then raise exception 'Consent is required'; end if;
  if p_display_name is null or length(trim(p_display_name)) not between 1 and 70 then raise exception 'Enter a valid name'; end if;
  if p_department is null or length(trim(p_department)) not between 1 and 90 then raise exception 'Enter a valid department'; end if;
  if p_study_year is null or length(trim(p_study_year)) not between 1 and 32 then raise exception 'Enter a valid study year'; end if;
  if p_phone is null or length(trim(p_phone)) not between 6 and 18 then raise exception 'Enter a valid phone number'; end if;
  if p_dob is null or p_dob > min_age_date or p_dob < current_date - interval '100 years' then raise exception 'Donors must be 18 or older'; end if;
  if p_weight_kg is null or p_weight_kg not between 30 and 200 then raise exception 'Enter a valid weight'; end if;
  if p_height_cm is null or p_height_cm not between 100 and 230 then raise exception 'Enter a valid height'; end if;
  if p_address is null or length(trim(p_address)) not between 1 and 160 then raise exception 'Enter a valid address'; end if;
  if p_passing_date is null or p_passing_date < current_date then raise exception 'Expected passing date must be today or later'; end if;
  if p_district is null or length(trim(p_district))=0 then raise exception 'Select a district'; end if;
  if not exists(select 1 from public.campus_areas a where a.id=p_campus_area_id and a.active) then raise exception 'Select an active campus area'; end if;
  if exists(select 1 from public.student_donors d where d.user_id=auth.uid()) then raise exception 'A donor profile already exists for your account'; end if;

  insert into public.student_donors(user_id,display_name,blood_group,department,study_year,campus_area_id,availability,district,consent_at,approval_status,is_active)
  values(auth.uid(),trim(p_display_name),p_blood_group,trim(p_department),trim(p_study_year),p_campus_area_id,trim(p_availability),trim(p_district),now(),'approved',true)
  returning id into new_id;

  insert into private.donor_contacts(donor_id,email,phone) values(new_id,verified_email,trim(p_phone));
  insert into private.donor_details(donor_id,date_of_birth,weight_kg,height_cm,address,expected_passing_date)
  values(new_id,p_dob,p_weight_kg,p_height_cm,trim(p_address),p_passing_date);

  insert into public.notifications(user_id,kind,title,body,entity_type,entity_id)
  values(auth.uid(),'donor_registration','Welcome to Aashraya Blood Cell','Your volunteer donor profile is active in Aashraya. You can manage your availability from your account.','student_donor',new_id);
  perform private.log_audit('donor_registered','student_donor',new_id,jsonb_build_object('email_domain',split_part(verified_email,'@',2)));
  return new_id;
end;
$$;

revoke all on function public.register_my_donor(text,public.blood_group,text,text,uuid,text,boolean,text,text,date,numeric,numeric,text,date) from public,anon;
grant execute on function public.register_my_donor(text,public.blood_group,text,text,uuid,text,boolean,text,text,date,numeric,numeric,text,date) to authenticated;

revoke all on function public.set_donor_approval(uuid,text) from public,anon,authenticated;
