-- Maratonei Social: policies para feed público e escrita por proprietário.
-- Esta migration é apenas uma proposta em branch/PR. Não executar em produção
-- antes de revisar grants, dados e testes com duas contas.

begin;

-- Episódios: a tabela base permanece privada por proprietário.
-- A comunidade lê somente uma projeção pública, sem colunas desnecessárias.
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

-- View com projeção explícita. O proprietário da view é o papel de migração
-- confiável; a condição assistido=true é fixa e a view não expõe linhas privadas.
create or replace view public.feed_episodios
with (security_barrier = true)
as
select
  id,
  user_id,
  serie_id,
  temporada_numero,
  episodio_numero,
  created_at
from public.user_episodios
where assistido is true;

grant select on public.feed_episodios to anon, authenticated;
revoke select on public.user_episodios from anon;


-- Filmes: todos podem ver somente registros ja_assisti.
-- O dono continua vendo e administrando também seus próprios quero_assistir.
drop policy if exists "user pode tudo filmes" on public.user_filmes;
drop policy if exists "user_is_owner" on public.user_filmes;

create policy "feed_publico_filmes_assistidos"
on public.user_filmes
for select
to anon, authenticated
using (status = 'ja_assisti' or auth.uid() = user_id);

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


-- Séries: status assistindo/maratonei são públicos.
-- quero_assistir permanece privado para terceiros.
drop policy if exists "delete_own_series" on public.user_series;
drop policy if exists "user pode tudo na sua lista" on public.user_series;
drop policy if exists "user_pode_atualizar_series" on public.user_series;
drop policy if exists "user_pode_deletar_series" on public.user_series;
drop policy if exists "user_pode_inserir_series" on public.user_series;
drop policy if exists "user_pode_tudo" on public.user_series;
drop policy if exists "user_pode_ver_suas_series" on public.user_series;

create policy "feed_publico_series_ativas"
on public.user_series
for select
to anon, authenticated
using (status in ('assistindo', 'maratonei') or auth.uid() = user_id);

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
