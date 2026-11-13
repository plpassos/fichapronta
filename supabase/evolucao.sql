-- FichaPronta: EVOLUÇÃO DIÁRIA
-- Rode no Supabase > SQL Editor DEPOIS do schema.sql (pode rodar mais de uma vez).

create table if not exists public.evolucoes (
  id uuid primary key default gen_random_uuid(),
  ficha_id uuid not null references public.fichas(id) on delete cascade,
  profissional_id uuid not null references public.profiles(id) on delete cascade,
  data timestamptz not null default now(),
  dor_antes int,
  dor_depois int,
  sinais jsonb not null default '{}',
  tecnicas text[] not null default '{}',
  regioes text,
  notas text,
  orientacoes text,
  fotos text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.fichas add column if not exists token_evolucao text unique;
alter table public.fichas add column if not exists compartilhar jsonb
  not null default '{"dor": true, "orientacoes": true, "fotos": true, "notas": false}';

alter table public.evolucoes enable row level security;
drop policy if exists "evolucoes: dono" on public.evolucoes;
create policy "evolucoes: dono" on public.evolucoes for all
  using (auth.uid() = profissional_id) with check (auth.uid() = profissional_id);

-- Fotos: pasta privada; cada profissional só mexe na própria pasta (<id do profissional>/...)
insert into storage.buckets (id, name, public) values ('fotos', 'fotos', false)
  on conflict (id) do nothing;

drop policy if exists "fotos: dono envia" on storage.objects;
drop policy if exists "fotos: dono ve" on storage.objects;
drop policy if exists "fotos: dono apaga" on storage.objects;
drop policy if exists "fotos: paciente ve compartilhadas" on storage.objects;

create policy "fotos: dono envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos: dono ve" on storage.objects for select to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos: dono apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
-- O paciente só vê fotos se o profissional ativou o link de evolução com fotos
create policy "fotos: paciente ve compartilhadas" on storage.objects for select to anon
  using (
    bucket_id = 'fotos' and exists (
      select 1 from public.evolucoes e join public.fichas f on f.id = e.ficha_id
      where storage.objects.name = any (e.fotos)
        and f.token_evolucao is not null
        and coalesce((f.compartilhar->>'fotos')::boolean, false)
    )
  );

-- O paciente vê a própria evolução pelo link, só com o que o profissional liberou
create or replace function public.evolucao_publica(p_token text)
returns json language sql security definer set search_path = public as $$
  select json_build_object(
    'paciente_nome', f.paciente_nome,
    'profissional', json_build_object('nome', p.nome, 'profissao', p.profissao),
    'compartilhar', f.compartilhar,
    'evolucoes', coalesce((
      select json_agg(json_build_object(
        'data', e.data,
        'dor_antes', case when (f.compartilhar->>'dor')::boolean then e.dor_antes end,
        'dor_depois', case when (f.compartilhar->>'dor')::boolean then e.dor_depois end,
        'orientacoes', case when (f.compartilhar->>'orientacoes')::boolean then e.orientacoes end,
        'notas', case when (f.compartilhar->>'notas')::boolean then e.notas end,
        'fotos', case when (f.compartilhar->>'fotos')::boolean then e.fotos else '{}'::text[] end
      ) order by e.data)
      from evolucoes e where e.ficha_id = f.id), '[]'::json)
  )
  from fichas f join profiles p on p.id = f.profissional_id
  where f.token_evolucao = p_token;
$$;

grant execute on function public.evolucao_publica(text) to anon, authenticated;
