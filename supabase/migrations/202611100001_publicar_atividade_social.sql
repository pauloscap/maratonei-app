-- Torna públicas as atividades sociais que os usuários decidiram compartilhar.
-- A escrita continua restrita às políticas de propriedade já existentes.
begin;

drop policy if exists "Atividades de check-in são públicas" on public.checkins;
create policy "Atividades de check-in são públicas"
  on public.checkins
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Listas públicas de séries" on public.user_series;
create policy "Listas públicas de séries"
  on public.user_series
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Listas públicas de filmes" on public.user_filmes;
create policy "Listas públicas de filmes"
  on public.user_filmes
  for select
  to anon, authenticated
  using (true);

commit;
