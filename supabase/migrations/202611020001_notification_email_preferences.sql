-- Maratonei: preferências e fila de e-mails para notificações sociais
-- Aplicar somente após revisão e aprovação explícita.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.notification_email_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_seguidor boolean not null default false,
  email_comentario boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_email_preferences enable row level security;
revoke all on public.notification_email_preferences from anon;
grant select, insert, update on public.notification_email_preferences to authenticated;

drop policy if exists "Users can read own email notification preferences"
  on public.notification_email_preferences;
create policy "Users can read own email notification preferences"
  on public.notification_email_preferences
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own email notification preferences"
  on public.notification_email_preferences;
create policy "Users can insert own email notification preferences"
  on public.notification_email_preferences
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own email notification preferences"
  on public.notification_email_preferences;
create policy "Users can update own email notification preferences"
  on public.notification_email_preferences
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.notification_email_outbox (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null unique references public.notificacoes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient_email text not null,
  notification_type text not null check (notification_type in ('seguiu', 'comentou')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  processing_started_at timestamptz,
  sent_at timestamptz,
  last_error text
);

alter table public.notification_email_outbox enable row level security;
revoke all on public.notification_email_outbox from anon, authenticated;
grant all on public.notification_email_outbox to service_role;

-- Enfileira somente a partir dos gatilhos que registram eventos reais.
-- A tabela notificacoes continua sendo usada normalmente pelo aplicativo,
-- mas inserir nela diretamente nunca dispara um e-mail.
drop trigger if exists trigger_enqueue_notification_email on public.notificacoes;
drop function if exists private.enqueue_notification_email();

create or replace function private.enqueue_notification_email(
  p_notification_id uuid,
  p_user_id uuid,
  p_author_id uuid,
  p_notification_type text,
  p_series_id text,
  p_season_number integer,
  p_episode_number integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient text;
  author_name text;
  series_title text;
  enabled boolean := false;
  destination text;
  subject_line text;
  message_text text;
begin
  if p_notification_type not in ('seguiu', 'comentou') then
    return;
  end if;

  select case
    when p_notification_type = 'seguiu' then coalesce(pref.email_seguidor, false)
    when p_notification_type = 'comentou' then coalesce(pref.email_comentario, false)
    else false
  end
  into enabled
  from public.notification_email_preferences pref
  where pref.user_id = p_user_id;

  if not coalesce(enabled, false) then
    return;
  end if;

  select u.email into recipient
  from auth.users u
  where u.id = p_user_id;

  if recipient is null or length(trim(recipient)) = 0 then
    return;
  end if;

  select coalesce(nullif(trim(profile.nome), ''), 'Alguém')
  into author_name
  from public.profiles profile
  where profile.id = p_author_id;
  author_name := coalesce(author_name, 'Alguém');

  if p_notification_type = 'seguiu' then
    subject_line := 'Você tem um novo seguidor no Maratonei';
    message_text := author_name || ' começou a seguir você no Maratonei.';
    destination := '/perfil/' || p_author_id::text;
  else
    select series.titulo into series_title
    from public.series
    where series.id::text = p_series_id
    limit 1;

    series_title := coalesce(series_title, 'uma série');
    subject_line := 'Novo comentário no Maratonei';
    message_text := author_name || ' comentou em ' || series_title ||
      ' — T' || coalesce(p_season_number::text, '?') ||
      'E' || coalesce(p_episode_number::text, '?') || '.';
    destination := '/serie/' || coalesce(p_series_id, '');
  end if;

  insert into public.notification_email_outbox (
    notification_id, user_id, recipient_email, notification_type, payload, status
  ) values (
    p_notification_id, p_user_id, recipient, p_notification_type,
    jsonb_build_object(
      'subject', subject_line,
      'message', message_text,
      'author_name', author_name,
      'destination', destination,
      'series_title', series_title,
      'season_number', p_season_number,
      'episode_number', p_episode_number
    ),
    'pending'
  )
  on conflict (notification_id) do nothing;
end;
$$;

-- O gatilho de seguir cria a notificação visual e, em seguida,
-- enfileira o e-mail dentro da mesma transação.
create or replace function public.notificar_novo_seguidor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_notification_id uuid;
begin
  insert into public.notificacoes (user_id, autor_id, tipo)
  values (new.seguindo_id, new.seguidor_id, 'seguiu')
  returning id into new_notification_id;

  perform private.enqueue_notification_email(
    new_notification_id,
    new.seguindo_id,
    new.seguidor_id,
    'seguiu',
    null,
    null,
    null
  );

  return new;
end;
$$;

-- Mantém a regra atual: cada pessoa que já comentou no episódio
-- recebe uma notificação, exceto quem acabou de comentar.
create or replace function public.notificar_novo_comentario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient_user_id uuid;
  new_notification_id uuid;
begin
  for recipient_user_id in
    select distinct c.user_id
    from public.comentarios_episodios c
    where c.serie_id = new.serie_id
      and c.temporada_numero = new.temporada_numero
      and c.episodio_numero = new.episodio_numero
      and c.user_id is not null
      and c.user_id <> new.user_id
  loop
    insert into public.notificacoes (
      user_id, autor_id, tipo, serie_id, temporada_numero, episodio_numero
    ) values (
      recipient_user_id, new.user_id, 'comentou',
      new.serie_id, new.temporada_numero, new.episodio_numero
    )
    returning id into new_notification_id;

    perform private.enqueue_notification_email(
      new_notification_id,
      recipient_user_id,
      new.user_id,
      'comentou',
      new.serie_id,
      new.temporada_numero,
      new.episodio_numero
    );
  end loop;

  return new;
end;
$$;

-- As funções são executadas pelos gatilhos, não diretamente pela API.
revoke all on function private.enqueue_notification_email(uuid, uuid, uuid, text, text, integer, integer)
  from public, anon, authenticated;
revoke all on function public.notificar_novo_seguidor()
  from public, anon, authenticated;
revoke all on function public.notificar_novo_comentario()
  from public, anon, authenticated;

create index if not exists notification_email_outbox_pending_idx
  on public.notification_email_outbox (available_at, created_at)
  where status = 'pending';
