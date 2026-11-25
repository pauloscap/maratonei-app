-- Maratonei: e-mail transacional de boas-vindas no primeiro cadastro.
-- Preparação em branch; não aplicar em produção sem revisão e autorização.

alter table public.notification_email_outbox
  alter column notification_id drop not null;

alter table public.notification_email_outbox
  drop constraint if exists notification_email_outbox_notification_type_check;

alter table public.notification_email_outbox
  add constraint notification_email_outbox_notification_type_check
  check (notification_type in ('seguiu', 'comentou', 'boas_vindas'));

create or replace function private.enqueue_welcome_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null or length(trim(new.email)) = 0 then
    return new;
  end if;

  insert into public.notification_email_outbox (
    notification_id, user_id, recipient_email, notification_type, payload, status
  ) values (
    null,
    new.id,
    new.email,
    'boas_vindas',
    jsonb_build_object(
      'subject', 'Bem-vindo ao Maratonei!',
      'message', 'Sua próxima maratona começa aqui. Organize o que assiste, acompanhe episódios e descubra novas histórias.',
      'destination', '/'
    ),
    'pending'
  );

  return new;
end;
$$;

revoke all on function private.enqueue_welcome_email()
  from public, anon, authenticated;

drop trigger if exists trigger_enqueue_welcome_email on auth.users;
create trigger trigger_enqueue_welcome_email
  after insert on auth.users
  for each row execute function private.enqueue_welcome_email();
