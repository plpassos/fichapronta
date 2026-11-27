-- FichaPronta: LIMITE DE TENTATIVAS NO LINK DE EVOLUÇÃO DO PACIENTE
-- Rode no Supabase > SQL Editor depois dos outros arquivos (pode rodar mais de uma vez).
--
-- O link do paciente pede a data de nascimento. Antes, o limite de 5 tentativas
-- existia só na tela (recarregar a página zerava). Agora quem conta é o banco:
-- depois de 5 datas erradas em 15 minutos, o link fica bloqueado por 15 minutos.

create table if not exists public.tentativas_link (
  id bigserial primary key,
  token text not null,
  em timestamptz not null default now()
);
create index if not exists tentativas_link_token_idx on public.tentativas_link (token, em);
-- Sem políticas: ninguém lê nem grava por fora, só a função abaixo
alter table public.tentativas_link enable row level security;

-- Para este arquivo funcionar mesmo antes do historico_registros.sql
alter table public.evolucoes add column if not exists excluido_em timestamptz;

drop function if exists public.evolucao_publica(text, text);
create function public.evolucao_publica(p_token text, p_nasc text)
returns json language plpgsql security definer set search_path = public as $$
declare
  resultado json;
  falhas int;
begin
  select count(*) into falhas from tentativas_link
   where token = p_token and em > now() - interval '15 minutes';
  if falhas >= 5 then
    return json_build_object('bloqueado', true);
  end if;

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
  ) into resultado
  from fichas f join profiles p on p.id = f.profissional_id
  where f.token_evolucao = p_token
    and p_nasc is not null
    and f.respostas->>'nasc' = p_nasc
    and f.ativo is not false;

  if resultado is null then
    insert into tentativas_link (token) values (coalesce(p_token, ''));
    delete from tentativas_link where em < now() - interval '1 day';
  end if;
  return resultado;
end $$;
revoke all on function public.evolucao_publica(text, text) from public;
grant execute on function public.evolucao_publica(text, text) to anon, authenticated;
