"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { montarEtapas, formatarResposta, regioesCorpo, CORPO, DICAS } from "@/lib/ficha";
import { BotaoOuvir, BotaoMicrofone, falar } from "@/components/Voz";

const CORES_DOR = ["#2e9e5b", "#4caf50", "#7cb342", "#a5b82e", "#c9b01f", "#e0a01b", "#e68a1c", "#e5701f", "#dd5523", "#cf3a25", "#b71c1c"];
function textoDor(n, ends) {
  if (n === undefined || n === null) return "";
  if (ends) return n <= 3 ? ends[0] : n >= 8 ? ends[1] : "Médio";
  if (n === 0) return "Sem dor";
  if (n <= 3) return "Dor leve";
  if (n <= 6) return "Dor moderada";
  if (n <= 9) return "Dor forte";
  return "Pior dor possível";
}

// Transforma as etapas em uma lista de passos: uma pergunta por tela
function montarPassos(etapas) {
  const passos = [];
  for (const et of etapas) {
    if (et.final) { passos.push({ tipo: "final", secao: et.title, etapa: et }); continue; }
    let sub = null;
    for (const f of et.fields) {
      if (f.type === "sub") { sub = f; continue; }
      if (f.type === "yn") {
        f.items.forEach((it, i) => passos.push({ tipo: "yn", secao: et.title, sub: i === 0 ? sub : null, item: it }));
        sub = null;
        continue;
      }
      passos.push({ tipo: "campo", secao: et.title, campo: f });
    }
  }
  return passos;
}

function respondido(p, data) {
  if (p.tipo === "yn") return !!data[p.item.id];
  if (p.tipo === "final") return !!(data.termo && data.lgpd && String(data.assinatura || "").trim());
  const v = data[p.campo.id];
  return Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && String(v).trim() !== "";
}

function nomeCompleto(v) {
  const partes = String(v || "").trim().split(/\s+/).filter((x) => /[A-Za-zÀ-ÿ]{2,}/.test(x));
  return partes.length >= 2;
}
function telValido(v) {
  const d = String(v || "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  return d.length === 10 || d.length === 11;
}
function erroDoPasso(p, data) {
  if (p.tipo === "yn" && !data[p.item.id]) return "Escolha Sim, Não ou Não sei.";
  if (p.tipo === "final") {
    if (!data.termo || !data.lgpd) return "Marque as caixinhas obrigatórias para continuar.";
    if (!nomeCompleto(data.assinatura)) return "Escreva seu nome e sobrenome.";
  }
  if (p.tipo === "campo" && p.campo.id === "nome" && data.nome && !nomeCompleto(data.nome)) return "Escreva seu nome e sobrenome.";
  if (p.tipo === "campo" && p.campo.type === "tel" && data[p.campo.id] && !telValido(data[p.campo.id])) return "Confira o número: DDD + celular, por exemplo (11) 98765-4321.";
  if (p.tipo === "campo" && p.campo.id === "dor_pior" && typeof data.dor_pior === "number" && typeof data.dor_hoje === "number" && data.dor_pior < data.dor_hoje) return `A pior dor da semana não pode ser menor que a de hoje (${data.dor_hoje}). Confira.`;
  if (p.tipo === "campo" && p.campo.req && !respondido(p, data)) return "Essa resposta é obrigatória.";
  if (p.tipo === "campo" && p.campo.type === "data3" && data.nasc === "invalida") return "Confira a data: dia, mês e ano.";
  return "";
}

function Chips({ nome, opts, valor, multi, onToggle, grande }) {
  const marcado = (o) => (multi ? (valor || []).includes(o) : valor === o);
  return (
    <div className="chips" style={{ gap: 10 }}>
      {opts.map((o) => (
        <label key={o} className="chip" style={grande ? { flex: "1 1 100%" } : undefined}>
          <input type={multi ? "checkbox" : "radio"} name={nome} checked={marcado(o)} onChange={() => onToggle(o)} />
          <span style={{ minHeight: 52, padding: "0 18px", width: grande ? "100%" : undefined, fontSize: "1.05em" }}>{o}</span>
        </label>
      ))}
    </div>
  );
}

function Escala({ f, valor, set }) {
  return (
    <div className="pilha" style={{ gap: 10 }}>
      <div role="radiogroup" aria-label={f.label} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(52px, 1fr))", gap: 8 }}>
        {CORES_DOR.map((cor, n) => {
          const sel = valor === n;
          return (
            <label key={n} style={{ position: "relative", cursor: "pointer" }}>
              <input type="radio" name={f.id} checked={sel} onChange={() => set(f.id, n)} style={{ position: "absolute", opacity: 0, inset: 0, margin: 0 }} aria-label={`${n} — ${textoDor(n, f.ends)}`} />
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 56, borderRadius: 12, background: cor, color: "#fff", fontWeight: 700, fontSize: "1.25em", outline: sel ? "4px solid #10292b" : "none", outlineOffset: 2, transform: sel ? "scale(1.06)" : "none", textShadow: "0 1px 2px rgba(0,0,0,.35)" }}>{n}</span>
            </label>
          );
        })}
      </div>
      <div className="linha suave" style={{ justifyContent: "space-between", fontSize: 14 }}>
        <span>{f.ends ? f.ends[0] : "0 = sem dor"}</span>
        <span>{f.ends ? f.ends[1] : "10 = pior dor possível"}</span>
      </div>
      {valor !== undefined && valor !== null && (
        <div role="status" style={{ fontSize: "1.2em", fontWeight: 700, color: CORES_DOR[valor] }}>{valor} — {textoDor(valor, f.ends)}</div>
      )}
      {(valor === undefined || valor === null) && <div aria-hidden="true" style={{ fontSize: "1.2em", lineHeight: 1.5 }}>&nbsp;</div>}
    </div>
  );
}

