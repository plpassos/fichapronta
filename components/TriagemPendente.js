"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { precaucoesAtivas, TECNICAS } from "@/lib/ficha";

// Técnicas que o profissional usa hoje: as da ficha + as do perfil atual
export function tecnicasAtuais(ficha, perfil) {
  return [...new Set([...(ficha?.tecnicas || []), ...(perfil?.tecnicas || [])])];
}

// Perguntas de segurança das técnicas atuais que o paciente nunca respondeu
export function perguntasPendentes(ficha, tecnicas) {
  if (!ficha || ficha.status !== "respondida") return [];
  const r = ficha.respostas || {};
  return precaucoesAtivas(tecnicas).filter((p) => r[p.id] === undefined);
}

export default function TriagemPendente({ ficha, tecnicas, onSalvo }) {
  const supabase = createClient();
  const pendentes = perguntasPendentes(ficha, tecnicas);
  const [resp, setResp] = useState({});
  const [msg, setMsg] = useState("");
  const [salvando, setSalvando] = useState(false);
  if (!pendentes.length) return null;

  const novas = tecnicas.filter((t) => !(ficha.tecnicas || []).includes(t));
  const nomes = TECNICAS.filter((t) => novas.includes(t.id)).map((t) => t.nome.split(" (")[0]);

  async function salvar() {
    const faltam = pendentes.filter((p) => !resp[p.id]);
    if (faltam.length) return setMsg(`Responda todas as perguntas (faltam ${faltam.length}).`);
    setSalvando(true);
    const respostas = { ...(ficha.respostas || {}), ...resp };
    const { error } = await supabase.from("fichas").update({ respostas, tecnicas }).eq("id", ficha.id);
    setSalvando(false);
    if (error) return setMsg("Não foi possível salvar. Tente de novo.");
    onSalvo({ ...ficha, respostas, tecnicas });
  }

  return (
    <section className="cuidado pilha nao-imprimir" style={{ gap: 10 }} role="region" aria-label="Triagem pendente">
      <div>
        <b>Triagem pendente{nomes.length ? `: ${nomes.join(", ")}` : ""}</b>
        <div style={{ fontSize: 14 }}>O paciente ainda não respondeu estas perguntas de segurança. Pergunte antes de aplicar a técnica.</div>
      </div>
      {pendentes.map((p) => (
        <div key={p.id} role="group" aria-label={p.q}>
          <div style={{ fontSize: 15, marginBottom: 6 }}>{p.q}</div>
          <div className="chips">
            {["Sim", "Não", "Não sei"].map((o) => (
              <label key={o} className="chip"><input type="radio" name={"tp_" + p.id} checked={resp[p.id] === o} onChange={() => { setResp({ ...resp, [p.id]: o }); setMsg(""); }} /><span>{o}</span></label>
            ))}
          </div>
        </div>
      ))}
      {msg && <p className="erro" role="alert" style={{ margin: 0 }}>{msg}</p>}
      <div><button type="button" className="botao" onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar respostas da triagem"}</button></div>
    </section>
  );
}
