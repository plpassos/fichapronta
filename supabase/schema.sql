-- FichaPronta: rode este arquivo inteiro no Supabase > SQL Editor > New query > Run

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  nome text not null,
  profissao text,
  registro text,
  whatsapp text,
  slug text unique,
  tecnicas text[] not null default '{miofascial}',
  opcionais jsonb not null default '{"endereco": true, "competicao": false, "habitos": true}',
  created_at timestamptz not null default now()
);

create table if not exists public.fichas (
  id uuid primary key default gen_random_uuid(),
  profissional_id uuid not null references public.profiles(id) on delete cascade,
  token text unique not null,
  paciente_nome text not null,
  paciente_whatsapp text,
  modo text not null default 'formulario',
  status text not null default 'pendente',
  respostas jsonb,
  tecnicas text[],
  opcionais jsonb,
  created_at timestamptz not null default now(),
  respondida_em timestamptz
);

alter table public.profiles enable row level security;
alter table public.fichas enable row level security;

-- Cada profissional só enxerga e altera os próprios dados
drop policy if exists "perfil: dono le" on public.profiles;
drop policy if exists "perfil: dono cria" on public.profiles;
drop policy if exists "perfil: dono edita" on public.profiles;
drop policy if exists "fichas: dono" on public.fichas;
create policy "perfil: dono le" on public.profiles for select using (auth.uid() = id);
create policy "perfil: dono cria" on public.profiles for insert with check (auth.uid() = id);
create policy "perfil: dono edita" on public.profiles for update using (auth.uid() = id);
create policy "fichas: dono" on public.fichas for all
  using (auth.uid() = profissional_id) with check (auth.uid() = profissional_id);

-- O paciente não faz login: ele só acessa a própria ficha pelo token do link,
-- por estas duas funções, que entregam o mínimo necessário.
create or replace function public.ficha_publica(p_token text)
returns json language sql security definer set search_path = public as $$
  select json_build_object(
    'paciente_nome', f.paciente_nome,
    'status', f.status,
    'profissional', json_build_object(
      'nome', p.nome, 'profissao', p.profissao,
      'whatsapp', p.whatsapp,
      'tecnicas', p.tecnicas, 'opcionais', p.opcionais))
  from fichas f join profiles p on p.id = f.profissional_id
  where f.token = p_token;
$$;

create or replace function public.enviar_ficha(p_token text, p_respostas jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update fichas f
     set respostas = p_respostas,
         status = 'respondida',
         respondida_em = now(),
         tecnicas = p.tecnicas,
         opcionais = p.opcionais
    from profiles p
   where f.token = p_token
     and f.status = 'pendente'
     and p.id = f.profissional_id;
  return found;
end;
$$;

grant execute on function public.ficha_publica(text) to anon, authenticated;
grant execute on function public.enviar_ficha(text, jsonb) to anon, authenticated;
