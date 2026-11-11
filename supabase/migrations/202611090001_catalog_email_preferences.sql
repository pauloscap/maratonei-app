-- Maratonei: preferências de novidades do catálogo e comunicados
-- Preparação em branch; não aplicar ao banco de produção sem revisão e autorização.

alter table public.notification_email_preferences
  add column if not exists email_novidades_catalogo boolean not null default false,
  add column if not exists email_comunicados boolean not null default false;

comment on column public.notification_email_preferences.email_novidades_catalogo is
  'Opt-in para novidades de séries, filmes e episódios enviadas a todos os usuários inscritos, sem filtrar pela lista pessoal.';
comment on column public.notification_email_preferences.email_comunicados is
  'Opt-in separado para comunicados gerais enviados manualmente pela administração do Maratonei.';
