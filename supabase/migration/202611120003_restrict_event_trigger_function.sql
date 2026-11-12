-- The trigger only runs through its registered DDL event trigger. Remove the unrelated API/RPC execution grants.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
