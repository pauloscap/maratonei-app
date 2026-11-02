-- Feed social público com projeções limitadas e progresso detalhado de episódios.
-- Esta migration é proposta em branch; não foi executada no Supabase.
begin;

-- Progresso individual: novos eventos recebem timestamp real. Registros antigos
-- em user_series.eps_vistos não são convertidos, pois não guardam data por episódio.
create table if not exists public.user_episode_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  serie_id text not null,
  episode_id text not null,
  season_number integer not null check (season_number > 0),
  episode_number integer not null check (episode_number > 0),
  episode_title text not null default '',
  source text not null default 'live' check (source in ('live', 'legacy')),
  watched_at timestamptz,
  primary key (user_id, serie_id, episode_id)
);

-- O timestamp vem do banco, não do relógio informado pelo navegador.
create or replace function public.set_episode_progress_watched_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.source = 'live' then
    new.watched_at := pg_catalog.now();
  else
    new.watched_at := null;
  end if;
  return new;
end;
$$;

revoke all on function public.set_episode_progress_watched_at() from public, anon, authenticated;
drop trigger if exists set_episode_progress_watched_at on public.user_episode_progress;
create trigger set_episode_progress_watched_at
before insert or update on public.user_episode_progress
for each row execute function public.set_episode_progress_watched_at();

alter table public.user_episode_progress enable row level security;
drop policy if exists episode_progress_select_own on public.user_episode_progress;
drop policy if exists episode_progress_insert_own on public.user_episode_progress;
drop policy if exists episode_progress_update_own on public.user_episode_progress;
drop policy if exists episode_progress_delete_own on public.user_episode_progress;

create policy episode_progress_select_own on public.user_episode_progress
  for select to authenticated using (auth.uid() = user_id);
create policy episode_progress_insert_own on public.user_episode_progress
  for insert to authenticated with check (auth.uid() = user_id);
create policy episode_progress_update_own on public.user_episode_progress
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy episode_progress_delete_own on public.user_episode_progress
  for delete to authenticated using (auth.uid() = user_id);

revoke all on public.user_episode_progress from anon, public;
grant select, insert, update, delete on public.user_episode_progress to authenticated;

-- As tabelas-base continuam com RLS e escrita por proprietário. A comunidade
-- lê somente views com colunas explicitamente permitidas.
alter table public.checkins enable row level security;
alter table public.user_filmes enable row level security;
alter table public.user_series enable row level security;

-- Check-ins permanecem privados e disponíveis apenas ao próprio usuário.
drop policy if exists checkins_owner_all on public.checkins;
drop policy if exists "user só vê o seu" on public.checkins;
create policy checkins_owner_all on public.checkins
  for all to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Filmes: remove policies permissivas antigas e mantém operações do proprietário.
drop policy if exists "user pode tudo filmes" on public.user_filmes;
drop policy if exists "user_is_owner" on public.user_filmes;
-- Também remove as policies públicas criadas pela migration social anterior,
-- pois a publicação agora ocorre somente pelas views com colunas limitadas.
drop policy if exists "filmes_leitura_propria" on public.user_filmes;
drop policy if exists "filmes_feed_publico" on public.user_filmes;
drop policy if exists "filmes_insercao_propria" on public.user_filmes;
drop policy if exists "filmes_atualizacao_propria" on public.user_filmes;
drop policy if exists "filmes_exclusao_propria" on public.user_filmes;
drop policy if exists filmes_owner_all on public.user_filmes;
create policy filmes_owner_all on public.user_filmes
  for all to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Séries: remove policies permissivas antigas e mantém operações do proprietário.
drop policy if exists "delete_own_series" on public.user_series;
drop policy if exists "user pode tudo na sua lista" on public.user_series;
drop policy if exists "user_pode_atualizar_series" on public.user_series;
drop policy if exists "user_pode_deletar_series" on public.user_series;
drop policy if exists "user_pode_inserir_series" on public.user_series;
drop policy if exists "user_pode_tudo" on public.user_series;
drop policy if exists "user_pode_ver_suas_series" on public.user_series;
-- Remove também as policies públicas da migration social anterior.
drop policy if exists "series_leitura_propria" on public.user_series;
drop policy if exists "series_feed_publico" on public.user_series;
drop policy if exists "series_insercao_propria" on public.user_series;
drop policy if exists "series_atualizacao_propria" on public.user_series;
drop policy if exists "series_exclusao_propria" on public.user_series;
drop policy if exists series_owner_all on public.user_series;
create policy series_owner_all on public.user_series
  for all to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Nenhuma role de API consulta diretamente as tabelas de atividade como visitante.
revoke all on public.comentarios_episodios, public.user_avaliacoes from anon, public;
grant select on public.comentarios_episodios, public.user_avaliacoes to authenticated;
revoke all on public.checkins, public.user_filmes, public.user_series from anon, public;
grant select, insert, update, delete on public.checkins, public.user_filmes, public.user_series to authenticated;

drop view if exists public.feed_episode_progress;
drop view if exists public.feed_episode_comments;
drop view if exists public.feed_episode_ratings;
drop view if exists public.feed_checkins;
drop view if exists public.feed_filmes;
drop view if exists public.feed_series;

-- Views executam com os privilégios do proprietário (security_invoker=false por
-- padrão); pertencentes a postgres, publicam somente os campos abaixo e contornam
-- RLS apenas nessa projeção.
create view public.feed_filmes
with (security_barrier = true)
as
select id, user_id, filme_id, titulo, img, updated_at
from public.user_filmes
where status = 'ja_assisti';

create view public.feed_series
with (security_barrier = true)
as
select id, user_id, serie_id, titulo, img, status,
       jsonb_array_length(coalesce(eps_vistos, '[]'::jsonb)) as episodios_vistos,
       updated_at
from public.user_series
where status in ('assistindo', 'maratonei', 'ja_assisti');

create view public.feed_episode_progress
with (security_barrier = true)
as
select p.user_id, p.serie_id, p.episode_id,
       p.season_number, p.episode_number, p.episode_title, p.source, p.watched_at,
       s.titulo as series_title, s.img as series_img
from public.user_episode_progress p
join public.user_series s
  on s.user_id = p.user_id and s.serie_id = p.serie_id
where s.status in ('assistindo', 'maratonei', 'ja_assisti');

-- Avaliações e comentários de episódios também são atividades públicas.
-- As views evitam expor colunas extras das tabelas originais.
create view public.feed_episode_comments
with (security_barrier = true)
as
select c.id, c.user_id, c.serie_id, c.temporada_numero,
       c.episodio_numero, c.comentario, c.created_at,
       us.titulo as series_title
from public.comentarios_episodios c
left join public.user_series us
  on us.user_id = c.user_id and us.serie_id = c.serie_id;

create view public.feed_episode_ratings
with (security_barrier = true)
as
select a.id, a.user_id, a.serie_id, a.temporada_numero,
       a.episodio_numero, a.nota, a.comentario, a.created_at,
       s.titulo as series_title
from public.user_avaliacoes a
left join public.series s on s.id = a.serie_id;

alter view public.feed_filmes owner to postgres;
alter view public.feed_series owner to postgres;
alter view public.feed_episode_progress owner to postgres;
alter view public.feed_episode_comments owner to postgres;
alter view public.feed_episode_ratings owner to postgres;

revoke all on public.feed_filmes, public.feed_series,
  public.feed_episode_progress, public.feed_episode_comments,
  public.feed_episode_ratings from public;
grant select on public.feed_filmes, public.feed_series,
  public.feed_episode_progress, public.feed_episode_comments,
  public.feed_episode_ratings to anon, authenticated;

commit;
