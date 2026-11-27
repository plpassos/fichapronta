-- FichaPronta: EDIÇÃO E EXCLUSÃO DE EVOLUÇÕES E AVALIAÇÕES, COM HISTÓRICO
-- Rode no Supabase > SQL Editor depois dos outros arquivos (pode rodar mais de uma vez).
--
-- - Toda edição guarda a versão anterior (quem, quando, o que era).
-- - "Excluir" não apaga: marca como excluído, exige motivo e guarda no histórico.
-- - O histórico é gravado pelo próprio banco: não há como editar sem deixar registro.

alter table public.evolucoes add column if not exists editado_em timestamptz;
alter table public.evolucoes add column if not exists excluido_em timestamptz;
alter table public.evolucoes add column if not exists excluido_motivo text;
alter table public.avaliacoes add column if not exists editado_em timestamptz;
alter table public.avaliacoes add column if not exists excluido_em timestamptz;
alter table public.avaliacoes add column if not exists excluido_motivo text;

create table if not exists public.registros_historico (
  id uuid primary key default gen_random_uuid(),
  tabela text not null,                 -- 'evolucoes' ou 'avaliacoes'
  registro_id uuid not null,
  profissional_id uuid not null references public.profiles(id) on delete cascade,
  acao text not null,                   -- 'edicao' ou 'exclusao'
  antes jsonb not null,                 -- o registro como era antes da mudança
  motivo text,
  feito_por uuid,
  em timestamptz not null default now()
);
create index if not exists registros_historico_registro_idx on public.registros_historico (registro_id);

-- O profissional só lê o próprio histórico; ninguém grava, altera ou apaga por fora
alter table public.registros_historico enable row level security;
drop policy if exists "historico: dono le" on public.registros_historico;
create policy "historico: dono le" on public.registros_historico for select
  using (auth.uid() = profissional_id);

create or replace function public.registrar_historico()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.excluido_em is not null then
    raise exception 'Este registro foi excluído e não pode ser alterado.';
  end if;
  if new.excluido_em is not null then
    if coalesce(btrim(new.excluido_motivo), '') = '' then
      raise exception 'Informe o motivo da exclusão.';
    end if;
    insert into public.registros_historico (tabela, registro_id, profissional_id, acao, antes, motivo, feito_por)
    values (tg_table_name, old.id, old.profissional_id, 'exclusao', to_jsonb(old), btrim(new.excluido_motivo), auth.uid());
    new.excluido_em := now();
  else
    insert into public.registros_historico (tabela, registro_id, profissional_id, acao, antes, feito_por)
    values (tg_table_name, old.id, old.profissional_id, 'edicao', to_jsonb(old), auth.uid());
    new.editado_em := now();
  end if;
  -- o que identifica o registro não muda
  new.id := old.id;
  new.ficha_id := old.ficha_id;
  new.profissional_id := old.profissional_id;
  new.created_at := old.created_at;
  return new;
end $$;

drop trigger if exists evolucoes_historico on public.evolucoes;
create trigger evolucoes_historico before update on public.evolucoes
  for each row execute function public.registrar_historico();
drop trigger if exists avaliacoes_historico on public.avaliacoes;
create trigger avaliacoes_historico before update on public.avaliacoes
  for each row execute function public.registrar_historico();

-- Sem exclusão de verdade: o profissional lê, cria e altera (a exclusão é uma alteração)
drop policy if exists "evolucoes: dono" on public.evolucoes;
drop policy if exists "evolucoes: dono le" on public.evolucoes;
drop policy if exists "evolucoes: dono cria" on public.evolucoes;
drop policy if exists "evolucoes: dono altera" on public.evolucoes;
create policy "evolucoes: dono le" on public.evolucoes for select using (auth.uid() = profissional_id);
create policy "evolucoes: dono cria" on public.evolucoes for insert with check (auth.uid() = profissional_id);
create policy "evolucoes: dono altera" on public.evolucoes for update
  using (auth.uid() = profissional_id) with check (auth.uid() = profissional_id);

drop policy if exists "avaliacoes: dono" on public.avaliacoes;
drop policy if exists "avaliacoes: dono le" on public.avaliacoes;
drop policy if exists "avaliacoes: dono cria" on public.avaliacoes;
drop policy if exists "avaliacoes: dono altera" on public.avaliacoes;
create policy "avaliacoes: dono le" on public.avaliacoes for select using (auth.uid() = profissional_id);
create policy "avaliacoes: dono cria" on public.avaliacoes for insert with check (auth.uid() = profissional_id);
create policy "avaliacoes: dono altera" on public.avaliacoes for update
  using (auth.uid() = profissional_id) with check (auth.uid() = profissional_id);

-- Link do paciente: sessões excluídas não aparecem
create or replace function public.evolucao_publica(p_token text, p_nasc text)
returns json language sql security definer set search_path = public as $$
  select json_build_object(
    'paciente_nome', f.paciente_nome,
    'profissional', json_build_object('nome', p.nome, 'profissao', p.profissao),
    'evolucoes', coalesce((
      select json_agg(json_build_object(
        'data', e.data,
        'dor_antes', case when coalesce((f.compartilhar->>'dor')::boolean, false) then e.dor_antes end,
        'dor_depois', case when coalesce((f.compartilhar->>'dor')::boolean, false) then e.dor_depois end,
        'orientacoes', case when coalesce((f.compartilhar->>'orientacoes')::boolean, false) then e.orientacoes end,
        'notas', case when coalesce((f.compartilhar->>'notas')::boolean, false) then e.notas end
      ) order by e.data)
      from evolucoes e where e.ficha_id = f.id and e.excluido_em is null), '[]'::json)
  )
  from fichas f join profiles p on p.id = f.profissional_id
  where f.token_evolucao = p_token
    and p_nasc is not null
    and f.respostas->>'nasc' = p_nasc
    and f.ativo is not false;
$$;
revoke all on function public.evolucao_publica(text, text) from public;
grant execute on function public.evolucao_publica(text, text) to anon, authenticated;
