-- Consolidação de políticas do catálogo e dos perfis públicos.
-- Não altera dados nem grants globais. Proposta isolada para revisão.

begin;

-- Catálogo de séries e temporadas é público para leitura.
-- Escrita do catálogo deve ocorrer por rotas/serviços confiáveis.
drop policy if exists "Permite tudo em series" on public.series;
drop policy if exists "libera series" on public.series;
-- Mantém "Qualquer um pode ler" (SELECT true).

drop policy if exists "libera temporadas" on public.temporadas;
-- Mantém "Permitir leitura pública" (SELECT true).


-- A tabela legada perfis contém apenas os campos públicos usados pelo app:
-- user_id, nome, moldura, xp e avatar_url.
-- A policy ALL existente continua limitando INSERT/UPDATE/DELETE ao proprietário.
create policy "Perfis públicos para visualização"
on public.perfis
for select
to anon, authenticated
using (true);


-- Perfil principal: mantém leitura pública e corrige a validação de UPDATE
-- para impedir que o registro seja transferido para outro id.
drop policy if exists "Usuário edita seu perfil" on public.profiles;
create policy "Usuário edita seu perfil"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

commit;
