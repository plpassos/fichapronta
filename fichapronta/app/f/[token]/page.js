"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { montarEtapas } from "@/lib/ficha";

function Campo({ f, data, set }) {
  const v = data[f.id];
  const req = f.req ? <span style={{ color: "var(--marca)" }}> *</span> : null;
  const dica = f.hint ? <p className="dica">{f.hint}</p> : null;

  if (f.type === "sub") {
    return <div><h3 style={{ margin: "18px 0 2px", fontSize: 18 }}>{f.title}</h3><p className="suave" style={{ margin: 0 }}>{f.intro}</p></div>;
  }

  if (f.type === "yn") {
    return (
      <div>
        {f.items.map((it) => (
          <div key={it.id} className="sn">
            <div>{it.q}<span style={{ color: "var(--marca)" }}> *</span></div>
            <div className="chips" role="radiogroup" aria-label={it.q}>
              {["Sim", "Não"].map((o) => (
                <label key={o} className="chip"><input type="radio" name={it.id} checked={data[it.id] === o} onChange={() => set(it.id, o)} /><span>{o}</span></label>
              ))}
            </div>
            {it.adapta && data[it.id] === "Sim" && <div className="nota">O profissional vai adaptar: {it.adapta}.</div>}
          </div>
        ))}
      </div>
    );
  }

  if (f.type === "consent") {
    return (
      <label className="linha" style={{ alignItems: "flex-start", flexWrap: "nowrap", cursor: "pointer", fontSize: 15 }}>
        <input type="checkbox" checked={!!v} onChange={(e) => set(f.id, e.target.checked)} style={{ width: 22, height: 22, marginTop: 2, flexShrink: 0, accentColor: "var(--marca)" }} />
        <span>{f.label}</span>
      </label>
    );
  }

  if (f.type === "radio" || f.type === "checks") {
    const multi = f.type === "checks";
    const lista = multi ? v || [] : v;
    const marcado = (o) => (multi ? lista.includes(o) : lista === o);
    const trocar = (o) => {
      if (!multi) return set(f.id, o);
      set(f.id, lista.includes(o) ? lista.filter((x) => x !== o) : [...lista, o]);
    };
    return (
      <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
        <legend className="rotulo">{f.label}{req}</legend>
        {dica}
        <div className="chips">
          {f.opts.map((o) => (
            <label key={o} className="chip"><input type={multi ? "checkbox" : "radio"} name={f.id} checked={marcado(o)} onChange={() => trocar(o)} /><span>{o}</span></label>
          ))}
        </div>
        {f.other && marcado(f.other) && (
          <input type="text" aria-label={f.otherPh} placeholder={f.otherPh} value={data[f.id + "_outro"] || ""} onChange={(e) => set(f.id + "_outro", e.target.value)} style={{ marginTop: 8 }} />
        )}
      </fieldset>
    );
  }

  if (f.type === "scale") {
    return (
      <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
        <legend className="rotulo">{f.label}</legend>
        <div className="escala chips">
          {Array.from({ length: 11 }, (_, n) => (
            <label key={n} className="chip"><input type="radio" name={f.id} checked={v === n} onChange={() => set(f.id, n)} /><span>{n}</span></label>
          ))}
        </div>
      </fieldset>
    );
  }

  return (
    <div>
      <label className="rotulo" htmlFor={f.id}>{f.label}{req}</label>
      {dica}
      {f.type === "textarea" ? (
        <textarea id={f.id} value={v || ""} onChange={(e) => set(f.id, e.target.value)} />
      ) : (
        <input id={f.id} type={f.type} placeholder={f.ph} value={v || ""} onChange={(e) => set(f.id, e.target.value)} />
      )}
    </div>
  );
}

function faltando(etapa, data) {
  for (const f of etapa.fields) {
    if (f.type === "yn") {
      const it = f.items.find((i) => !data[i.id]);
      if (it) return "Responda Sim ou Não em todas as perguntas.";
    } else if (f.req) {
      const v = data[f.id];
      if (f.type === "consent" ? !v : !String(v || "").trim()) return "Preencha os campos marcados com *.";
    }
  }
  return "";
}

