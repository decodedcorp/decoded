-- #151 Security hardening: revoke anon EXECUTE on admin-only RPCs. (user-approved 2026-04-17)
REVOKE EXECUTE ON FUNCTION public.update_magazine_status(UUID, VARCHAR, UUID, TEXT)
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.is_admin(UUID) FROM anon;
