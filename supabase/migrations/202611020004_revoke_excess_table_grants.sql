-- Remove privilégios administrativos desnecessários das roles da API.
-- Mantém SELECT/INSERT/UPDATE/DELETE atuais; a revisão granular desses
-- privilégios será feita após o mapa completo de consumidores do app.

begin;

revoke truncate, references, trigger, maintain
on all tables in schema public
from anon, authenticated;

-- Evita que novas tabelas criadas por esses proprietários recebam novamente
-- privilégios administrativos para as roles públicas da API.
alter default privileges for role postgres in schema public
revoke truncate, references, trigger, maintain on tables
from anon, authenticated;

alter default privileges for role supabase_admin in schema public
revoke truncate, references, trigger, maintain on tables
from anon, authenticated;

-- Usuários anônimos precisam apenas de leitura pública sujeita a RLS.
-- Toda escrita do produto exige autenticação; o catálogo administrativo usa service_role.
revoke insert, update, delete
on all tables in schema public
from anon;

alter default privileges for role postgres in schema public
revoke insert, update, delete on tables from anon;

alter default privileges for role supabase_admin in schema public
revoke insert, update, delete on tables from anon;

-- Nas tabelas de atividade, anon consulta somente as colunas que
-- compõem as views públicas. Revogar SELECT em nível de tabela também
-- remove grants SELECT por coluna anteriores.
revoke select on table public.user_filmes, public.user_series from anon;

grant select (id, user_id, filme_id, titulo, img, status, updated_at)
on table public.user_filmes to anon;

grant select (id, user_id, serie_id, titulo, img, status, eps_vistos, updated_at)
on table public.user_series to anon;

-- Sequências: não conceder USAGE em massa. O helper legado de inclusão
-- de séries usa series_id_seq; as demais sequências não têm consumidor
-- cliente confirmado e permanecem restritas.
revoke all on all sequences in schema public from anon, authenticated;
grant usage on sequence public.series_id_seq to authenticated;

alter default privileges for role postgres in schema public
revoke all on sequences from anon, authenticated;

alter default privileges for role supabase_admin in schema public
revoke all on sequences from anon, authenticated;

commit;
