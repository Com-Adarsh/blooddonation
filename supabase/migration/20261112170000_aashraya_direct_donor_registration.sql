-- Aashraya: donor registration is self-service and immediately active.
-- Coordinator approval is not part of donor onboarding. Coordinators manage
-- connection/blood-support requests and may deactivate donors when necessary.

REVOKE ALL ON FUNCTION public.set_donor_approval(uuid, text) FROM anon, authenticated;

-- Keep the legacy function definition for database compatibility, but make it
-- unreachable through the public API. New onboarding must use register_my_donor.
