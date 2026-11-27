"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function dataNasc(v) {
  const m = String(v || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null;
}

// Cabeçalho e rodapé que só aparecem na impressão / PDF, para o documento valer como registro
export default function Impressao({ ficha, titulo, children }) {
  const [perfil, setPerfil] = useState(null);
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("nome, profissao, registro, whatsapp").eq("id", user.id).maybeSingle();
      setPerfil(data);
    })();
  }, []);
  const r = ficha?.respostas || {};
  const nasc = dataNasc(r.nasc);
  const hoje = new Date().toLocaleDateString("pt-BR");
  return (
    <>
      <div className="so-imprimir cabecalho-impressao">
        <div className="linha" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{perfil?.nome || ""}</div>
            <div style={{ fontSize: 12 }}>{[perfil?.profissao, perfil?.registro && `Registro ${perfil.registro}`, perfil?.whatsapp].filter(Boolean).join(" · ")}</div>
          </div>
          <div style={{ textAlign: "right", fontSize: 12 }}><b>{titulo}</b><br />Emitido em {hoje}</div>
        </div>
        <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid #999", fontSize: 13 }}>
          <b>Paciente:</b> {r.nome || ficha?.paciente_nome}
          {nasc && <> · <b>Nascimento:</b> {nasc}</>}
          {(r.tel || ficha?.paciente_whatsapp) && <> · <b>Telefone:</b> {r.tel || ficha.paciente_whatsapp}</>}
        </div>
      </div>
      {children}
      <div className="so-imprimir rodape-impressao">
        <div style={{ width: 280, borderTop: "1px solid #000", margin: "48px 0 4px", paddingTop: 4, fontSize: 12 }}>
          {perfil?.nome || "Assinatura do profissional"}{perfil?.registro ? ` · ${perfil.registro}` : ""}
        </div>
        <div style={{ fontSize: 11, color: "#555" }}>Documento gerado pelo FichaPronta em {hoje}.</div>
      </div>
    </>
  );
}
