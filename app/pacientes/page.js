"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Topo from "@/components/Topo";
import { calcularAlertas } from "@/lib/ficha";

function normalizar(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}
function dataBR(d) {
  return d ? new Date(d).toLocaleDateString("pt-BR") : "—";
}

const FILTROS = [
  { id: "ativos", nome: "Ativos" },
  { id: "inativos", nome: "Inativos" },
  { id: "todos", nome: "Todos" },
];

export default function Pacientes() {
  const supabase = createClient();
  const [lista, setLista] = useState(undefined);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("ativos");
  const [msg, setMsg] = useState("");

  async function carregar() {
    const { data, error } = await supabase
      .from("fichas")
      .select("id, paciente_nome, paciente_whatsapp, status, respostas, tecnicas, ativo, inativado_em, created_at, respondida_em")
      .order("paciente_nome", { ascending: true })
      .limit(2000);
    if (error) {
      setMsg("Não foi possível carregar os pacientes. Confira se o arquivo supabase/pacientes.sql foi rodado no Supabase.");
      setLista([]);
      return;
    }
    setLista(data || []);
  }

  useEffect(() => { carregar(); }, []);

  async function alternarAtivo(p) {
    const ativo = !p.ativo;
    if (!ativo && !window.confirm(`Inativar ${p.paciente_nome}? A ficha e as evoluções continuam salvas e você pode reativar quando quiser.`)) return;
    const { error } = await supabase
      .from("fichas")
      .update({ ativo, inativado_em: ativo ? null : new Date().toISOString() })
      .eq("id", p.id);
    if (error) return setMsg("Não foi possível alterar o paciente.");
    setMsg(ativo ? `${p.paciente_nome} foi reativado.` : `${p.paciente_nome} foi inativado.`);
    setLista((l) => l.map((x) => (x.id === p.id ? { ...x, ativo, inativado_em: ativo ? null : new Date().toISOString() } : x)));
  }

  const resultado = useMemo(() => {
    if (!lista) return [];
    const termo = normalizar(busca.trim());
    const digitos = busca.replace(/\D/g, "");
    return lista.filter((p) => {
      if (filtro === "ativos" && p.ativo === false) return false;
      if (filtro === "inativos" && p.ativo !== false) return false;
      if (!termo) return true;
      const r = p.respostas || {};
      const texto = normalizar([p.paciente_nome, r.nome, r.queixa, r.local, r.profissao, r.endereco].join(" "));
      const tel = String(p.paciente_whatsapp || r.tel || "").replace(/\D/g, "");
      return texto.includes(termo) || (digitos.length >= 3 && tel.includes(digitos));
    });
  }, [lista, busca, filtro]);

  const contagem = lista ? {
    ativos: lista.filter((p) => p.ativo !== false).length,
    inativos: lista.filter((p) => p.ativo === false).length,
    todos: lista.length,
  } : {};

  return (
    <>
      <Topo />
      <main className="conteudo pilha">
        <h1 style={{ margin: 0, fontSize: 24 }}>Pacientes</h1>

        <div className="cartao pilha">
          <div>
            <label className="rotulo" htmlFor="busca">Pesquisar paciente</label>
            <input id="busca" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome, telefone, queixa ou região do corpo" autoComplete="off"
              style={{ width: "100%", minHeight: 46, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--borda)", background: "var(--fundo)", font: "inherit", fontSize: 16 }} />
          </div>
          <div className="chips" role="radiogroup" aria-label="Mostrar">
            {FILTROS.map((f) => (
              <label key={f.id} className="chip">
                <input type="radio" name="filtro" checked={filtro === f.id} onChange={() => setFiltro(f.id)} />
                <span>{f.nome}{lista ? ` (${contagem[f.id]})` : ""}</span>
              </label>
            ))}
          </div>
        </div>

        {msg && <p role="status" style={{ margin: 0 }}>{msg}</p>}

        <section className="cartao" aria-live="polite">
          {lista === undefined && <p className="suave">Carregando...</p>}
          {lista && !resultado.length && (
            <p className="suave">{busca ? "Nenhum paciente encontrado para essa pesquisa." : filtro === "inativos" ? "Nenhum paciente inativo." : "Nenhum paciente ainda."}</p>
          )}
          {resultado.map((p, i) => {
            const r = p.respostas || {};
            const { alertas, cuidados } = p.respostas ? calcularAlertas(r, p.tecnicas || []) : { alertas: [], cuidados: [] };
            return (
              <div key={p.id} className="linha" style={{ justifyContent: "space-between", padding: "12px 0", borderTop: i ? "1px solid var(--linha)" : 0, opacity: p.ativo === false ? 0.75 : 1 }}>
                <div style={{ minWidth: 0, flex: "1 1 260px" }}>
                  <div className="linha" style={{ gap: 8 }}>
                    <Link href={`/painel/${p.id}`} style={{ fontWeight: 600, color: "var(--texto)" }}>{r.nome || p.paciente_nome}</Link>
                    {p.ativo === false && <span className="etiqueta etq-pend">Inativo desde {dataBR(p.inativado_em)}</span>}
                    {p.status !== "respondida" && <span className="etiqueta etq-pend">Ficha pendente</span>}
                    {alertas.length > 0 && <span className="etiqueta etq-alerta">{alertas.length} alerta{alertas.length > 1 ? "s" : ""}</span>}
                    {cuidados.length > 0 && <span className="etiqueta etq-cuidado">{cuidados.length} cuidado{cuidados.length > 1 ? "s" : ""}</span>}
                  </div>
                  <div className="suave">{[r.queixa && String(r.queixa).slice(0, 70), p.paciente_whatsapp || r.tel, `desde ${dataBR(p.created_at)}`].filter(Boolean).join(" · ")}</div>
                </div>
                <div className="linha">
                  <Link href={`/painel/${p.id}/evolucao`} className="botao sec">Evolução</Link>
                  <button type="button" className="botao sec" onClick={() => alternarAtivo(p)}>{p.ativo === false ? "Reativar" : "Inativar"}</button>
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </>
  );
}
