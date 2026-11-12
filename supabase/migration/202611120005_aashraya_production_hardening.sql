-- Aashraya production hardening: indexes, coordinator audit RLS, and secure status updates.
create index if not exists student_donors_campus_area_idx on public.student_donors(campus_area_id);
create index if not exists blood_requests_requester_idx on public.blood_requests(requester_user_id, created_at desc);
create index if not exists coordinator_contact_access_coordinator_idx on private.coordinator_contact_access(coordinator_user_id, accessed_at desc);
create index if not exists coordinator_contact_access_donor_idx on private.coordinator_contact_access(donor_id, accessed_at desc);

alter table private.coordinators enable row level security;
revoke all on private.coordinators from anon, authenticated;
alter table private.coordinator_contact_access enable row level security;
revoke all on private.coordinator_contact_access from anon, authenticated;

drop policy if exists "Coordinator reads own coordinator row" on private.coordinators;
create policy "Coordinator reads own coordinator row" on private.coordinators
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Coordinator audit own access" on private.coordinator_contact_access;
create policy "Coordinator audit own access" on private.coordinator_contact_access
for select to authenticated using (coordinator_user_id = (select auth.uid()));

alter table public.blood_requests drop constraint if exists blood_requests_district_check;
alter table public.blood_requests add constraint blood_requests_district_check check (
 district is null or district in ('Thiruvananthapuram','Kollam','Pathanamthitta','Alappuzha','Kottayam','Idukki','Ernakulam','Thrissur','Palakkad','Malappuram','Kozhikode','Wayanad','Kannur','Kasaragod')
);

create or replace function public.set_request_status(p_table text,p_id uuid,p_status public.request_status)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_coordinator() then raise exception 'Coordinator access required'; end if;
 if p_table='connection_requests' then
   update public.connection_requests set status=p_status,updated_at=now() where id=p_id;
 elsif p_table='blood_requests' then
   update public.blood_requests set status=p_status,updated_at=now() where id=p_id;
 else raise exception 'Invalid request type'; end if;
 if not found then raise exception 'Request not found'; end if;
end; $$;
revoke all on function public.set_request_status(text,uuid,public.request_status) from public,anon;
grant execute on function public.set_request_status(text,uuid,public.request_status) to authenticated;

create or replace function public.deactivate_donor(p_donor_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_coordinator() then raise exception 'Coordinator access required'; end if;
 update public.student_donors set is_active=false,updated_at=now() where id=p_donor_id and is_active=true;
 if not found then raise exception 'Donor profile not found or already inactive'; end if;
end; $$;
revoke all on function public.deactivate_donor(uuid) from public,anon;
grant execute on function public.deactivate_donor(uuid) to authenticated;