-- FichaPronta: AVALIAÇÃO FÍSICA + favoritos e frases prontas do profissional
-- Rode no Supabase > SQL Editor depois dos outros arquivos (pode rodar mais de uma vez).

create table if not exists public.avaliacoes (
  id uuid primary key default gen_random_uuid(),
  ficha_id uuid not null references public.fichas(id) on delete cascade,
  profissional_id uuid not null references public.profiles(id) on delete cascade,
  data timestamptz not null default now(),
  dados jsonb not null default '{}',
  fotos text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.avaliacoes enable row level security;
drop policy if exists "avaliacoes: dono" on public.avaliacoes;
create policy "avaliacoes: dono" on public.avaliacoes for all
  using (auth.uid() = profissional_id) with check (auth.uid() = profissional_id);

create index if not exists avaliacoes_ficha_idx on public.avaliacoes (ficha_id, data);

alter table public.profiles add column if not exists testes_favoritos text[] not null default '{}';
alter table public.profiles add column if not exists frases jsonb not null default '{}';
