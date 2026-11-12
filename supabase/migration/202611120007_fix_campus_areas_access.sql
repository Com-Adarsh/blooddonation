-- Allow the public registration form to load active campus areas before sign-in.
-- Campus area names are non-sensitive reference data; donor records remain protected.
grant select on public.campus_areas to anon;

drop policy if exists "Public read active campus areas" on public.campus_areas;
create policy "Public read active campus areas"
on public.campus_areas
for select
to anon
using (active);