function Boneco({ titulo, vista, selecionadas, alternar }) {
  const formas = [];
  for (const c of CORPO) {
    if (!c.vistas.includes(vista)) continue;
    const [x, y, w, h] = c.r;
    const espelho = [120 - x - w, y, w, h];
    if (!c.lado) formas.push({ nome: c.nome, r: c.r });
    else {
      const d = vista === "f" ? c.r : espelho;
      const e = vista === "f" ? espelho : c.r;
      formas.push({ nome: `${c.nome} (lado direito)`, r: d }, { nome: `${c.nome} (lado esquerdo)`, r: e });
    }
  }
  return (
    <figure style={{ margin: 0, textAlign: "center", flex: "1 1 130px", maxWidth: 170 }}>
      <svg viewBox="0 0 120 262" style={{ width: "100%", height: "auto" }} aria-hidden="true">
        <circle cx="60" cy="22" r="15" fill="#dce8e7" />
        {formas.map((s) => {
          const sel = selecionadas.includes(s.nome);
          return <rect key={s.nome} x={s.r[0]} y={s.r[1]} width={s.r[2]} height={s.r[3]} rx="5" fill={sel ? "#cf3a25" : "#dce8e7"} stroke="#fff" strokeWidth="1.5" style={{ cursor: "pointer" }} onClick={() => alternar(s.nome)} />;
        })}
      </svg>
      <figcaption className="suave" style={{ fontSize: 14 }}>{titulo}</figcaption>
    </figure>
  );
}

