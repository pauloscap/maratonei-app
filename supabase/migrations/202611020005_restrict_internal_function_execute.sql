-- Restringe execução direta de funções internas e fecha o default ACL.
-- Funções de trigger/event trigger continuam sendo chamadas pelos seus gatilhos.
-- Novas RPCs públicas deverão receber GRANT EXECUTE explícito e revisado.

begin;

revoke execute on function public.get_profiles_count() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

alter default privileges for role postgres in schema public
revoke execute on functions from public, anon, authenticated;

alter default privileges for role supabase_admin in schema public
revoke execute on functions from public, anon, authenticated;

commit;
