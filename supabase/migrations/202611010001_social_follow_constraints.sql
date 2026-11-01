-- Maratonei Social: integridade das relações de seguir.
-- Revisado contra os dados atuais: não há pares duplicados, auto-seguimentos ou IDs nulos.
-- Aplicar somente após validar esta migration no fluxo de publicação do projeto.

begin;

alter table public.seguidores
  alter column seguidor_id set not null,
  alter column seguindo_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.seguidores'::regclass
      and conname = 'seguidores_unicos_por_par'
  ) then
    alter table public.seguidores
      add constraint seguidores_unicos_por_par
      unique (seguidor_id, seguindo_id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.seguidores'::regclass
      and conname = 'seguidores_nao_pode_seguir_a_si_mesmo'
  ) then
    alter table public.seguidores
      add constraint seguidores_nao_pode_seguir_a_si_mesmo
      check (seguidor_id <> seguindo_id);
  end if;
end
$$;

create index if not exists idx_seguidores_seguindo_id
  on public.seguidores (seguindo_id);

drop policy if exists "Usuário pode seguir" on public.seguidores;
create policy "Usuário pode seguir"
  on public.seguidores
  for insert
  to authenticated
  with check (
    auth.uid() = seguidor_id
    and seguidor_id <> seguindo_id
  );

commit;
