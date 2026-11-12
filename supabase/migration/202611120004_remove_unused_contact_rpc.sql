-- The UI uses atomic registration; disable an unused duplicate contact-write endpoint.
revoke all on function public.save_my_donor_contact(uuid, text) from public, anon, authenticated;

-- The helper already performs its own SECURITY DEFINER lookup and checks auth.uid().
create or replace function public.is_campus_coordinator()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select private.is_coordinator(); $$;
revoke all on function public.is_campus_coordinator() from public, anon;
grant execute on function public.is_campus_coordinator() to authenticated;
