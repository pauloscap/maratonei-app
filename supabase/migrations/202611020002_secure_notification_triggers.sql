-- Protege a criação de notificações sem interromper os gatilhos existentes.
-- Proposta isolada: revisar antes de qualquer aplicação em produção.

begin;

-- Gatilhos passam a executar como o proprietário da função (postgres),
-- com search_path fixo e objetos referenciados pelo schema.
create or replace function public.notificar_novo_seguidor()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $function$
begin
  insert into public.notificacoes (user_id, autor_id, tipo)
  values (new.seguindo_id, new.seguidor_id, 'seguiu');

  return new;
end;
$function$;

create or replace function public.notificar_novo_comentario()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $function$
begin
  -- Notifica os demais participantes que já comentaram neste episódio.
  insert into public.notificacoes (
    user_id,
    autor_id,
    tipo,
    serie_id,
    temporada_numero,
    episodio_numero
  )
  select distinct
    c.user_id,
    new.user_id,
    'comentou',
    new.serie_id,
    new.temporada_numero,
    new.episodio_numero
  from public.comentarios_episodios as c
  where c.serie_id = new.serie_id
    and c.temporada_numero = new.temporada_numero
    and c.episodio_numero = new.episodio_numero
    and c.user_id is not null
    and c.user_id <> new.user_id;

  return new;
end;
$function$;

-- Funções de trigger não devem ser invocáveis diretamente via RPC.
-- Os gatilhos já criados continuam associados às mesmas funções.
revoke all on function public.notificar_novo_seguidor() from public, anon, authenticated;
revoke all on function public.notificar_novo_comentario() from public, anon, authenticated;

-- Retira a criação arbitrária de notificações por clientes.
drop policy if exists "Sistema cria notificação" on public.notificacoes;
revoke insert on table public.notificacoes from anon, authenticated;

-- O destinatário pode atualizar apenas a própria notificação e não pode
-- alterar user_id para transferi-la a outra conta.
drop policy if exists "Usuário marca como lida" on public.notificacoes;
create policy "Usuário marca como lida"
on public.notificacoes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

commit;