export default function FichaPaciente({ params }) {
  const supabase = createClient();
  const chave = `ficha-${params.token}`;
  const [info, setInfo] = useState(undefined);
  const [data, setData] = useState({});
  const [passo, setPasso] = useState(0);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);

  useEffect(() => {
    try { setData(JSON.parse(localStorage.getItem(chave) || "{}")); } catch {}
    (async () => {
      const { data: d } = await supabase.rpc("ficha_publica", { p_token: params.token });
      setInfo(d || null);
    })();
  }, [params.token]);

  function set(id, valor) {
    setErro("");
    setData((atual) => {
      const novo = { ...atual, [id]: valor };
      try { localStorage.setItem(chave, JSON.stringify(novo)); } catch {}
      return novo;
    });
  }

  if (info === undefined) return <main className="ficha-corpo suave">Carregando...</main>;
  if (!info) return <main className="ficha-corpo">Este link não é válido. Peça um novo link ao seu profissional.</main>;
  if (enviada || info.status === "respondida") {
    return (
      <main className="ficha-corpo">
        <div className="cartao pilha">
          <h1 style={{ margin: 0, fontSize: 24 }}>Ficha enviada. Obrigado!</h1>
          <p style={{ margin: 0 }}>{info.profissional.nome} já recebeu suas respostas e vai conversar com você sobre elas antes da sessão.</p>
        </div>
      </main>
    );
  }

  const prof = info.profissional;
  const etapas = montarEtapas(prof.tecnicas || [], prof.opcionais || {});
  const etapa = etapas[passo];
  const ultima = passo === etapas.length - 1;

  async function avancar() {
    const f = faltando(etapa, data);
    if (f) return setErro(f);
    if (!ultima) {
      setPasso(passo + 1);
      window.scrollTo(0, 0);
      return;
    }
    setEnviando(true);
    const { data: ok, error } = await supabase.rpc("enviar_ficha", { p_token: params.token, p_respostas: data });
    setEnviando(false);
    if (error || !ok) return setErro("Não foi possível enviar. Verifique sua internet e tente de novo.");
    try { localStorage.removeItem(chave); } catch {}
    setEnviada(true);
  }

  return (
    <>
      <header className="cabeca-paciente">
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="mini">{prof.nome}{prof.profissao ? ` · ${prof.profissao}` : ""}</div>
          <h1>Ficha antes da sua primeira sessão</h1>
          <p>Não existe resposta certa ou errada. Se não souber alguma, deixe em branco. Suas respostas ficam salvas neste aparelho se você parar no meio.</p>
        </div>
      </header>
      <main className="ficha-corpo pilha">
        <div className="pilha" style={{ gap: 8 }}>
          <div className="linha suave" style={{ justifyContent: "space-between" }}>
            <span><b style={{ color: "var(--texto)" }}>Etapa {passo + 1} de {etapas.length}</b> · {etapa.title}</span>
          </div>
          <div className="progresso"><span style={{ width: `${((passo + 1) / etapas.length) * 100}%` }} /></div>
        </div>
        <section className="cartao pilha">
          <div>
            <h2 style={{ margin: 0, color: "var(--marca)", fontSize: 22 }}>{etapa.title}</h2>
            <p className="suave" style={{ margin: "4px 0 0" }}>{etapa.intro}</p>
          </div>
          {etapa.fields.map((f, i) => <Campo key={f.id || f.title || i} f={f} data={data} set={set} />)}
        </section>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <div className="linha" style={{ flexWrap: "nowrap" }}>
          {passo > 0 && <button type="button" className="botao sec" style={{ flex: 1 }} onClick={() => { setErro(""); setPasso(passo - 1); }}>Voltar</button>}
          <button type="button" className="botao" style={{ flex: 2 }} onClick={avancar} disabled={enviando}>
            {ultima ? (enviando ? "Enviando..." : "Enviar ficha") : "Próximo"}
          </button>
        </div>
      </main>
    </>
  );
}
