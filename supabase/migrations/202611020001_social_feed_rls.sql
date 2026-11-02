-- Maratonei Social: leitura pública por projeções seguras e escrita por proprietário.
-- Proposta em branch/PR. Não executar em produção antes de revisar e testar.

begin;

-- Episódios: a tabela legada permanece privada por proprietário.
-- O app atual guarda o progresso dos episódios em user_series.eps_vistos.
alter table public.user_episodios enable row level security;

drop policy if exists "Episódios são públicos no feed" on public.user_episodios;
drop policy if exists "Permitir tudo por enquanto" on public.user_episodios;
drop policy if exists "Usuários deletam apenas seus episódios" on public.user_episodios;
drop policy if exists "Usuários inserem apenas seus episódios" on public.user_episodios;
drop policy if exists "Usuários veem apenas seus episódios" on public.user_episodios;
drop policy if exists "libera user_episodios" on public.user_episodios;

create policy "episodios_leitura_propria"
on public.user_episodios
for select
to authenticated
using (auth.uid() = user_id);

create policy "episodios_insercao_propria"
on public.user_episodios
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "episodios_atualizacao_propria"
on public.user_episodios
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "episodios_exclusao_propria"
on public.user_episodios
for delete
to authenticated
using (auth.uid() = user_id);

revoke select on public.user_episodios from anon;


-- Filmes: a tabela base é privada por proprietário.
-- A view publica somente os campos necessários para atividades "ja_assisti".
drop policy if exists "user pode tudo filmes" on public.user_filmes;
drop policy if exists "user_is_owner" on public.user_filmes;

create policy "filmes_leitura_propria"
on public.user_filmes
for select
to authenticated
using (auth.uid() = user_id);

create policy "filmes_insercao_propria"
on public.user_filmes
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "filmes_atualizacao_propria"
on public.user_filmes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "filmes_exclusao_propria"
on public.user_filmes
for delete
to authenticated
using (auth.uid() = user_id);

create or replace view public.feed_filmes
with (security_barrier = true)
as
select id, user_id, filme_id, titulo, img, status, updated_at
from public.user_filmes
where status = 'ja_assisti';

grant select on public.feed_filmes to anon, authenticated;
revoke select on public.user_filmes from anon;


-- Séries: a tabela base é privada por proprietário.
-- A view publica somente status assistindo/maratonei e os campos do feed.
drop policy if exists "delete_own_series" on public.user_series;
drop policy if exists "user pode tudo na sua lista" on public.user_series;
drop policy if exists "user_pode_atualizar_series" on public.user_series;
drop policy if exists "user_pode_deletar_series" on public.user_series;
drop policy if exists "user_pode_inserir_series" on public.user_series;
drop policy if exists "user_pode_tudo" on public.user_series;
drop policy if exists "user_pode_ver_suas_series" on public.user_series;

create policy "series_leitura_propria"
on public.user_series
for select
to authenticated
using (auth.uid() = user_id);

create policy "series_insercao_propria"
on public.user_series
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "series_atualizacao_propria"
on public.user_series
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "series_exclusao_propria"
on public.user_series
for delete
to authenticated
using (auth.uid() = user_id);

create or replace view public.feed_series
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

-- A view é intencionalmente uma projeção pública filtrada, executada pelo
-- proprietário da view; não expõe a tabela base nem os status privados.
alter view public.feed_series owner to postgres;
grant select on public.feed_series to anon, authenticated;
revoke select on public.user_series from anon;


-- Comentários e avaliações já têm leitura pública.
-- Reforça WITH CHECK para impedir que o autor transfira a propriedade
-- de uma linha durante UPDATE.
drop policy if exists "Usuário edita próprio comentário" on public.comentarios_episodios;
create policy "Usuário edita próprio comentário"
on public.comentarios_episodios
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Usuários editam suas avaliações" on public.user_avaliacoes;
create policy "Usuários editam suas avaliações"
on public.user_avaliacoes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

commit;
