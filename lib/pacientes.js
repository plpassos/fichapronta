// Cadastro de paciente: um paciente pode ter várias fichas (uma por queixa).
// Tudo aqui continua funcionando se o arquivo supabase/cadastro_pacientes.sql
// ainda não foi rodado: nesse caso, cada ficha vale como um paciente, como antes.

// Chave que agrupa as fichas do mesmo paciente
export const chavePaciente = (f) => f.paciente_id || f.id;

// Todas as fichas do paciente desta ficha, da mais nova para a mais antiga
export async function fichasDoPaciente(supabase, ficha) {
  if (!ficha?.paciente_id) return ficha ? [ficha] : [];
  const { data, error } = await supabase
    .from("fichas")
    .select("*")
    .eq("paciente_id", ficha.paciente_id)
    .order("created_at", { ascending: false });
  if (error || !data?.length) return [ficha];
  return data;
}

// Cria a ficha; se pacienteId não vier, cria também o cadastro do paciente
export async function criarFicha(supabase, { profissionalId, token, nome, whatsapp, modo, pacienteId }) {
  let pid = pacienteId || null;
  if (!pid) {
    const { data, error } = await supabase
      .from("pacientes")
      .insert({ profissional_id: profissionalId, nome, whatsapp: whatsapp || null })
      .select("id")
      .single();
    if (!error) pid = data.id; // sem a tabela ainda: segue sem cadastro, como antes
  }
  const linha = { profissional_id: profissionalId, token, paciente_nome: nome, paciente_whatsapp: whatsapp, modo };
  if (pid) linha.paciente_id = pid;
  return supabase.from("fichas").insert(linha).select("id").single();
}

// A ficha que representa o paciente hoje: a mais recente respondida, ou a mais recente
export function fichaPrincipal(fichas) {
  const ord = [...fichas].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return ord.find((f) => f.status === "respondida") || ord[0];
}

export function gerarToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 56]).join("");
}

// Uma linha curta para identificar a ficha: data + queixa
export function rotuloFicha(f) {
  const d = new Date(f.created_at).toLocaleDateString("pt-BR");
  const q = f.respostas?.queixa ? String(f.respostas.queixa).slice(0, 40) : f.status === "respondida" ? "sem queixa" : "aguardando resposta";
  return `${d} · ${q}`;
}
