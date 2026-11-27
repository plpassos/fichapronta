"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Topo from "@/components/Topo";
import { calcularAlertas } from "@/lib/ficha";
import { chavePaciente, fichaPrincipal } from "@/lib/pacientes";

function normalizar(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}
function dataBR(d) {
  return d ? new Date(d).toLocaleDateString("pt-BR") : "—";
}
function quandoFoi(d) {
  if (!d) return "";
  const dia = (x) => { const t = new Date(x); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };
  const dias = Math.round((dia(Date.now()) - dia(d)) / 86400000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
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
  const [ultimaSessao, setUltimaSessao] = useState({});

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: perfil } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
    if (!perfil) return (window.location.href = "/cadastro");
    const { data, error } = await supabase
      .from("fichas")
      .select("*")
      .order("paciente_nome", { ascending: true })
      .limit(2000);
    if (error) {
      setMsg("Não foi possível carregar os pacientes. Confira se o arquivo supabase/pacientes.sql foi rodado no Supabase.");
      setLista([]);
      return;
    }
    const { data: ev } = await supabase.from("evolucoes").select("ficha_id, data").order("data", { ascending: false }).limit(5000);
    const mapa = {};
    (ev || []).forEach((e) => { if (!mapa[e.ficha_id]) mapa[e.ficha_id] = e.data; });
    setUltimaSessao(mapa);
    // Uma linha por paciente: junta as fichas (uma por queixa) do mesmo cadastro
    const grupos = {};
    (data || []).forEach((f) => { (grupos[chavePaciente(f)] ||= []).push(f); });
    setLista(Object.values(grupos).map((fichas) => {
      const principal = fichaPrincipal(fichas);
      const datas = fichas.map((f) => mapa[f.id]).filter(Boolean).sort();
      const maisNova = [...fichas].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      return {
        ...principal,
        _fichas: fichas,
        _ultima: datas[datas.length - 1] || null,
        _nova: fichas.find((f) => f.status === "respondida" && !f.vista_em) || null,
        _pendente: maisNova.status !== "respondida" ? maisNova : null,
        ativo: fichas.some((f) => f.ativo !== false),
      };
    }));
  }

  useEffect(() => { carregar(); }, []);

  const resultado = useMemo(() => {
    if (!lista) return [];
    const termo = normalizar(busca.trim());
    const digitos = busca.replace(/\D/g, "");
    const novo = (p) => !!p._nova;
    const recente = (p) => p._ultima || p.respondida_em || p.created_at;
    return lista.filter((p) => {
      if (filtro === "ativos" && p.ativo === false) return false;
      if (filtro === "inativos" && p.ativo !== false) return false;
      if (!termo) return true;
      const texto = normalizar(p._fichas.map((f) => { const r = f.respostas || {}; return [f.paciente_nome, r.nome, r.queixa, r.local, r.profissao, r.endereco].join(" "); }).join(" "));
      const tel = p._fichas.map((f) => String(f.paciente_whatsapp || f.respostas?.tel || "").replace(/\D/g, "")).join(" ");
      return texto.includes(termo) || (digitos.length >= 3 && tel.includes(digitos));
    }).sort((a, b) => {
      // Fichas novas primeiro; depois quem foi atendido mais recentemente (na pesquisa, ordem alfabética)
      if (novo(a) !== novo(b)) return novo(a) ? -1 : 1;
      if (termo) return 0;
      return new Date(recente(b)) - new Date(recente(a));
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
        <div className="linha" style={{ justifyContent: "space-between" }}>
          <h1 style={{ margin: 0, fontSize: 24 }}>Pacientes</h1>
          <Link href="/painel" className="botao">+ Novo paciente</Link>
        </div>

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
          {lista && lista.length === 0 && (
            <div className="pilha" style={{ alignItems: "flex-start" }}>
              <p className="suave" style={{ margin: 0 }}>Você ainda não tem pacientes. Comece enviando a ficha de anamnese para o primeiro.</p>
              <Link href="/painel" className="botao">Enviar ficha para um paciente</Link>
            </div>
          )}
          {lista && lista.length > 0 && !resultado.length && (
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
                    {p._pendente && <span className="etiqueta etq-pend">Ficha pendente</span>}
                    {p._nova && <span className="etiqueta etq-ok">Ficha nova</span>}
                    {p._fichas.length > 1 && <span className="etiqueta etq-pend">{p._fichas.length} fichas</span>}
                    {alertas.length > 0 && <span className="etiqueta etq-alerta">{alertas.length} alerta{alertas.length > 1 ? "s" : ""}</span>}
                    {cuidados.length > 0 && <span className="etiqueta etq-cuidado">{cuidados.length} cuidado{cuidados.length > 1 ? "s" : ""}</span>}
                  </div>
                  <div className="suave">{[p._ultima ? `última sessão ${quandoFoi(p._ultima)}` : "nenhuma sessão ainda", r.queixa && String(r.queixa).slice(0, 70), p.paciente_whatsapp || r.tel].filter(Boolean).join(" · ")}</div>
                </div>
                <div className="linha">
                  {p._nova
                    ? <Link href={`/painel/${p._nova.id}`} className="botao">Ver ficha nova</Link>
                    : <Link href={`/painel/${p.id}/evolucao`} className="botao">Registrar sessão</Link>}
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </>
  );
}
