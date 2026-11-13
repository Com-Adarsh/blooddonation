-- Aashraya: the donor directory is read by authenticated students under RLS.
-- The table-level SELECT privilege must exist in addition to the row policy.
grant select on table public.student_donors to authenticated;
