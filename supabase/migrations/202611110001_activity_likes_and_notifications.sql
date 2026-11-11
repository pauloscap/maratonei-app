begin;

create table if not exists public.activity_likes (
  id uuid primary key default gen_random_uuid(),
  activity_key text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  activity_title text not null,
  created_at timestamptz not null default now(),
  constraint activity_likes_activity_user_unique unique (activity_key, user_id)
);

create index if not exists activity_likes_activity_idx
  on public.activity_likes (activity_key, created_at desc);

alter table public.activity_likes enable row level security;

drop policy if exists "Curtidas visíveis para usuários autenticados" on public.activity_likes;
create policy "Curtidas visíveis para usuários autenticados"
  on public.activity_likes for select to authenticated using (true);

alter table public.notificacoes
  add column if not exists atividade_id text,
  add column if not exists atividade_titulo text;

create or replace function public.toggle_activity_like(p_activity_key text, p_like boolean)
returns table (liked boolean, likes_count bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_owner_id uuid;
  v_title text;
  v_rows integer := 0;
begin
  if v_user_id is null then
    raise exception 'Você precisa estar autenticado para curtir.';
  end if;

  if p_activity_key like 'social-%' then
    select actor_id, title into v_owner_id, v_title
      from public.social_activities
      where id = substring(p_activity_key from 8)::uuid;
  elsif p_activity_key like 'checkin-%' then
    select user_id, 'seu check-in' into v_owner_id, v_title
      from public.checkins
      where id = substring(p_activity_key from 9)::uuid;
  elsif p_activity_key like 'serie-%' then
    select user_id, titulo into v_owner_id, v_title
      from public.user_series
      where user_id = substring(p_activity_key from 7 for 36)::uuid
        and serie_id::text = substring(p_activity_key from 44);
  elsif p_activity_key like 'filme-%' then
    select user_id, titulo into v_owner_id, v_title
      from public.user_filmes
      where user_id = substring(p_activity_key from 7 for 36)::uuid
        and filme_id::text = substring(p_activity_key from 44);
  else
    raise exception 'Atividade inválida.';
  end if;

  if v_owner_id is null then
    raise exception 'Esta atividade não está mais disponível.';
  end if;

  if p_like then
    insert into public.activity_likes (activity_key, user_id, owner_id, activity_title)
    values (p_activity_key, v_user_id, v_owner_id, coalesce(v_title, 'sua atualização'))
    on conflict (activity_key, user_id) do nothing;

    get diagnostics v_rows = row_count;

    if v_rows > 0 and v_owner_id <> v_user_id then
      insert into public.notificacoes (
        user_id, autor_id, tipo, lida, atividade_id, atividade_titulo, created_at
      ) values (
        v_owner_id, v_user_id, 'curtida', false, p_activity_key,
        coalesce(v_title, 'sua atualização'), now()
      );
    end if;
  else
    delete from public.activity_likes
      where activity_key = p_activity_key and user_id = v_user_id;
  end if;

  return query
    select exists (
      select 1 from public.activity_likes
      where activity_key = p_activity_key and user_id = v_user_id
    ),
    (select count(*) from public.activity_likes where activity_key = p_activity_key);
end;
$$;

revoke all on function public.toggle_activity_like(text, boolean) from public;
grant execute on function public.toggle_activity_like(text, boolean) to authenticated;

commit;
