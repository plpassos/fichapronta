"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Topo from "@/components/Topo";
import { calcularAlertas, montarEtapas, formatarResposta } from "@/lib/ficha";

function idade(nasc) {
  if (!nasc) return null;
  const d = new Date(nasc), h = new Date();
  let a = h.getFullYear() - d.getFullYear();
  if (h < new Date(h.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a >= 0 && a < 130 ? a : null;
}

export default function DetalheFicha({ params }) {
  const supabase = createClient();
  const [f, setF] = useState(undefined);

  async function alternarAtivo() {
    const ativo = f.ativo === false;
    if (!ativo && !window.confirm("Inativar este paciente? A ficha e as evoluções continuam salvas e você pode reativar quando quiser.")) return;
    const inativado_em = ativo ? null : new Date().toISOString();
    const { error } = await supabase.from("fichas").update({ ativo, inativado_em }).eq("id", f.id);
    if (!error) setF({ ...f, ativo, inativado_em });
  }

  const botaoAtivo = (x) => (
    <button type="button" className="botao sec nao-imprimir" onClick={alternarAtivo}>{x.ativo === false ? "Reativar paciente" : "Inativar paciente"}</button>
  );
  const avisoInativo = (x) => x.ativo === false ? (
    <div className="cartao nao-imprimir" style={{ background: "#eceff0" }}>Paciente inativo desde {new Date(x.inativado_em || Date.now()).toLocaleDateString("pt-BR")}. Ele não aparece na lista principal, mas os dados continuam salvos.</div>
  ) : null;

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("fichas").select("*").eq("id", params.id).maybeSingle();
      setF(data || null);
    })();
  }, [params.id]);

  if (f === undefined) return <><Topo /><main className="conteudo suave">Carregando...</main></>;
  if (!f) return <><Topo /><main className="conteudo">Ficha não encontrada.</main></>;

  if (f.status !== "respondida") {
    return (
      <>
        <Topo />
        <main className="conteudo pilha">
          <h1 style={{ margin: 0, fontSize: 22 }}>{f.paciente_nome}</h1>
          {avisoInativo(f)}
          <div className="linha"><a href={`/painel/${f.id}/evolucao`} className="botao">Evolução</a>{botaoAtivo(f)}</div>
          <div className="cartao">O paciente ainda não respondeu. Link: <span style={{ wordBreak: "break-all" }}>{typeof window !== "undefined" ? `${window.location.origin}/f/${f.token}` : ""}</span></div>
        </main>
      </>
    );
  }

  const r = f.respostas || {};
  const tecnicas = f.tecnicas || [];
  const { alertas, cuidados } = calcularAlertas(r, tecnicas);
  const etapas = montarEtapas(tecnicas, f.opcionais || {});
  const anos = idade(r.nasc);

  return (
    <>
      <Topo />
      <main className="conteudo pilha">
        {avisoInativo(f)}
        <div className="linha" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22 }}>{r.nome || f.paciente_nome}{anos !== null ? `, ${anos} anos` : ""}</h1>
            <div className="suave">{[r.profissao, r.endereco, r.tel].filter(Boolean).join(" · ")}</div>
          </div>
          <div className="linha nao-imprimir">
            <button type="button" className="botao sec" onClick={() => window.print()}>Imprimir / salvar PDF</button>
            <a href={`/painel/${f.id}/evolucao`} className="botao">Evolução</a>
            {botaoAtivo(f)}
          </div>
        </div>

        <div className="grade">
          <div className="alerta">
            <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}><b>Sinais de alerta</b></div>
            {alertas.length ? alertas.map((a) => <div key={a.id} style={{ marginTop: 6 }}>{a.resumo}</div>) : <div style={{ marginTop: 6 }}>Nenhum marcado.</div>}
            {alertas.length > 0 && <div className="suave" style={{ marginTop: 8 }}>Considere pedir avaliação médica antes da sessão.</div>}
          </div>
          <div className="cuidado">
            <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}><b>Cuidados com técnicas</b></div>
            {cuidados.length ? cuidados.map((c) => <div key={c.id} style={{ marginTop: 6 }}>{c.resumo} → adaptar {c.adapta}</div>) : <div style={{ marginTop: 6 }}>Nenhum marcado.</div>}
          </div>
        </div>

        <div className="grade">
          <div className="cartao"><div className="suave">Dor hoje</div><div className="numero">{r.dor_hoje ?? "—"}<span className="suave">/10</span></div></div>
          <div className="cartao"><div className="suave">Pior dor (7 dias)</div><div className="numero">{r.dor_pior ?? "—"}<span className="suave">/10</span></div></div>
          <div className="cartao"><div className="suave">Queixa principal</div><div>{r.queixa || "—"}</div><div className="suave" style={{ marginTop: 8 }}>Objetivo: {r.expect || "—"}</div></div>
        </div>

        {etapas.map((et) => (
          <section key={et.title} className="cartao">
            <h2>{et.title}</h2>
            <dl className="respostas" style={{ margin: 0 }}>
              {et.fields.flatMap((fd, i) => {
                if (fd.type === "sub") return [];
                if (fd.type === "yn") return fd.items.map((it) => [<dt key={it.id + "t"}>{it.q}</dt>, <dd key={it.id + "d"}>{r[it.id] || "—"}</dd>]);
                return [[<dt key={(fd.id || i) + "t"}>{fd.type === "consent" ? (fd.id === "lgpd" ? "Consentimento LGPD" : "Termo de consentimento") : fd.label}</dt>, <dd key={(fd.id || i) + "d"}>{formatarResposta(fd, r)}</dd>]];
              })}
            </dl>
          </section>
        ))}
        <p className="suave">Respondida em {new Date(f.respondida_em).toLocaleString("pt-BR")}.</p>
      </main>
    </>
  );
}
