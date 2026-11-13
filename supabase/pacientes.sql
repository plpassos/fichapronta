-- FichaPronta: PACIENTES ATIVOS / INATIVOS
-- Rode no Supabase > SQL Editor depois do schema.sql e do evolucao.sql (pode rodar mais de uma vez).

alter table public.fichas add column if not exists ativo boolean not null default true;
alter table public.fichas add column if not exists inativado_em timestamptz;

create index if not exists fichas_profissional_ativo_idx on public.fichas (profissional_id, ativo);
