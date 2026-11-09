-- Maratonei: eventos de catálogo e deduplicação de e-mails
-- Preparação em branch; não aplicar em produção sem revisão e autorização.

alter table public.notification_email_outbox
  add column if not exists event_key text;

alter table public.notification_email_outbox
  drop constraint if exists notification_email_outbox_notification_type_check;

alter table public.notification_email_outbox
  add constraint notification_email_outbox_notification_type_check
  check (notification_type in ('seguiu', 'comentou', 'boas_vindas', 'catalogo'));

-- Um evento de catálogo só pode gerar um e-mail por usuário.
create unique index if not exists notification_email_outbox_user_event_key_uidx
  on public.notification_email_outbox (user_id, event_key);

create table if not exists public.notification_catalog_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  event_type text not null check (event_type in ('nova_serie', 'novo_filme', 'novo_episodio')),
  external_id text not null,
  title text not null,
  release_date date,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.notification_catalog_events enable row level security;
revoke all on public.notification_catalog_events from public, anon, authenticated;
grant all on public.notification_catalog_events to service_role;

comment on table public.notification_catalog_events is
  'Eventos detectados no TMDB. event_key impede que o mesmo lançamento seja anunciado novamente.';
comment on column public.notification_email_outbox.event_key is
  'Chave do evento externo; combinada com user_id evita e-mails duplicados por usuário.';
