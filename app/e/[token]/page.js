"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function dataBR(d) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function EvolucaoPaciente({ params }) {
  const supabase = createClient();
  const [info, setInfo] = useState(undefined);
  const [dia, setDia] = useState("");
  const [mes, setMes] = useState("");
  const [ano, setAno] = useState("");
  const [erro, setErro] = useState("");
  const [tentativas, setTentativas] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const mesRef = useRef(null);
  const anoRef = useRef(null);

  async function entrar(e) {
    e.preventDefault();
    setErro("");
    if (tentativas >= 5) return setErro("Muitas tentativas. Peça um novo link ao seu profissional.");
    const d = +dia, m = +mes, a = +ano;
    if (!(d >= 1 && d <= 31 && m >= 1 && m <= 12 && String(ano).length === 4)) return setErro("Confira a data: dia, mês e ano com 4 números.");
    const nasc = `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    setCarregando(true);
    const { data } = await supabase.rpc("evolucao_publica", { p_token: params.token, p_nasc: nasc });
    setCarregando(false);
    if (!data) {
      setTentativas((t) => t + 1);
      return setErro("Não encontramos. Confira a data de nascimento ou peça um novo link ao seu profissional.");
    }
    setInfo(data);
  }

  if (!info) {
    const estilo = { textAlign: "center", fontSize: 22 };
    return (
      <main className="ficha-corpo pilha" style={{ maxWidth: 440 }}>
        <div className="cartao pilha">
          <h1 style={{ margin: 0, fontSize: 24 }}>Sua evolução no tratamento</h1>
          <p className="suave" style={{ margin: 0 }}>Para proteger os seus dados, confirme a sua data de nascimento.</p>
          <form onSubmit={entrar} className="pilha">
            <div className="linha" style={{ flexWrap: "nowrap", gap: 10 }}>
              <div style={{ flex: 1 }}><label className="rotulo" htmlFor="d">Dia</label><input id="d" type="text" inputMode="numeric" maxLength={2} value={dia} style={estilo} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setDia(v); if (v.length === 2) mesRef.current?.focus(); }} /></div>
              <div style={{ flex: 1 }}><label className="rotulo" htmlFor="m">Mês</label><input id="m" ref={mesRef} type="text" inputMode="numeric" maxLength={2} value={mes} style={estilo} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setMes(v); if (v.length === 2) anoRef.current?.focus(); }} /></div>
              <div style={{ flex: 1.4 }}><label className="rotulo" htmlFor="a">Ano</label><input id="a" ref={anoRef} type="text" inputMode="numeric" maxLength={4} value={ano} style={estilo} onChange={(e) => setAno(e.target.value.replace(/\D/g, ""))} /></div>
            </div>
            <p className="erro" role="alert" style={{ margin: 0, minHeight: 22 }}>{erro}</p>
            <button className="botao largo" disabled={carregando}>{carregando ? "Conferindo..." : "Ver minha evolução"}</button>
          </form>
        </div>
      </main>
    );
  }

  const ev = info.evolucoes || [];
  const comDor = ev.filter((e) => e.dor_antes !== null || e.dor_depois !== null);
  const ultima = comDor[comDor.length - 1];
  const ultimaOri = [...ev].reverse().find((e) => e.orientacoes);
  const nome = info.paciente_nome.split(" ")[0];

  return (
    <>
      <header className="cabeca-paciente">
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="mini">{info.profissional.nome}{info.profissional.profissao ? ` · ${info.profissional.profissao}` : ""}</div>
          <h1>Olá, {nome}! Esta é a sua evolução</h1>
          <p>{ev.length === 1 ? "1 sessão" : `${ev.length} sessões`}{ev.length ? ` desde ${dataBR(ev[0].data)}` : ""}</p>
        </div>
      </header>
      <main className="ficha-corpo pilha">
        {!ev.length && <div className="cartao">Ainda não há sessões registradas.</div>}

        {comDor.length > 0 && (
          <section className="cartao">
            <h2 style={{ margin: "0 0 4px" }}>Sua dor em cada sessão</h2>
            {ultima && <p className="suave" style={{ margin: 0 }}>Na última sessão: {ultima.dor_antes ?? "—"} antes e {ultima.dor_depois ?? "—"} depois do atendimento (0 = sem dor, 10 = pior dor).</p>}
            <div role="img" aria-label={"Dor antes e depois de cada sessão: " + comDor.map((e, i) => `${i + 1}ª sessão, ${e.dor_antes ?? "sem registro"} antes e ${e.dor_depois ?? "sem registro"} depois`).join("; ")} style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 120, marginTop: 14, borderBottom: "1px solid var(--linha)" }}>
              {comDor.map((e, i) => (
                <div key={i} style={{ flex: 1, maxWidth: 90, display: "flex", gap: 4, alignItems: "flex-end", height: "100%" }}>
                  <div style={{ flex: 1, height: `${Math.max((e.dor_antes ?? 0) * 10, 2)}%`, background: "#B9CBCA", borderRadius: "4px 4px 0 0" }} />
                  <div style={{ flex: 1, height: `${Math.max((e.dor_depois ?? 0) * 10, 2)}%`, background: "var(--marca)", borderRadius: "4px 4px 0 0" }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 12 }} className="suave">{comDor.map((e, i) => <span key={i} style={{ flex: 1, maxWidth: 90, textAlign: "center" }}>{i + 1}ª · {dataBR(e.data)}</span>)}</div>
            <div className="linha suave" style={{ marginTop: 8, fontSize: 13, gap: 16 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: "#B9CBCA" }} />Antes da sessão</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: "var(--marca)" }} />Depois da sessão</span>
            </div>
          </section>
        )}

        {ultimaOri && (
          <section className="cartao">
            <h2>Para fazer em casa</h2>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{ultimaOri.orientacoes}</p>
          </section>
        )}

        {ev.some((e) => e.notas) && (
          <section className="cartao">
            <h2>Anotações das sessões</h2>
            {ev.filter((e) => e.notas).map((e, i) => <p key={i} style={{ margin: "8px 0 0" }}><b>{dataBR(e.data)}:</b> {e.notas}</p>)}
          </section>
        )}

        <button type="button" className="botao sec largo nao-imprimir" onClick={() => window.print()}>Baixar em PDF</button>
      </main>
    </>
  );
}
