-- FichaPronta: CADASTRO DE PACIENTE SEPARADO DA FICHA
-- Rode no Supabase > SQL Editor depois dos outros arquivos (pode rodar mais de uma vez).
--
-- Antes: cada ficha era um "paciente". Paciente que voltava com outra queixa
-- ganhava uma ficha nova e virava um segundo paciente, com o histórico dividido.
-- Agora: o paciente tem um cadastro, e as fichas (uma por queixa), avaliações e
-- evoluções ficam todas ligadas a ele.

create table if not exists public.pacientes (
  id uuid primary key default gen_random_uuid(),
  profissional_id uuid not null references public.profiles(id) on delete cascade,
  nome text not null,
  whatsapp text,
  nascimento date,
  created_at timestamptz not null default now()
);

alter table public.pacientes enable row level security;
drop policy if exists "pacientes: dono" on public.pacientes;
create policy "pacientes: dono" on public.pacientes for all
  using (auth.uid() = profissional_id) with check (auth.uid() = profissional_id);

alter table public.fichas add column if not exists paciente_id uuid references public.pacientes(id) on delete cascade;
create index if not exists fichas_paciente_idx on public.fichas (paciente_id);

-- Fichas que já existem: cada uma ganha o seu cadastro de paciente.
-- (Se o mesmo paciente tiver duas fichas antigas, elas continuam separadas;
--  dá para juntá-las depois. Nada é apagado.)
do $$
declare
  f record;
  novo uuid;
  nasc date;
begin
  for f in select * from public.fichas where paciente_id is null loop
    -- data de nascimento inválida não pode interromper a migração
    begin
      nasc := (f.respostas->>'nasc')::date;
    exception when others then
      nasc := null;
    end;
    insert into public.pacientes (profissional_id, nome, whatsapp, nascimento, created_at)
    values (
      f.profissional_id,
      coalesce(nullif(f.respostas->>'nome', ''), f.paciente_nome),
      coalesce(nullif(f.paciente_whatsapp, ''), f.respostas->>'tel'),
      nasc,
      f.created_at
    )
    returning id into novo;
    update public.fichas set paciente_id = novo where id = f.id;
  end loop;
end $$;
