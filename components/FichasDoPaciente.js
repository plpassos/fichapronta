"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { chavePaciente, rotuloFicha } from "@/lib/pacientes";

// Fichas do paciente (uma por queixa), nova ficha e junção de cadastros repetidos
export default function FichasDoPaciente({ ficha, grupo, onJuntou }) {
  const supabase = createClient();
  const [abrirJuntar, setAbrirJuntar] = useState(false);
  const [outros, setOutros] = useState(null);
  const [alvo, setAlvo] = useState("");
  const [msg, setMsg] = useState("");

  if (!ficha.paciente_id) {
    return <p className="suave nao-imprimir" style={{ margin: 0, fontSize: 13 }}>Para registrar uma nova queixa deste paciente no mesmo histórico, rode o arquivo supabase/cadastro_pacientes.sql no Supabase.</p>;
  }

  async function carregarOutros() {
    setAbrirJuntar(true);
    if (outros) return;
    const { data } = await supabase.from("fichas").select("id, paciente_id, paciente_nome, paciente_whatsapp, respostas, created_at").order("paciente_nome").limit(2000);
    const vistos = {};
    (data || []).forEach((f) => {
      const k = chavePaciente(f);
      if (k === ficha.paciente_id || !f.paciente_id) return;
      if (!vistos[k]) vistos[k] = { paciente_id: k, nome: f.respostas?.nome || f.paciente_nome, tel: f.paciente_whatsapp || f.respostas?.tel || "" };
    });
    setOutros(Object.values(vistos).sort((a, b) => a.nome.localeCompare(b.nome)));
  }

  async function juntar() {
    const destino = outros.find((o) => o.paciente_id === alvo);
    if (!destino) return setMsg("Escolha o paciente.");
    if (!window.confirm(`Juntar as fichas deste paciente com as de ${destino.nome}? Todo o histórico (fichas, avaliações e evoluções) passa a ficar num só paciente.`)) return;
    const { error } = await supabase.from("fichas").update({ paciente_id: destino.paciente_id }).eq("paciente_id", ficha.paciente_id);
    if (error) return setMsg("Não foi possível juntar. Tente de novo.");
    setMsg(`Pronto: agora é um só paciente, ${destino.nome}.`);
    setAbrirJuntar(false);
    onJuntou?.();
  }

  return (
    <section className="cartao pilha nao-imprimir" style={{ gap: 10, padding: 16 }}>
      <div className="linha" style={{ justifyContent: "space-between" }}>
        <b>Fichas deste paciente ({grupo.length})</b>
        <Link href={`/painel?paciente=${ficha.id}`} className="botao sec">+ Nova ficha (nova queixa)</Link>
      </div>
      {grupo.length > 1 && (
        <div className="chips">
          {grupo.map((g) => (
            <Link key={g.id} href={`/painel/${g.id}`} className="etiqueta" aria-current={g.id === ficha.id ? "page" : undefined}
              style={{ fontSize: 14, padding: "8px 12px", textDecoration: "none", background: g.id === ficha.id ? "var(--marca)" : "var(--fundo)", color: g.id === ficha.id ? "#fff" : "var(--texto)", border: "1px solid var(--borda)" }}>
              {rotuloFicha(g)}
            </Link>
          ))}
        </div>
      )}
      {!abrirJuntar ? (
        <button type="button" onClick={carregarOutros} style={{ alignSelf: "flex-start", border: 0, background: "none", color: "var(--marca)", font: "inherit", fontSize: 14, cursor: "pointer", padding: 0, minHeight: 32 }}>Este paciente está cadastrado duas vezes? Juntar com outro</button>
      ) : (
        <div className="pilha" style={{ gap: 8 }}>
          <label className="rotulo" htmlFor="juntar" style={{ margin: 0 }}>Juntar com qual paciente?</label>
          <select id="juntar" value={alvo} onChange={(e) => { setAlvo(e.target.value); setMsg(""); }}>
            <option value="">{outros ? "Escolha..." : "Carregando..."}</option>
            {(outros || []).map((o) => <option key={o.paciente_id} value={o.paciente_id}>{o.nome}{o.tel ? ` · ${o.tel}` : ""}</option>)}
          </select>
          <div className="linha">
            <button type="button" className="botao" onClick={juntar}>Juntar</button>
            <button type="button" className="botao sec" onClick={() => setAbrirJuntar(false)}>Cancelar</button>
          </div>
        </div>
      )}
      {msg && <p role="status" style={{ margin: 0 }}>{msg}</p>}
    </section>
  );
}
