-- Restringe execução direta de funções internas e fecha o default ACL.
-- Funções de trigger/event trigger continuam sendo chamadas pelos seus gatilhos.
-- Novas RPCs públicas deverão receber GRANT EXECUTE explícito e revisado.

begin;

-- Funções SECURITY DEFINER usam search_path fixo; as referências de
-- tabela já estão qualificadas no corpo das funções.
alter function public.get_profiles_count() set search_path = pg_catalog;
alter function public.handle_new_user() set search_path = pg_catalog;

revoke execute on function public.get_profiles_count() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- EXECUTE é concedido a PUBLIC por padrão no nível global. Um REVOKE
-- apenas no schema não remove essa concessão global herdada.
alter default privileges for role postgres
revoke execute on functions from public, anon, authenticated;

alter default privileges for role supabase_admin
revoke execute on functions from public, anon, authenticated;

-- Defesa explícita para funções criadas no schema public.
alter default privileges for role postgres in schema public
revoke execute on functions from public, anon, authenticated;

alter default privileges for role supabase_admin in schema public
revoke execute on functions from public, anon, authenticated;

commit;
