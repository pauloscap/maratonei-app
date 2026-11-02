-- Maratonei Social: leitura pública por views limitadas e escrita por proprietário.
-- Proposta em branch/PR. Não executar em produção antes de revisar e testar.

begin;

-- Episódios legados: somente o proprietário pode ler e alterar.
alter table public.user_episodios enable row level security;

drop policy if exists "Episódios são públicos no feed" on public.user_episodios;
drop policy if exists "Permitir tudo por enquanto" on public.user_episodios;
drop policy if exists "Usuários deletam apenas seus episódios" on public.user_episodios;
drop policy if exists "Usuários inserem apenas seus episódios" on public.user_episodios;
drop policy if exists "Usuários veem apenas seus episódios" on public.user_episodios;
drop policy if exists "libera user_episodios" on public.user_episodios;

create policy episodios_owner_all
on public.user_episodios
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

revoke all on public.user_episodios from anon, public;
grant select, insert, update, delete on public.user_episodios to authenticated;

-- Filmes: tabela-base privada por proprietário.
alter table public.user_filmes enable row level security;
drop policy if exists "user pode tudo filmes" on public.user_filmes;
drop policy if exists "user_is_owner" on public.user_filmes;
drop policy if exists "filmes_leitura_propria" on public.user_filmes;
drop policy if exists "filmes_feed_publico" on public.user_filmes;
drop policy if exists "filmes_insercao_propria" on public.user_filmes;
drop policy if exists "filmes_atualizacao_propria" on public.user_filmes;
drop policy if exists "filmes_exclusao_propria" on public.user_filmes;
drop policy if exists filmes_owner_all on public.user_filmes;

create policy filmes_owner_all
on public.user_filmes
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

revoke select on public.user_filmes from anon, public;
grant select, insert, update, delete on public.user_filmes to authenticated;

drop view if exists public.feed_filmes;
create view public.feed_filmes
with (security_barrier = true)
as
select id, user_id, filme_id, titulo, img, updated_at
from public.user_filmes
where status = 'ja_assisti';

alter view public.feed_filmes owner to postgres;
revoke all on public.feed_filmes from public;
grant select on public.feed_filmes to anon, authenticated;

-- Séries: tabela-base privada por proprietário.
alter table public.user_series enable row level security;
drop policy if exists "delete_own_series" on public.user_series;
drop policy if exists "user pode tudo na sua lista" on public.user_series;
drop policy if exists "user_pode_atualizar_series" on public.user_series;
drop policy if exists "user_pode_deletar_series" on public.user_series;
drop policy if exists "user_pode_inserir_series" on public.user_series;
drop policy if exists "user_pode_tudo" on public.user_series;
drop policy if exists "user_pode_ver_suas_series" on public.user_series;
drop policy if exists "series_leitura_propria" on public.user_series;
drop policy if exists "series_feed_publico" on public.user_series;
drop policy if exists "series_insercao_propria" on public.user_series;
drop policy if exists "series_atualizacao_propria" on public.user_series;
drop policy if exists "series_exclusao_propria" on public.user_series;
drop policy if exists series_owner_all on public.user_series;

create policy series_owner_all
on public.user_series
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

revoke select on public.user_series from anon, public;
grant select, insert, update, delete on public.user_series to authenticated;

drop view if exists public.feed_series;
create view public.feed_series
with (security_barrier = true)
as
select
  id,
  user_id,
  serie_id,
  titulo,
  img,
  status,
  jsonb_array_length(coalesce(eps_vistos, '[]'::jsonb)) as episodios_vistos,
  updated_at
from public.user_series
where status in ('assistindo', 'maratonei');

alter view public.feed_series owner to postgres;
revoke all on public.feed_series from public;
grant select on public.feed_series to anon, authenticated;

-- Comentários e avaliações permanecem públicos para leitura.
-- WITH CHECK impede que um autor transfira a propriedade de uma linha via UPDATE.
drop policy if exists "Usuário edita próprio comentário" on public.comentarios_episodios;
create policy "Usuário edita próprio comentário"
on public.comentarios_episodios
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Usuários editam suas avaliações" on public.user_avaliacoes;
create policy "Usuários editam suas avaliações"
on public.user_avaliacoes
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

commit;