function Corpo({ f, valor, set, data }) {
  const sel = Array.isArray(valor) ? valor : valor ? [valor] : [];
  const alternar = (nome) => set(f.id, sel.includes(nome) ? sel.filter((x) => x !== nome) : [...sel, nome]);
  return (
    <div className="pilha">
      <div className="linha" style={{ justifyContent: "center", gap: 18, alignItems: "flex-start" }}>
        <Boneco titulo="Frente" vista="f" selecionadas={sel} alternar={alternar} />
        <Boneco titulo="Costas" vista="c" selecionadas={sel} alternar={alternar} />
      </div>
      <p className="suave" style={{ margin: 0, fontSize: 14 }}>No boneco de frente, o seu lado direito fica à esquerda da tela.</p>
      <div className="chips" style={{ gap: 8 }}>
        {regioesCorpo().map((r) => (
          <label key={r.nome} className="chip">
            <input type="checkbox" checked={sel.includes(r.nome)} onChange={() => alternar(r.nome)} />
            <span>{r.nome}</span>
          </label>
        ))}
      </div>
      <div>
        <label className="rotulo" htmlFor={f.id + "_outro"}>Outro lugar ou detalhe (opcional)</label>
        <input id={f.id + "_outro"} type="text" value={data[f.id + "_outro"] || ""} onChange={(e) => set(f.id + "_outro", e.target.value)} />
      </div>
    </div>
  );
}

function Data3({ valor, set }) {
  const [d, m, a] = useMemo(() => {
    const x = String(valor || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return x ? [String(+x[3]), String(+x[2]), x[1]] : ["", "", ""];
  }, []);
  const [dia, setDia] = useState(d);
  const [mes, setMes] = useState(m);
  const [ano, setAno] = useState(a);
  const mesRef = useRef(null);
  const anoRef = useRef(null);
  useEffect(() => {
    if (!dia && !mes && !ano) return set("nasc", "");
    const di = +dia, me = +mes, an = +ano;
    const ok = di >= 1 && di <= 31 && me >= 1 && me <= 12 && an >= 1900 && an <= new Date().getFullYear() && String(ano).length === 4;
    set("nasc", ok ? `${an}-${String(me).padStart(2, "0")}-${String(di).padStart(2, "0")}` : (String(ano).length === 4 ? "invalida" : ""));
  }, [dia, mes, ano]);
  const estilo = { textAlign: "center", fontSize: "1.3em" };
  return (
    <div className="linha" style={{ flexWrap: "nowrap", gap: 10 }}>
      <div style={{ flex: 1 }}><label className="rotulo" htmlFor="nasc_d">Dia</label><input id="nasc_d" type="text" inputMode="numeric" maxLength={2} placeholder="15" value={dia} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setDia(v); if (v.length === 2) mesRef.current?.focus(); }} style={estilo} /></div>
      <div style={{ flex: 1 }}><label className="rotulo" htmlFor="nasc_m">Mês</label><input id="nasc_m" ref={mesRef} type="text" inputMode="numeric" maxLength={2} placeholder="03" value={mes} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setMes(v); if (v.length === 2) anoRef.current?.focus(); }} style={estilo} /></div>
      <div style={{ flex: 1.4 }}><label className="rotulo" htmlFor="nasc_a">Ano</label><input id="nasc_a" ref={anoRef} type="text" inputMode="numeric" maxLength={4} placeholder="1960" value={ano} onChange={(e) => setAno(e.target.value.replace(/\D/g, ""))} style={estilo} /></div>
    </div>
  );
}

