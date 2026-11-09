-- Fixture PostgreSQL descartável usada somente no CI.
-- Nunca aponta para o projeto Supabase do aplicativo.
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
create table public.seguidores (
  id uuid primary key default gen_random_uuid(),
  seguidor_id uuid,
  seguindo_id uuid,
  created_at timestamptz default now()
);
create table public.comentarios_episodios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  serie_id text not null,
  temporada_numero integer not null,
  episodio_numero integer not null,
  comentario text not null,
  created_at timestamp default now()
);
create table public.series (id bigint primary key, titulo text);
create table public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  autor_id uuid,
  tipo text not null,
  serie_id text,
  temporada_numero integer,
  episodio_numero integer,
  lida boolean default false,
  created_at timestamp default now()
);
create or replace function public.notificar_novo_seguidor()
returns trigger language plpgsql as $$ begin return new; end $$;
create or replace function public.notificar_novo_comentario()
returns trigger language plpgsql as $$ begin return new; end $$;

create trigger trigger_notificar_seguidor after insert on public.seguidores
for each row execute function public.notificar_novo_seguidor();
create trigger trigger_notificar_comentario after insert on public.comentarios_episodios
for each row execute function public.notificar_novo_comentario();

\i supabase/migrations/202611020001_notification_email_preferences.sql

-- Recria os gatilhos da aplicação depois de aplicar a migration.
drop trigger if exists trigger_notificar_seguidor on public.seguidores;
create trigger trigger_notificar_seguidor after insert on public.seguidores
for each row execute function public.notificar_novo_seguidor();
drop trigger if exists trigger_notificar_comentario on public.comentarios_episodios;
create trigger trigger_notificar_comentario after insert on public.comentarios_episodios
for each row execute function public.notificar_novo_comentario();

do $$
begin
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='private' and p.proname='enqueue_notification_email'
  ) then raise exception 'email helper must live in private schema'; end if;
  if has_function_privilege('anon','private.enqueue_notification_email(uuid,uuid,uuid,text,text,integer,integer)','EXECUTE')
     or has_function_privilege('authenticated','private.enqueue_notification_email(uuid,uuid,uuid,text,text,integer,integer)','EXECUTE')
  then raise exception 'API roles must not execute private email helper'; end if;
  if exists (select 1 from pg_trigger where tgname='trigger_enqueue_notification_email') then
    raise exception 'direct notifications-table email trigger must not exist';
  end if;
end $$;

insert into auth.users(id,email) values
 ('00000000-0000-0000-0000-000000000001','recipient@example.test'),
 ('00000000-0000-0000-0000-000000000002','actor@example.test'),
 ('00000000-0000-0000-0000-000000000003','optout@example.test'),
 ('00000000-0000-0000-0000-000000000004','second-recipient@example.test');
insert into public.profiles(id,nome) values
 ('00000000-0000-0000-0000-000000000002','Ator de teste'),
 ('00000000-0000-0000-0000-000000000003','Outro ator');
insert into public.notification_email_preferences(user_id,email_seguidor,email_comentario) values
 ('00000000-0000-0000-0000-000000000001',true,true),
 ('00000000-0000-0000-0000-000000000004',false,true);

-- Evento real de seguir: uma notificação visual e um único e-mail pendente.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
insert into public.seguidores(seguidor_id,seguindo_id)
values ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001');
do $$
begin
  if (select count(*) from public.notificacoes where tipo='seguiu') <> 1 then
    raise exception 'follow event must preserve in-app notification';
  end if;
  if (select count(*) from public.notification_email_outbox where notification_type='seguiu' and status='pending') <> 1 then
    raise exception 'opted-in follow event must queue exactly one email';
  end if;
end $$;

-- Evento real de comentário: só os usuários optados recebem e-mail.
alter table public.comentarios_episodios disable trigger trigger_notificar_comentario;
insert into public.comentarios_episodios(user_id,serie_id,temporada_numero,episodio_numero,comentario)
values
 ('00000000-0000-0000-0000-000000000001','42',1,2,'Comentário inicial'),
 ('00000000-0000-0000-0000-000000000004','42',1,2,'Outro comentário');
alter table public.comentarios_episodios enable trigger trigger_notificar_comentario;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
insert into public.comentarios_episodios(user_id,serie_id,temporada_numero,episodio_numero,comentario)
values ('00000000-0000-0000-0000-000000000002','42',1,2,'Novo comentário');
do $$
begin
  if (select count(*) from public.notificacoes where tipo='comentou') <> 2 then
    raise exception 'comment event must preserve one in-app notification per previous commenter';
  end if;
  if (select count(*) from public.notification_email_outbox where notification_type='comentou') <> 1 then
    raise exception 'only opted-in comment recipient should receive a queued email';
  end if;
end $$;

-- Inserção direta de notificação não é uma origem confiável para e-mail.
insert into public.notificacoes(user_id,autor_id,tipo)
values ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','seguiu');
do $$
begin
  if (select count(*) from public.notification_email_outbox) <> 2 then
    raise exception 'forged/direct notification must not queue an email';
  end if;
end $$;
