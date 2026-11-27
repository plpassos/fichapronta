"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const quando = (d) => new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

// "Editado em ..." + as versões anteriores do registro, gravadas pelo banco
export default function HistoricoRegistro({ registro, resumo }) {
  const [linhas, setLinhas] = useState(null);
  const [erro, setErro] = useState("");
  if (!registro.editado_em) return null;

  async function abrir() {
    if (linhas) return setLinhas(null);
    const { data, error } = await createClient()
      .from("registros_historico")
      .select("acao, antes, motivo, em")
      .eq("registro_id", registro.id)
      .order("em", { ascending: false });
    if (error) return setErro("Não foi possível carregar o histórico.");
    setLinhas(data || []);
  }

  return (
    <div style={{ fontSize: 13, marginTop: 6 }}>
      <span className="suave">Editado em {quando(registro.editado_em)} · </span>
      <button type="button" className="nao-imprimir" onClick={abrir} style={{ border: 0, background: "none", color: "var(--marca)", font: "inherit", fontSize: 13, cursor: "pointer", padding: 0, minHeight: 32 }}>
        {linhas ? "esconder versões anteriores" : "ver versões anteriores"}
      </button>
      {erro && <span className="erro"> {erro}</span>}
      {linhas && (
        <ol style={{ margin: "4px 0 0", paddingLeft: 18 }}>
          {linhas.map((l, i) => (
            <li key={i} style={{ marginBottom: 4 }}>
              <b>{l.acao === "exclusao" ? "Excluído" : "Antes da edição"} de {quando(l.em)}:</b> {resumo(l.antes)}{l.motivo ? ` (motivo: ${l.motivo})` : ""}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
