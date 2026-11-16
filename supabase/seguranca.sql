-- FichaPronta: CORREÇÕES DE SEGURANÇA E PRIVACIDADE
-- Rode no Supabase > SQL Editor depois dos outros arquivos (pode rodar mais de uma vez).

-- 1) Fotos: o link do paciente não acessa mais fotos.
--    Remove a regra que deixava fotos compartilhadas visíveis sem login.
drop policy if exists "fotos: paciente ve compartilhadas" on storage.objects;
update public.fichas set compartilhar = compartilhar - 'fotos' where compartilhar ? 'fotos';
alter table public.fichas alter column compartilhar
  set default '{"dor": true, "orientacoes": true, "notas": false}';

-- 2) Link de evolução: só abre com a data de nascimento do paciente.
drop function if exists public.evolucao_publica(text);
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
      from evolucoes e where e.ficha_id = f.id), '[]'::json)
  )
  from fichas f join profiles p on p.id = f.profissional_id
  where f.token_evolucao = p_token
    and p_nasc is not null
    and f.respostas->>'nasc' = p_nasc
    and f.ativo is not false;
$$;
revoke all on function public.evolucao_publica(text, text) from public;
grant execute on function public.evolucao_publica(text, text) to anon, authenticated;

-- 3) A ficha do paciente já vem com o WhatsApp informado pelo profissional
--    (para não perguntar de novo).
create or replace function public.ficha_publica(p_token text)
returns json language sql security definer set search_path = public as $$
  select json_build_object(
    'paciente_nome', f.paciente_nome,
    'paciente_whatsapp', f.paciente_whatsapp,
    'status', f.status,
    'profissional', json_build_object(
      'nome', p.nome, 'profissao', p.profissao,
      'whatsapp', p.whatsapp,
      'tecnicas', p.tecnicas, 'opcionais', p.opcionais))
  from fichas f join profiles p on p.id = f.profissional_id
  where f.token = p_token;
$$;

-- 4) Aviso de ficha nova: marca quando o profissional abriu a ficha respondida.
alter table public.fichas add column if not exists vista_em timestamptz;
update public.fichas set vista_em = respondida_em where status = 'respondida' and vista_em is null;
