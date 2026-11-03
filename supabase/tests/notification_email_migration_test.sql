-- Ephemeral PostgreSQL test fixture for the notification-email migration.
-- This runs only in CI's disposable PostgreSQL service; it never targets the app project.
create extension if not exists pgcrypto;
create schema if not exists auth;
create schema if not exists private;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
end $$;
create table auth.users (id uuid primary key, email text);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
create table public.profiles (id uuid primary key, nome text);
create table public.seguidores (seguidor_id uuid, seguindo_id uuid);
create table public.comentarios_episodios (
  user_id uuid, serie_id text, temporada_numero integer, episodio_numero integer
);
create table public.series (id bigint primary key, titulo text);
create table public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  autor_id uuid not null,
  tipo text not null,
  serie_id text,
  temporada_numero integer,
  episodio_numero integer
);
\i supabase/migrations/202611020001_notification_email_preferences.sql

do $$
begin
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private' and p.proname = 'enqueue_notification_email'
  ) then raise exception 'trigger function must live in private schema'; end if;
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'enqueue_notification_email'
  ) then raise exception 'trigger function must not be in public schema'; end if;
  if has_function_privilege('anon', 'private.enqueue_notification_email()', 'EXECUTE')
     or has_function_privilege('authenticated', 'private.enqueue_notification_email()', 'EXECUTE')
  then raise exception 'API roles must not execute trigger function'; end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'notification_email_outbox'
      and column_name = 'processing_started_at'
  ) then raise exception 'processing_started_at column missing'; end if;
end $$;

-- Exercise the trigger with opt-in enabled; no Gmail/network action exists in this fixture.
insert into auth.users(id,email) values
 ('00000000-0000-0000-0000-000000000001','recipient@example.test'),
 ('00000000-0000-0000-0000-000000000002','actor@example.test'),
 ('00000000-0000-0000-0000-000000000003','optout@example.test');
insert into public.profiles(id,nome) values
 ('00000000-0000-0000-0000-000000000002','Ator de teste');
insert into public.seguidores(seguidor_id,seguindo_id) values
 ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001'),
 ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003');
insert into public.notification_email_preferences(user_id,email_seguidor)
values ('00000000-0000-0000-0000-000000000001',true);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
insert into public.notificacoes(user_id,autor_id,tipo)
values ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','seguiu');
do $$
begin
  if (select count(*) from public.notification_email_outbox) <> 1 then
    raise exception 'expected exactly one queued email for opted-in follower event';
  end if;
  if (select status from public.notification_email_outbox limit 1) <> 'pending' then
    raise exception 'outbox item should begin pending';
  end if;
end $$;

-- Opt-out/default-off recipient must not receive an outbox row.
insert into public.notificacoes(user_id,autor_id,tipo)
values ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000002','seguiu');
do $$
begin
  if (select count(*) from public.notification_email_outbox) <> 1 then
    raise exception 'default-off recipient should not create an outbox row';
  end if;
end $$;