function Campo({ f, data, set, avancar }) {
  const v = data[f.id];
  const anexar = (k, t) => set(k, (data[k] ? String(data[k]).trim() + " " : "") + t);

  if (f.type === "scale") return <Escala f={f} valor={v} set={(k, n) => { set(k, n); avancar(); }} />;
  if (f.type === "corpo") return <Corpo f={f} valor={v} set={set} data={data} />;
  if (f.type === "data3") return <Data3 valor={v} set={set} />;

  if (f.type === "radio" || f.type === "checks") {
    const multi = f.type === "checks";
    const trocar = (o) => {
      if (!multi) {
        set(f.id, o);
        if (o !== f.other) avancar();
        return;
      }
      const lista = v || [];
      let nova = lista.includes(o) ? lista.filter((x) => x !== o) : [...lista, o];
      const EXCL = ["Nenhuma", "Nada melhora"];
      if (EXCL.includes(o) && nova.includes(o)) nova = [o];
      else if (!EXCL.includes(o)) nova = nova.filter((x) => !EXCL.includes(x));
      set(f.id, nova);
    };
    const mostrarOutro = f.other && (multi ? (v || []).includes(f.other) : v === f.other);
    return (
      <div className="pilha">
        <Chips nome={f.id} opts={f.opts} valor={v} multi={multi} onToggle={trocar} grande={!multi && f.opts.length > 2} />
        {mostrarOutro && (
          <div>
            <div className="linha" style={{ justifyContent: "space-between" }}>
              <label className="rotulo" htmlFor={f.id + "_outro"} style={{ marginBottom: 0 }}>{f.otherPh}</label>
              <BotaoMicrofone onTexto={(t) => anexar(f.id + "_outro", t)} />
            </div>
            <textarea id={f.id + "_outro"} value={data[f.id + "_outro"] || ""} onChange={(e) => set(f.id + "_outro", e.target.value)} style={{ marginTop: 8, minHeight: 70 }} autoFocus />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pilha" style={{ gap: 8 }}>
      {f.voz && <div><BotaoMicrofone onTexto={(t) => anexar(f.id, t)} rotulo="Responder falando" /></div>}
      {f.type === "textarea" ? (
        <textarea id={f.id} aria-labelledby="pergunta" value={v || ""} onChange={(e) => set(f.id, e.target.value)} style={{ minHeight: 110 }} />
      ) : (
        <input id={f.id} aria-labelledby="pergunta" type={f.type === "tel" ? "tel" : "text"} inputMode={f.type === "tel" ? "tel" : undefined} autoComplete={f.id === "nome" ? "name" : f.type === "tel" ? "tel" : undefined} placeholder={f.ph} value={v || ""} onChange={(e) => set(f.id, e.target.value)} style={{ fontSize: "1.15em" }} />
      )}
    </div>
  );
}

function Final({ etapa, data, set }) {
  return (
    <div className="pilha">
      {etapa.fields.map((f) =>
        f.type === "consent" ? (
          <div key={f.id} className="cartao" style={{ background: "var(--fundo)", padding: 16 }}>
            <ul style={{ margin: "0 0 10px", paddingLeft: 20 }}>{f.resumo.map((r) => <li key={r} style={{ marginBottom: 4 }}>{r}</li>)}</ul>
            <details style={{ marginBottom: 12 }}><summary style={{ cursor: "pointer", color: "var(--marca)", minHeight: 32 }}>Ler o texto completo</summary><p style={{ margin: "8px 0 0", fontSize: 14 }}>{f.label}</p></details>
            <label className="linha" style={{ flexWrap: "nowrap", alignItems: "center", cursor: "pointer", fontWeight: 600 }}>
              <input type="checkbox" checked={!!data[f.id]} onChange={(e) => set(f.id, e.target.checked)} style={{ width: 28, height: 28, flexShrink: 0, accentColor: "var(--marca)" }} />
              <span>{f.botao || "Li e concordo"}</span>
            </label>
          </div>
        ) : (
          <div key={f.id}>
            <label className="rotulo" htmlFor={f.id}>{f.label}</label>
            <input id={f.id} type="text" autoComplete="name" value={data[f.id] || ""} onChange={(e) => set(f.id, e.target.value)} style={{ fontSize: "1.15em" }} />
          </div>
        )
      )}
    </div>
  );
}

export default function FichaPaciente({ params }) {
  const supabase = createClient();
  const chave = `ficha-${params.token}`;
  const [info, setInfo] = useState(undefined);
  const [data, setData] = useState({});
  const [passo, setPasso] = useState(-1); // -1 = boas-vindas
  const [revisando, setRevisando] = useState(false);
  const [voltarRevisao, setVoltarRevisao] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);
  const [letraGrande, setLetraGrande] = useState(false);
  const timer = useRef(null);
  const dataRef = useRef({});
  const passoRef = useRef(-1);
  useEffect(() => { passoRef.current = passo; }, [passo]);
  const revRef = useRef(false);
  useEffect(() => { dataRef.current = data; }, [data]);
  useEffect(() => { revRef.current = voltarRevisao; }, [voltarRevisao]);
  const topo = useRef(null);

  useEffect(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem(chave) || "{}");
      const d0 = salvo.data || (salvo.passo === undefined ? salvo : {}) || {};
      setData(d0);
      dataRef.current = d0;
      if (typeof salvo.passo === "number") setPasso(salvo.passo);
      setLetraGrande(localStorage.getItem("ficha-letra-grande") === "1");
    } catch {}
    (async () => {
      const { data: d } = await supabase.rpc("ficha_publica", { p_token: params.token });
      setInfo(d || null);
      if (d && d.status !== "respondida") {
        setData((atual) => {
          const novo = { ...atual };
          if (!novo.nome && nomeCompleto(d.paciente_nome)) novo.nome = d.paciente_nome;
          if (!novo.tel && telValido(d.paciente_whatsapp)) novo.tel = d.paciente_whatsapp;
          dataRef.current = novo;
          return novo;
        });
      }
    })();
    return () => clearTimeout(timer.current);
  }, [params.token]);

  const prof = info?.profissional;
  const passos = useMemo(() => {
    if (!prof) return [];
    const pular = new Set();
    if (nomeCompleto(info.paciente_nome)) pular.add("nome");
    if (telValido(info.paciente_whatsapp)) pular.add("tel");
    return montarPassos(montarEtapas(prof.tecnicas || [], prof.opcionais || {})).filter((x) => !(x.tipo === "campo" && pular.has(x.campo.id)));
  }, [prof, info]);
  const iFinal = passos.length - 1;

  function guardar(novoData, novoPasso) {
    try { localStorage.setItem(chave, JSON.stringify({ data: novoData, passo: novoPasso })); } catch {}
  }
  function set(id, valor) {
    setErro("");
    setData((atual) => {
      const novo = { ...atual, [id]: valor };
      dataRef.current = novo;
      guardar(novo, passo);
      return novo;
    });
  }
  function irPara(n) {
    clearTimeout(timer.current);
    setErro("");
    setPasso(n);
    setRevisando(false);
    guardar(dataRef.current, n);
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    setTimeout(() => { topo.current?.focus(); window.scrollTo(0, 0); }, 30);
  }
  function proximo() {
    const p = passos[passo];
    const e = erroDoPasso(p, data);
    if (e) return setErro(e);
    if (voltarRevisao) { setVoltarRevisao(false); return abrirRevisao(); }
    if (passo === iFinal - 1 || passo + 1 === iFinal) return abrirRevisao();
    irPara(passo + 1);
  }
  function avancarAuto() {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const e = passos[passoRef.current] ? erroDoPasso(passos[passoRef.current], dataRef.current) : "";
      if (e) { setErro(e); return; }
      setPasso((p) => {
        if (revRef.current) { setVoltarRevisao(false); setRevisando(true); return p; }
        if (p + 1 >= iFinal) { setRevisando(true); return p; }
        guardar(dataRef.current, p + 1);
        setTimeout(() => { topo.current?.focus(); window.scrollTo(0, 0); }, 30);
        return p + 1;
      });
    }, 450);
  }
  function abrirRevisao() {
    setRevisando(true);
    setErro("");
    setTimeout(() => { topo.current?.focus(); window.scrollTo(0, 0); }, 30);
  }
  function alternarLetra() {
    const n = !letraGrande;
    setLetraGrande(n);
    try { localStorage.setItem("ficha-letra-grande", n ? "1" : "0"); } catch {}
  }

  async function enviar() {
    const e = erroDoPasso(passos[iFinal], data);
    if (e) return setErro(e);
    if (!nomeCompleto(data.nome)) { setRevisando(true); return setErro("Confira seu nome completo em “Seus dados”, na revisão."); }
    if (data.tel && !telValido(data.tel)) { setRevisando(true); return setErro("Confira seu WhatsApp em “Seus dados”, na revisão."); }
    const faltando = passos.slice(0, iFinal).findIndex((p) => erroDoPasso(p, data));
    if (faltando >= 0) { irPara(faltando); return setErro(erroDoPasso(passos[faltando], data)); }
    setEnviando(true);
    const respostas = { ...data };
    if (respostas.nasc === "invalida") delete respostas.nasc;
    const { data: ok, error } = await supabase.rpc("enviar_ficha", { p_token: params.token, p_respostas: respostas });
    setEnviando(false);
    if (error || !ok) return setErro("Não foi possível enviar. Verifique a internet e tente de novo.");
    try { localStorage.removeItem(chave); } catch {}
    setEnviada(true);
  }

  const cls = "ficha-paciente" + (letraGrande ? " letra-grande" : "");

  if (info === undefined) return <main className="ficha-corpo suave">Carregando...</main>;
  if (!info) return <main className="ficha-corpo">Este link não é válido. Peça um novo link ao seu profissional.</main>;
  if (enviada || info.status === "respondida") {
    return (
      <main className={"ficha-corpo " + cls}>
        <div className="cartao pilha" style={{ textAlign: "center", padding: 28 }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#2e9e5b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto" }} aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M7 12.5l3 3 7-7" /></svg>
          <h1 style={{ margin: 0, fontSize: 26 }}>Ficha enviada. Obrigado!</h1>
          <p style={{ margin: 0 }}>{prof.nome} já recebeu suas respostas e vai conversar com você sobre elas na consulta.</p>
        </div>
      </main>
    );
  }

  const barra = (
    <div className="linha" style={{ justifyContent: "flex-end", gap: 8 }}>
      <button type="button" className="botao-icone" onClick={alternarLetra} aria-pressed={letraGrande}>
        <span aria-hidden="true" style={{ fontWeight: 700 }}>A<span style={{ fontSize: "1.3em" }}>A</span></span>
        <span>{letraGrande ? "Letra normal" : "Letra maior"}</span>
      </button>
    </div>
  );

  // Boas-vindas
  if (passo < 0) {
    return (
      <div className={cls}>
        <header className="cabeca-paciente">
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <div className="mini">{prof.nome}{prof.profissao ? ` · ${prof.profissao}` : ""}</div>
            <h1>Olá{info.paciente_nome ? `, ${info.paciente_nome.split(" ")[0]}` : ""}! Vamos preparar a sua consulta</h1>
          </div>
        </header>
        <main className="ficha-corpo pilha">
          {barra}
          <section className="cartao pilha">
            <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10, fontSize: "1.05em" }}>
              <li>São perguntas curtas, <b>uma de cada vez</b>. Leva cerca de 8 minutos.</li>
              <li>Na maioria, é só <b>tocar na resposta</b>.</li>
              <li>Toque em <b>Ouvir</b> para escutar a pergunta, e no <b>microfone</b> para responder falando.</li>
              <li>Pode parar e continuar depois. Suas respostas ficam salvas neste celular.</li>
              <li>Se precisar, peça para alguém da família ajudar.</li>
              <li>Não existe resposta certa ou errada. Se não souber, pode pular ou marcar <b>Não sei</b>.</li>
            </ul>
            <BotaoOuvir texto="São perguntas curtas, uma de cada vez. Na maioria, é só tocar na resposta. Pode parar e continuar depois. Se não souber, pode pular ou marcar não sei." rotulo="Ouvir as instruções" />
          </section>
          <button type="button" className="botao largo" style={{ minHeight: 58, fontSize: "1.15em" }} onClick={() => irPara(0)}>Começar</button>
        </main>
      </div>
    );
  }

  // Revisão
  if (revisando) {
    const p0 = passos.slice(0, iFinal);
    const secoes = [...new Set(p0.map((p) => p.secao))];
    return (
      <div className={cls}>
        <main className="ficha-corpo pilha">
          <h1 ref={topo} tabIndex={-1} style={{ margin: "8px 0 0", fontSize: 26, outline: "none" }}>Confira suas respostas</h1>
          <p className="suave" style={{ margin: 0 }}>Se algo estiver errado, toque em <b>Alterar</b>.</p>
          {(!passos.some((x) => x.tipo === "campo" && x.campo.id === "nome") || !passos.some((x) => x.tipo === "campo" && x.campo.id === "tel")) && (
            <section className="cartao pilha">
              <h2 style={{ margin: 0 }}>Seus dados</h2>
              <p className="suave" style={{ margin: 0 }}>Preenchidos pelo profissional. Corrija se algo estiver errado.</p>
              <div><label className="rotulo" htmlFor="rev_nome">Nome completo</label><input id="rev_nome" type="text" value={data.nome || ""} onChange={(e) => set("nome", e.target.value)} /></div>
              <div><label className="rotulo" htmlFor="rev_tel">WhatsApp (com DDD)</label><input id="rev_tel" type="tel" inputMode="tel" value={data.tel || ""} onChange={(e) => set("tel", e.target.value)} /></div>
            </section>
          )}
          {secoes.map((s) => (
            <section key={s} className="cartao">
              <h2>{s}</h2>
              {p0.map((p, i) => {
                if (p.secao !== s) return null;
                const pergunta = p.tipo === "yn" ? p.item.q : p.campo.label;
                const resp = p.tipo === "yn" ? data[p.item.id] || "—" : formatarResposta(p.campo, data);
                if (p.tipo === "yn" && data[p.item.id] === "Não") return null;
                return (
                  <div key={i} className="linha" style={{ justifyContent: "space-between", flexWrap: "nowrap", padding: "10px 0", borderTop: "1px solid var(--linha)", alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0 }}><div className="suave" style={{ fontSize: 14 }}>{pergunta}</div><div style={{ fontWeight: 600 }}>{resp}</div></div>
                    <button type="button" className="botao sec" style={{ minHeight: 44, flexShrink: 0 }} onClick={() => { setVoltarRevisao(true); irPara(i); }}>Alterar</button>
                  </div>
                );
              })}
              {s === "Segurança" && <p className="suave" style={{ margin: "8px 0 0", fontSize: 14 }}>As perguntas respondidas com "Não" não aparecem aqui.</p>}
            </section>
          ))}
          <p className="erro" role="alert" style={{ margin: 0, minHeight: "1.5em" }}>{erro}</p>
          <button type="button" className="botao largo" style={{ minHeight: 58, fontSize: "1.1em" }} onClick={() => { if (!nomeCompleto(data.nome)) return setErro("Confira seu nome completo em “Seus dados”."); if (data.tel && !telValido(data.tel)) return setErro("Confira seu WhatsApp em “Seus dados”: DDD + número."); irPara(iFinal); }}>Está tudo certo, continuar</button>
        </main>
      </div>
    );
  }

  const p = passos[passo];
  const pergunta = p.tipo === "yn" ? p.item.q : p.tipo === "final" ? "Para terminar, sua autorização" : p.campo.label;
  const dica = p.tipo === "yn" ? DICAS[p.item.id] : p.tipo === "campo" ? p.campo.hint : p.etapa.intro;
  const ehFinal = p.tipo === "final";
  const autoAvanca = p.tipo === "yn" || (p.tipo === "campo" && (p.campo.type === "scale" || (p.campo.type === "radio" && !(p.campo.other && data[p.campo.id] === p.campo.other))));
  const obrigatorio = p.tipo === "yn" || p.tipo === "final" || (p.tipo === "campo" && !!p.campo.req);
  const pct = Math.round(((passo + 1) / passos.length) * 100);

  return (
    <div className={cls}>
      <header className="cabeca-paciente" style={{ padding: "16px 16px 14px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="mini">{prof.nome}</div>
          <div className="linha" style={{ justifyContent: "space-between", marginTop: 8, fontSize: 14, color: "#e6f6f5" }}>
            <span>{p.secao}</span><span>{ehFinal ? "Última etapa" : `Pergunta ${passo + 1} de ${passos.length - 1}`}</span>
          </div>
          <div style={{ height: 8, background: "rgba(255,255,255,.25)", borderRadius: 99, marginTop: 6 }}><div style={{ width: `${pct}%`, height: 8, background: "#fff", borderRadius: 99 }} /></div>
        </div>
      </header>
      <main className="ficha-corpo pilha" onKeyDown={(e) => { if (e.key === "Enter" && e.target.tagName === "INPUT" && e.target.type !== "checkbox") { e.preventDefault(); ehFinal ? enviar() : proximo(); } }}>
        {barra}
        <section className="cartao pilha" style={{ padding: "22px 18px" }}>
          {p.sub && <div style={{ background: "var(--marca-clara)", borderRadius: 10, padding: "10px 12px" }}><b>{p.sub.title}</b><div style={{ fontSize: 14 }}>{p.sub.intro}</div></div>}
          <h1 id="pergunta" ref={topo} tabIndex={-1} style={{ margin: 0, fontSize: "1.55em", lineHeight: 1.25, outline: "none" }}>
            {pergunta}{p.tipo === "campo" && p.campo.req && <span style={{ color: "var(--marca)" }}> *</span>}
          </h1>
          {dica && <p className="suave" style={{ margin: 0, fontSize: "1em" }}>{dica}</p>}
          <div><BotaoOuvir texto={[pergunta, dica].filter(Boolean).join(". ")} /></div>

          {p.tipo === "yn" && (
            <div className="pilha" style={{ gap: 10 }}>
              <Chips nome={p.item.id} opts={["Sim", "Não", "Não sei"]} valor={data[p.item.id]} onToggle={(o) => { set(p.item.id, o); if (!(p.item.detalhe && o === "Sim")) avancarAuto(); }} grande />
              {p.item.detalhe && data[p.item.id] === "Sim" && (
                <div>
                  <label className="rotulo" htmlFor={p.item.id + "_outro"}>{p.item.detalhe}</label>
                  <textarea id={p.item.id + "_outro"} value={data[p.item.id + "_outro"] || ""} onChange={(e) => set(p.item.id + "_outro", e.target.value)} style={{ minHeight: 70 }} />
                </div>
              )}
              {p.item.adapta && data[p.item.id] === "Sim" && <div className="nota">O profissional vai adaptar: {p.item.adapta}.</div>}
            </div>
          )}
          {p.tipo === "campo" && <Campo f={p.campo} data={data} set={set} avancar={avancarAuto} />}
          {ehFinal && <Final etapa={p.etapa} data={data} set={set} />}
        </section>

        <p className="erro" role="alert" style={{ margin: 0, fontSize: "1.05em", minHeight: "3em" }}>{erro}</p>

        <div className="linha" style={{ flexWrap: "nowrap" }}>
          <button type="button" className="botao sec" style={{ flex: 1, minHeight: 56 }} onClick={() => (passo === 0 ? irPara(-1) : irPara(passo - 1))}>Voltar</button>
          {ehFinal ? (
            <button type="button" className="botao" style={{ flex: 2, minHeight: 56, fontSize: "1.1em" }} onClick={enviar} disabled={enviando}>{enviando ? "Enviando..." : "Enviar ficha"}</button>
          ) : (
            <button type="button" className="botao" style={{ flex: 2, minHeight: 56, fontSize: "1.1em" }} onClick={proximo}>
              {voltarRevisao ? "Voltar para a revisão" : respondido(p, data) || obrigatorio ? "Próxima" : "Pular"}
            </button>
          )}
        </div>
        {!ehFinal && passo > 0 && <button type="button" className="botao-icone" style={{ alignSelf: "center", border: 0 }} onClick={abrirRevisao}>Ver minhas respostas</button>}
      </main>
    </div>
  );
}
