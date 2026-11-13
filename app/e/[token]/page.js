"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function dataBR(d) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function EvolucaoPaciente({ params }) {
  const supabase = createClient();
  const [info, setInfo] = useState(undefined);
  const [urls, setUrls] = useState({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("evolucao_publica", { p_token: params.token });
      setInfo(data || null);
      const caminhos = (data?.evolucoes || []).flatMap((e) => e.fotos || []);
      if (caminhos.length) {
        const { data: assinadas } = await supabase.storage.from("fotos").createSignedUrls(caminhos, 3600);
        const mapa = {};
        (assinadas || []).forEach((s) => { if (s.signedUrl) mapa[s.path] = s.signedUrl; });
        setUrls(mapa);
      }
    })();
  }, [params.token]);

  if (info === undefined) return <main className="ficha-corpo suave">Carregando...</main>;
  if (!info) return <main className="ficha-corpo">Este link não está mais ativo. Fale com o seu profissional.</main>;

  const ev = info.evolucoes || [];
  const comDor = ev.filter((e) => e.dor_depois !== null && e.dor_depois !== undefined);
  const primeira = ev.find((e) => e.dor_antes !== null && e.dor_antes !== undefined);
  const ultimaOri = [...ev].reverse().find((e) => e.orientacoes);
  const fotos = ev.flatMap((e) => (e.fotos || []).map((p) => ({ p, data: e.data })));
  const nome = info.paciente_nome.split(" ")[0];

  return (
    <>
      <header className="cabeca-paciente nao-imprimir-cor">
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="mini">{info.profissional.nome}{info.profissional.profissao ? ` · ${info.profissional.profissao}` : ""}</div>
          <h1>Olá, {nome}! Esta é a sua evolução</h1>
          <p>{ev.length} sessões{ev.length ? ` desde ${dataBR(ev[0].data)}` : ""}</p>
        </div>
      </header>
      <main className="ficha-corpo pilha">
        {!ev.length && <div className="cartao">Ainda não há sessões registradas.</div>}

        {comDor.length > 0 && (
          <section className="cartao">
            <div className="linha" style={{ justifyContent: "space-between" }}>
              <h2 style={{ margin: 0 }}>Sua dor</h2>
              {primeira && <b style={{ color: "var(--marca)" }}>de {primeira.dor_antes} para {comDor[comDor.length - 1].dor_depois}</b>}
            </div>
            <div role="img" aria-label={"Dor depois de cada sessão: " + comDor.map((e) => e.dor_depois).join(", ")} style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 110, marginTop: 12, borderBottom: "1px solid var(--linha)" }}>
              {comDor.map((e, i) => <div key={i} style={{ flex: 1, height: `${Math.max(e.dor_depois * 10, 3)}%`, background: "var(--marca)", borderRadius: "4px 4px 0 0" }} />)}
            </div>
            <div style={{ display: "flex", gap: 12, fontSize: 12 }} className="suave">{comDor.map((e, i) => <span key={i} style={{ flex: 1, textAlign: "center" }}>{dataBR(e.data)}</span>)}</div>
          </section>
        )}

        {ultimaOri && (
          <section className="cartao">
            <h2>Para fazer em casa</h2>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{ultimaOri.orientacoes}</p>
          </section>
        )}

        {fotos.length > 0 && (
          <section className="cartao">
            <h2>Fotos</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {fotos.map((f) => urls[f.p] ? (
                <figure key={f.p} style={{ margin: 0 }}>
                  <img src={urls[f.p]} alt={`Foto de ${dataBR(f.data)}`} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 10 }} />
                  <figcaption className="suave" style={{ fontSize: 12 }}>{dataBR(f.data)}</figcaption>
                </figure>
              ) : null)}
            </div>
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
