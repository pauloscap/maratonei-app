-- Maratonei: preferências e fila de e-mails para notificações sociais
-- Aplicar somente após revisão e aprovação explícita.

create table if not exists public.notification_email_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_seguidor boolean not null default false,
  email_comentario boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_email_preferences enable row level security;

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
  notification_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'failed')),
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  last_error text
);

alter table public.notification_email_outbox enable row level security;
revoke all on public.notification_email_outbox from anon, authenticated;
grant all on public.notification_email_outbox to service_role;

create or replace function public.enqueue_notification_email()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
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
  if new.tipo not in ('seguiu', 'comentou') then
    return new;
  end if;

  select
    case
      when new.tipo = 'seguiu' then coalesce(p.email_seguidor, false)
      when new.tipo = 'comentou' then coalesce(p.email_comentario, false)
      else false
    end
  into enabled
  from public.notification_email_preferences p
  where p.user_id = new.user_id;

  if not coalesce(enabled, false) then
    return new;
  end if;

  select u.email into recipient
  from auth.users u
  where u.id = new.user_id;

  if recipient is null or length(trim(recipient)) = 0 then
    return new;
  end if;

  select coalesce(nullif(trim(p.nome), ''), 'Alguém')
  into author_name
  from public.profiles p
  where p.id = new.autor_id;
  author_name := coalesce(author_name, 'Alguém');

  if new.tipo = 'seguiu' then
    subject_line := 'Você tem um novo seguidor no Maratonei';
    message_text := author_name || ' começou a seguir você no Maratonei.';
    destination := '/perfil/' || new.autor_id::text;
  else
    select s.titulo into series_title
    from public.series s
    where s.id::text = new.serie_id
    limit 1;

    series_title := coalesce(series_title, 'uma série');
    subject_line := 'Novo comentário no Maratonei';
    message_text := author_name || ' comentou em ' || series_title ||
      ' — T' || coalesce(new.temporada_numero::text, '?') ||
      'E' || coalesce(new.episodio_numero::text, '?') || '.';
    destination := '/serie/' || coalesce(new.serie_id, '');
  end if;

  insert into public.notification_email_outbox (
    notification_id, user_id, recipient_email, notification_type,
    payload, status
  ) values (
    new.id, new.user_id, recipient, new.tipo,
    jsonb_build_object(
      'subject', subject_line,
      'message', message_text,
      'author_name', author_name,
      'destination', destination,
      'series_title', series_title,
      'season_number', new.temporada_numero,
      'episode_number', new.episodio_numero
    ),
    'pending'
  )
  on conflict (notification_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trigger_enqueue_notification_email on public.notificacoes;
create trigger trigger_enqueue_notification_email
after insert on public.notificacoes
for each row execute function public.enqueue_notification_email();

create index if not exists notification_email_outbox_pending_idx
  on public.notification_email_outbox (available_at, created_at)
  where status = 'pending';
