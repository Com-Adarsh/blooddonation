-- Aashraya completion: configurable institution access, notifications, audit logging and donor self-availability.
-- Apply after the existing Aashraya field/hardening migrations.

create table if not exists private.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table private.app_settings enable row level security;
revoke all on private.app_settings from public, anon, authenticated;
insert into private.app_settings(key,value) values ('allowed_email_domains','["cusat.ac.in","ug.cusat.ac.in"]'::jsonb)
on conflict (key) do nothing;

create table if not exists private.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (length(trim(action)) between 1 and 80),
  entity_type text not null check (length(trim(entity_type)) between 1 and 60),
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table private.audit_logs enable row level security;
revoke all on private.audit_logs from public, anon, authenticated;
create index if not exists audit_logs_actor_created_idx on private.audit_logs(actor_user_id,created_at desc);
create index if not exists audit_logs_entity_idx on private.audit_logs(entity_type,entity_id,created_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (length(trim(kind)) between 1 and 40),
  title text not null check (length(trim(title)) between 1 and 120),
  body text not null check (length(trim(body)) between 1 and 500),
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
revoke all on public.notifications from anon,authenticated;
grant select,update on public.notifications to authenticated;
drop policy if exists "Users read their notifications" on public.notifications;
create policy "Users read their notifications" on public.notifications for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists "Users mark their notifications read" on public.notifications;
create policy "Users mark their notifications read" on public.notifications for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create index if not exists notifications_user_created_idx on public.notifications(user_id,created_at desc);

create or replace function private.allowed_email_domain(p_email text)
returns boolean language sql stable security definer set search_path=''
as $$
select exists (
  select 1 from jsonb_array_elements_text(coalesce((select value from private.app_settings where key='allowed_email_domains'),'[]'::jsonb)) d(domain)
  where lower(split_part(trim(p_email),'@',2))=lower(d.domain)
);
$$;
revoke all on function private.allowed_email_domain(text) from public,anon;
grant execute on function private.allowed_email_domain(text) to authenticated;

create or replace function public.register_my_donor(
  p_display_name text,p_blood_group public.blood_group,p_department text,p_study_year text,
  p_campus_area_id uuid,p_availability text,p_consent boolean,p_phone text,p_district text,
  p_dob date,p_weight_kg numeric,p_height_cm numeric,p_address text,p_passing_date date
)
returns uuid language plpgsql security definer set search_path=''
as $$
declare verified_email text; new_id uuid; min_age_date date := (current_date - interval '18 years')::date;
begin
  if not private.is_verified_member() then raise exception 'A verified email address is required'; end if;
  select lower(u.email) into verified_email from auth.users u where u.id=auth.uid();
  if verified_email is null or not private.allowed_email_domain(verified_email) then raise exception 'Use an approved institution email address'; end if;
  if p_consent is distinct from true then raise exception 'Consent is required'; end if;
  if p_display_name is null or length(trim(p_display_name)) not between 1 and 70 then raise exception 'Enter a valid name'; end if;
  if p_department is null or length(trim(p_department)) not between 1 and 90 then raise exception 'Enter a valid department'; end if;
  if p_study_year is null or length(trim(p_study_year)) not between 1 and 32 then raise exception 'Enter a valid study year'; end if;
  if p_phone is null or length(trim(p_phone)) not between 6 and 18 then raise exception 'Enter a valid phone number'; end if;
  if p_dob is null or p_dob > min_age_date or p_dob < current_date - interval '100 years' then raise exception 'Enter a valid date of birth'; end if;
  if p_weight_kg is null or p_weight_kg not between 30 and 200 then raise exception 'Enter a valid weight'; end if;
  if p_height_cm is null or p_height_cm not between 100 and 230 then raise exception 'Enter a valid height'; end if;
  if p_address is null or length(trim(p_address)) not between 1 and 160 then raise exception 'Enter a valid address'; end if;
  if p_passing_date is null or p_passing_date < current_date then raise exception 'Expected passing date must be today or later'; end if;
  if p_district is null or length(trim(p_district))=0 then raise exception 'Select a district'; end if;
  if not exists(select 1 from public.campus_areas a where a.id=p_campus_area_id and a.active) then raise exception 'Select an active campus area'; end if;
  if exists(select 1 from public.student_donors d where d.user_id=auth.uid()) then raise exception 'A donor profile already exists for your account'; end if;
  insert into public.student_donors(user_id,display_name,blood_group,department,study_year,campus_area_id,availability,district,consent_at)
  values(auth.uid(),trim(p_display_name),p_blood_group,trim(p_department),trim(p_study_year),p_campus_area_id,trim(p_availability),trim(p_district),now())
  returning id into new_id;
  insert into private.donor_contacts(donor_id,email,phone) values(new_id,verified_email,trim(p_phone));
  insert into private.donor_details(donor_id,date_of_birth,weight_kg,height_cm,address,expected_passing_date)
  values(new_id,p_dob,p_weight_kg,p_height_cm,trim(p_address),p_passing_date);
  return new_id;
end;
$$;
revoke all on function public.register_my_donor(text,public.blood_group,text,text,uuid,text,boolean,text,text,date,numeric,numeric,text,date) from public,anon;
grant execute on function public.register_my_donor(text,public.blood_group,text,text,uuid,text,boolean,text,text,date,numeric,numeric,text,date) to authenticated;

create or replace function public.set_my_donor_active(p_active boolean)
returns void language plpgsql security definer set search_path=''
as $$
begin
  if not private.is_verified_member() then raise exception 'Authentication required'; end if;
  update public.student_donors set is_active=coalesce(p_active,false),updated_at=now() where user_id=auth.uid();
  if not found then raise exception 'Donor profile not found'; end if;
end;
$$;
revoke all on function public.set_my_donor_active(boolean) from public,anon;
grant execute on function public.set_my_donor_active(boolean) to authenticated;

create or replace function private.log_audit(p_action text,p_entity_type text,p_entity_id uuid,p_metadata jsonb default '{}'::jsonb)
returns void language sql security definer set search_path=''
as $$ insert into private.audit_logs(actor_user_id,action,entity_type,entity_id,metadata) values(auth.uid(),trim(p_action),trim(p_entity_type),p_entity_id,coalesce(p_metadata,'{}'::jsonb)); $$;
revoke all on function private.log_audit(text,text,uuid,jsonb) from public,anon,authenticated;

create or replace function private.notify(p_user_id uuid,p_kind text,p_title text,p_body text,p_entity_type text,p_entity_id uuid)
returns void language sql security definer set search_path=''
as $$ insert into public.notifications(user_id,kind,title,body,entity_type,entity_id) values(p_user_id,p_kind,p_title,p_body,p_entity_type,p_entity_id); $$;
revoke all on function private.notify(uuid,text,text,text,text,uuid) from public,anon,authenticated;

create or replace function private.connection_request_notifications()
returns trigger language plpgsql security definer set search_path=''
as $$
declare donor_user uuid; coordinator_user uuid;
begin
  if tg_op='INSERT' then
    select d.user_id into donor_user from public.student_donors d where d.id=new.donor_id;
    if donor_user is not null then perform private.notify(donor_user,'connection_request','New blood connection request','A student has requested a donor connection.','connection_requests',new.id); end if;
    for coordinator_user in select c.user_id from private.coordinators c loop perform private.notify(coordinator_user,'coordinator_request','New connection request','A new donor connection request needs review.','connection_requests',new.id); end loop;
  elsif new.status is distinct from old.status then
    perform private.notify(new.requester_user_id,'request_status','Connection request updated','Your donor connection request is now '||new.status||'.','connection_requests',new.id);
    perform private.log_audit('request_status_changed','connection_requests',new.id,jsonb_build_object('from',old.status,'to',new.status));
  end if;
  return new;
end;
$$;
drop trigger if exists connection_request_notifications on public.connection_requests;
create trigger connection_request_notifications after insert or update on public.connection_requests for each row execute function private.connection_request_notifications();

create or replace function private.blood_request_notifications()
returns trigger language plpgsql security definer set search_path=''
as $$
declare coordinator_user uuid;
begin
  if tg_op='INSERT' then
    for coordinator_user in select c.user_id from private.coordinators c loop perform private.notify(coordinator_user,'coordinator_request','New blood support request','A new blood-support request needs review.','blood_requests',new.id); end loop;
    perform private.log_audit('blood_request_created','blood_requests',new.id,'{}'::jsonb);
  elsif new.status is distinct from old.status then
    perform private.notify(new.requester_user_id,'request_status','Blood support request updated','Your blood support request is now '||new.status||'.','blood_requests',new.id);
    perform private.log_audit('request_status_changed','blood_requests',new.id,jsonb_build_object('from',old.status,'to',new.status));
  end if;
  return new;
end;
$$;
drop trigger if exists blood_request_notifications on public.blood_requests;
create trigger blood_request_notifications after insert or update on public.blood_requests for each row execute function private.blood_request_notifications();

create or replace function public.coordinator_contact_for_donor(p_donor_id uuid)
returns table(email text,phone text,address text,date_of_birth date,weight_kg numeric,height_cm numeric,expected_passing_date date)
language plpgsql security definer set search_path=''
as $$
begin
  if not private.is_coordinator() then raise exception 'Coordinator access required'; end if;
  insert into private.coordinator_contact_access(coordinator_user_id,donor_id) values(auth.uid(),p_donor_id);
  perform private.log_audit('private_contact_viewed','donor',p_donor_id,'{}'::jsonb);
  return query select c.email,c.phone,d.address,d.date_of_birth,d.weight_kg,d.height_cm,d.expected_passing_date from private.donor_contacts c left join private.donor_details d on d.donor_id=c.donor_id where c.donor_id=p_donor_id;
end;
$$;
revoke all on function public.coordinator_contact_for_donor(uuid) from public,anon;
grant execute on function public.coordinator_contact_for_donor(uuid) to authenticated;

create or replace function public.set_request_status(p_table text,p_id uuid,p_status public.request_status)
returns void language plpgsql security definer set search_path=''
as $$
begin
  if not private.is_coordinator() then raise exception 'Coordinator access required'; end if;
  if p_status not in ('pending','accepted','declined','closed') then raise exception 'Invalid request status'; end if;
  if p_table='connection_requests' then update public.connection_requests set status=p_status,updated_at=now() where id=p_id;
  elsif p_table='blood_requests' then update public.blood_requests set status=p_status,updated_at=now() where id=p_id;
  else raise exception 'Invalid request type'; end if;
  if not found then raise exception 'Request not found'; end if;
  perform private.log_audit('request_status_updated',p_table,p_id,jsonb_build_object('status',p_status));
end;
$$;
revoke all on function public.set_request_status(text,uuid,public.request_status) from public,anon;
grant execute on function public.set_request_status(text,uuid,public.request_status) to authenticated;