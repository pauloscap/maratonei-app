-- Protege tabelas legadas de catálogo que estavam sem RLS.
-- Mantém leitura pública de metadados e remove escrita direta pelas roles da API.

begin;

alter table public.filmes enable row level security;
create policy "Catalogo de filmes com leitura publica"
on public.filmes
for select
to anon, authenticated
using (true);

alter table public.titulos enable row level security;
drop policy if exists "Permite inserir tudo" on public.titulos;
-- Mantém as policies SELECT públicas existentes.

revoke insert, update, delete
on table public.filmes, public.titulos
from anon, authenticated;

commit;
