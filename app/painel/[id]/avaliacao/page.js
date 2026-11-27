"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Topo from "@/components/Topo";
import AbasPaciente from "@/components/AbasPaciente";
import { fichasDoPaciente } from "@/lib/pacientes";
import Impressao from "@/components/Impressao";
import HistoricoRegistro from "@/components/HistoricoRegistro";
import { lerRascunho, gravarRascunho, useAvisoSaida } from "@/lib/rascunho";
import { agoraLocal } from "@/lib/datas";
import { BotaoMicrofone } from "@/components/Voz";
import { ADM, FORCA, FUNCIONAIS, REGIOES_CORPO, sugerirRegioes, nomeTeste } from "@/lib/testes";

const CONCLUSAO_VAZIA = { diagnostico: "", prognostico: "", objCurto: "", objLongo: "", frequencia: "", sessoes: "", condutas: "" };
const VAZIO = { testes: {}, adm: {}, forca: {}, func: {}, pg: [], pgObs: "", postura: "", obs: "", conclusao: CONCLUSAO_VAZIA };
const CAMPOS_CONCLUSAO = [
  { id: "diagnostico", nome: "Diagnóstico cinético-funcional", area: true, ph: "Ex.: disfunção do movimento de flexão do ombro D por dor e fraqueza do manguito rotador" },
  { id: "prognostico", nome: "Prognóstico", ph: "Ex.: bom, com retorno às atividades em 8 semanas" },
  { id: "objCurto", nome: "Objetivos de curto prazo", area: true, ph: "Ex.: reduzir a dor para 3/10 em 2 semanas" },
  { id: "objLongo", nome: "Objetivos de longo prazo", area: true, ph: "Ex.: voltar a treinar sem dor em 3 meses" },
  { id: "frequencia", nome: "Frequência", ph: "Ex.: 2x por semana" },
  { id: "sessoes", nome: "Número de sessões previstas", ph: "Ex.: 10" },
  { id: "condutas", nome: "Condutas planejadas", area: true, ph: "Ex.: liberação miofascial, exercícios de estabilização, orientações posturais" },
];
const chaveRascunho = (id) => `fp-rascunho-avaliacao-${id}`;

// Dados salvos -> formulário (para corrigir uma avaliação)
function dadosParaForm(d = {}) {
  const txt = (obj) => Object.fromEntries(Object.entries(obj || {}).map(([k, v]) => [k, Object.fromEntries(Object.entries(v || {}).map(([l, x]) => [l, String(x)]))]));
  return {
    ...VAZIO,
    testes: d.testes || {}, adm: txt(d.adm), forca: txt(d.forca), func: txt(d.func),
    pg: d.pg || [], pgObs: d.pgObs || "", postura: d.postura || "", obs: d.obs || "",
    conclusao: { ...CONCLUSAO_VAZIA, ...(d.conclusao || {}) },
  };
}

function dataBR(d) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function dataCurta(d) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
function vazio(v) {
  return v === undefined || v === null || v === "";
}
function sinal(v) {
  return v === "+" ? "+" : v === "-" ? "−" : "";
}
function palavra(v) {
  return v === "+" ? "positivo" : v === "-" ? "negativo" : "—";
}

// Remove campos vazios antes de salvar
function limpar(form) {
  const dados = {};
  const lados = (obj, num) => {
    const out = {};
    for (const [k, v] of Object.entries(obj || {})) {
      const l = {};
      for (const lado of ["D", "E"]) {
        if (!vazio(v?.[lado])) l[lado] = num ? Number(String(v[lado]).replace(",", ".")) : v[lado];
      }
      if (Object.keys(l).length && Object.values(l).every((x) => !num || Number.isFinite(x))) out[k] = l;
    }
    return out;
  };
  const testes = lados(form.testes, false);
  const adm = lados(form.adm, true);
  const forca = lados(form.forca, true);
  const func = lados(form.func, true);
  if (Object.keys(testes).length) dados.testes = testes;
  if (Object.keys(adm).length) dados.adm = adm;
  if (Object.keys(forca).length) dados.forca = forca;
  if (Object.keys(func).length) dados.func = func;
  if (form.pg.length) dados.pg = form.pg;
  if (form.pgObs.trim()) dados.pgObs = form.pgObs.trim();
  if (form.postura.trim()) dados.postura = form.postura.trim();
  if (form.obs.trim()) dados.obs = form.obs.trim();
  const conc = {};
  for (const [k, v] of Object.entries(form.conclusao || {})) if (String(v || "").trim()) conc[k] = String(v).trim();
  if (Object.keys(conc).length) dados.conclusao = conc;
  return dados;
}

function contarMedidas(d = {}) {
  let n = 0;
  for (const k of ["adm", "forca", "func"]) for (const v of Object.values(d[k] || {})) n += Object.keys(v || {}).length;
  return n;
}

function positivos(d = {}) {
  const out = [];
  for (const [id, v] of Object.entries(d.testes || {})) {
    const lados = ["D", "E"].filter((l) => v?.[l] === "+");
    if (lados.length) out.push(`${nomeTeste(id)} (${lados.join("/")})`);
  }
  return out;
}

function comparar(a = {}, b = {}) {
  const linhas = [];
  const rotLado = (unico, lado) => (unico ? "" : ` ${lado}`);
  for (const [id, va] of Object.entries(a.testes || {})) {
    const vb = b.testes?.[id];
    if (!vb) continue;
    for (const l of ["D", "E"]) {
      if (va[l] && vb[l] && va[l] !== vb[l]) linhas.push(`${nomeTeste(id)} ${l}: ${palavra(va[l])} → ${palavra(vb[l])}`);
    }
  }
  for (const item of ADM) {
    const va = a.adm?.[item.id], vb = b.adm?.[item.id];
    if (!va || !vb) continue;
    for (const l of item.unico ? ["D"] : ["D", "E"]) {
      if (!vazio(va[l]) && !vazio(vb[l]) && va[l] !== vb[l]) linhas.push(`${item.articulacao} ${item.movimento.toLowerCase()}${rotLado(item.unico, l)}: ${va[l]}° → ${vb[l]}°`);
    }
  }
  for (const item of FORCA) {
    const va = a.forca?.[item.id], vb = b.forca?.[item.id];
    if (!va || !vb) continue;
    for (const l of ["D", "E"]) {
      if (!vazio(va[l]) && !vazio(vb[l]) && va[l] !== vb[l]) linhas.push(`${item.nome} ${l}: ${va[l]} → ${vb[l]}`);
    }
  }
  for (const item of FUNCIONAIS) {
    const va = a.func?.[item.id], vb = b.func?.[item.id];
    if (!va || !vb) continue;
    for (const l of item.lado ? ["D", "E"] : ["D"]) {
      if (!vazio(va[l]) && !vazio(vb[l]) && va[l] !== vb[l]) linhas.push(`${item.nome}${item.lado ? " " + l : ""}: ${va[l]} ${item.unidade} → ${vb[l]} ${item.unidade}`);
    }
  }
  return linhas;
}

const estiloNum = { width: 84, minHeight: 44, padding: "8px 10px", borderRadius: 10, border: "1px solid var(--borda)", background: "var(--fundo)", font: "inherit", fontSize: 16, color: "var(--texto)" };
const estiloSelect = { ...estiloNum, width: 84 };

function Secao({ titulo, aberta, n, children }) {
  return (
    <details open={aberta} className="cartao" style={{ padding: 0 }}>
      <summary style={{ cursor: "pointer", padding: "14px 18px", fontSize: 16, fontWeight: 600, minHeight: 44 }}>{titulo}{n > 0 && <span className="etiqueta etq-ok" style={{ marginLeft: 8 }}>{n} preenchido{n > 1 ? "s" : ""}</span>}</summary>
      <div className="pilha" style={{ padding: "0 20px 20px" }}>{children}</div>
    </details>
  );
}

function ChipSinal({ ativo, onClick, children, rotulo }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={ativo} aria-label={rotulo}
      style={{ minWidth: 44, minHeight: 44, borderRadius: 99, border: "1px solid " + (ativo ? "var(--marca)" : "var(--borda)"), background: ativo ? "var(--marca)" : "var(--fundo)", color: ativo ? "#fff" : "var(--texto)", font: "inherit", fontSize: 18, fontWeight: 600, cursor: "pointer" }}>
      {children}
    </button>
  );
}

export default function Avaliacao({ params }) {
  const supabase = createClient();
  const [ficha, setFicha] = useState(undefined);
  const [userId, setUserId] = useState(null);
  const [favoritos, setFavoritos] = useState([]);
  const [soFavoritos, setSoFavoritos] = useState(false);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [urls, setUrls] = useState({});
  const [form, setForm] = useState(VAZIO);
  const [arquivos, setArquivos] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");
  const [quando, setQuando] = useState(() => agoraLocal());
  const [rascunhoPronto, setRascunhoPronto] = useState(false);
  const [recuperado, setRecuperado] = useState(false);
  const [excluidas, setExcluidas] = useState([]);
  const [podeEditar, setPodeEditar] = useState(false); // depende do supabase/historico_registros.sql
  const [editando, setEditando] = useState(null);

  // Rascunho automático: uma avaliação longa não se perde ao trocar de aba ou recarregar
  useEffect(() => {
    const r = lerRascunho(chaveRascunho(params.id), VAZIO);
    if (r) { setForm({ ...r, conclusao: { ...CONCLUSAO_VAZIA, ...(r.conclusao || {}) } }); setRecuperado(true); }
    setRascunhoPronto(true);
  }, [params.id]);
  useEffect(() => { if (rascunhoPronto && !editando) gravarRascunho(chaveRascunho(params.id), form, VAZIO); }, [form, rascunhoPronto, params.id, editando]);
  useAvisoSaida(JSON.stringify(form) !== JSON.stringify(VAZIO) || arquivos.length > 0);

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const { data: f } = await supabase.from("fichas").select("*").eq("id", params.id).maybeSingle();
    setFicha(f || null);
    if (!f) return;
    const { data: p } = await supabase.from("profiles").select("testes_favoritos").eq("id", user.id).maybeSingle();
    setFavoritos(p?.testes_favoritos || []);
    const { data: av, error } = await supabase.from("avaliacoes").select("*").in("ficha_id", (await fichasDoPaciente(supabase, f)).map((x) => x.id)).order("data", { ascending: true });
    if (error) setMsg("Não foi possível carregar as avaliações. Confira se o arquivo supabase/avaliacao.sql foi rodado no Supabase.");
    setAvaliacoes((av || []).filter((a) => !a.excluido_em));
    setExcluidas((av || []).filter((a) => a.excluido_em));
    setPodeEditar(!!av?.length && "excluido_em" in av[0]);
    const caminhos = (av || []).flatMap((a) => a.fotos || []);
    if (caminhos.length) {
      const { data: assinadas } = await supabase.storage.from("fotos").createSignedUrls(caminhos, 3600);
      const mapa = {};
      (assinadas || []).forEach((s) => { if (s.signedUrl) mapa[s.path] = s.signedUrl; });
      setUrls(mapa);
    }
  }

  useEffect(() => { carregar(); }, [params.id]);

  const regioes = useMemo(() => sugerirRegioes(ficha?.respostas || {}), [ficha]);
  const anterior = avaliacoes.length ? avaliacoes[avaliacoes.length - 1].dados || {} : {};

  function setLado(grupo, id, lado, valor) {
    setMsg("");
    setForm((f) => ({ ...f, [grupo]: { ...f[grupo], [id]: { ...(f[grupo][id] || {}), [lado]: valor } } }));
  }
  function alternarTeste(id, lado, valor) {
    const atual = form.testes[id]?.[lado];
    setLado("testes", id, lado, atual === valor ? "" : valor);
  }
  function alternarPg(r) {
    setForm((f) => ({ ...f, pg: f.pg.includes(r) ? f.pg.filter((x) => x !== r) : [...f.pg, r] }));
  }
  function acrescentar(campo, texto) {
    setForm((f) => ({ ...f, [campo]: f[campo] ? `${f[campo].trim()} ${texto}` : texto }));
  }

  async function alternarFavorito(id) {
    const novos = favoritos.includes(id) ? favoritos.filter((x) => x !== id) : [...favoritos, id];
    setFavoritos(novos);
    const { error } = await supabase.from("profiles").update({ testes_favoritos: novos }).eq("id", userId);
    if (error) setMsg("Não foi possível salvar o favorito. Confira se o arquivo supabase/avaliacao.sql foi rodado no Supabase.");
  }

  function iniciarEdicao(a) {
    const sujo = JSON.stringify(form) !== JSON.stringify(VAZIO);
    if (sujo && !editando && !window.confirm("Você tem uma avaliação nova não salva. Ela continua guardada no rascunho. Corrigir a avaliação antiga agora?")) return;
    setEditando(a);
    setForm(dadosParaForm(a.dados));
    setQuando(agoraLocal(new Date(a.data)));
    setArquivos([]); setMsg(""); setRecuperado(false);
    setTimeout(() => document.getElementById("form-avaliacao")?.scrollIntoView({ behavior: "smooth" }), 30);
  }
  function cancelarEdicao() {
    setEditando(null); setMsg(""); setQuando(agoraLocal());
    setForm(lerRascunho(chaveRascunho(params.id), VAZIO) || VAZIO);
  }
  async function excluir(a) {
    const motivo = window.prompt(`Excluir a avaliação de ${dataBR(a.data)}?\n\nEla sai da lista, mas fica guardada no histórico. Escreva o motivo (obrigatório):`);
    if (motivo === null) return;
    if (!motivo.trim()) return setMsg("Para excluir, é preciso informar o motivo.");
    const { error } = await supabase.from("avaliacoes").update({ excluido_em: new Date().toISOString(), excluido_motivo: motivo.trim() }).eq("id", a.id);
    if (error) return setMsg("Não foi possível excluir a avaliação.");
    if (editando?.id === a.id) cancelarEdicao();
    setMsg("Avaliação excluída. Ela continua no histórico, com o motivo.");
    carregar();
  }

  async function salvar(e) {
    e.preventDefault();
    setMsg("");
    const dados = limpar(form);
    if (!Object.keys(dados).length && !arquivos.length) return setMsg("Preencha pelo menos um item antes de salvar.");
    if (arquivos.length && ficha?.respostas?.fotos_ok !== true) return setMsg("O paciente não autorizou fotos na ficha.");
    const dataAval = new Date(quando);
    if (!quando || isNaN(dataAval)) return setMsg("Confira a data e a hora da avaliação.");
    if (dataAval.getTime() > Date.now() + 5 * 60000) return setMsg("A data da avaliação não pode ser no futuro.");
    setSalvando(true);
    const fotos = [];
    for (const arq of arquivos) {
      const ext = (arq.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const caminho = `${userId}/${ficha.id}/aval-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("fotos").upload(caminho, arq, { contentType: arq.type });
      if (error) { setSalvando(false); return setMsg("Não foi possível enviar uma das fotos. Tente de novo."); }
      fotos.push(caminho);
    }
    if (editando) {
      const { error } = await supabase.from("avaliacoes").update({ data: dataAval.toISOString(), dados, fotos: [...(editando.fotos || []), ...fotos] }).eq("id", editando.id);
      setSalvando(false);
      if (error) return setMsg("Não foi possível salvar a correção.");
      setEditando(null); setArquivos([]); setQuando(agoraLocal());
      setForm(lerRascunho(chaveRascunho(ficha.id), VAZIO) || VAZIO);
      setMsg("Correção salva. A versão anterior ficou no histórico.");
      return carregar();
    }
    const { error } = await supabase.from("avaliacoes").insert({ ficha_id: ficha.id, profissional_id: userId, data: dataAval.toISOString(), dados, fotos });
    setSalvando(false);
    if (error) return setMsg("Não foi possível salvar a avaliação. Confira se o arquivo supabase/avaliacao.sql foi rodado no Supabase.");
    setForm(VAZIO); setArquivos([]); setQuando(agoraLocal()); setRecuperado(false);
    gravarRascunho(chaveRascunho(ficha.id), VAZIO, VAZIO);
    setMsg("Avaliação salva!");
    carregar();
  }

  if (ficha === undefined) return <><Topo /><main className="conteudo suave">Carregando...</main></>;
  if (!ficha) return <><Topo /><main className="conteudo">Paciente não encontrado.</main></>;

  const r = ficha.respostas || {};
  const primeira = avaliacoes[0];
  const ultima = avaliacoes[avaliacoes.length - 1];
  const mudancas = avaliacoes.length >= 2 ? comparar(primeira.dados, ultima.dados) : [];
  const reavaliacao = avaliacoes.length > 0;

  return (
    <>
      <div className="nao-imprimir"><Topo /></div>
      <main className="conteudo pilha">
        <AbasPaciente id={ficha.id} atual="avaliacao" />
        <Impressao ficha={ficha} titulo="Avaliação física">
        {ficha.ativo === false && <div className="cartao nao-imprimir" style={{ background: "#eceff0" }}>Paciente inativo. Você ainda pode registrar avaliações.</div>}

        <div className="linha" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22 }}>{r.nome || ficha.paciente_nome}</h1>
            <div className="suave" style={{ fontSize: 14 }}>Avaliação física · {avaliacoes.length === 1 ? "1 avaliação" : `${avaliacoes.length} avaliações`}</div>
          </div>
          <div className="linha nao-imprimir">
            <button type="button" className="botao sec" onClick={() => { document.querySelectorAll("details").forEach((d) => (d.open = true)); setTimeout(() => window.print(), 50); }} disabled={!avaliacoes.length}>PDF</button>
          </div>
        </div>

        {mudancas.length > 0 && (
          <section className="cartao" style={{ breakInside: "avoid" }}>
            <h2 style={{ marginTop: 0 }}>O que mudou ({dataCurta(primeira.data)} → {dataCurta(ultima.data)})</h2>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {mudancas.map((m) => <li key={m} style={{ padding: "3px 0" }}>{m}</li>)}
            </ul>
          </section>
        )}

        <form id="form-avaliacao" onSubmit={salvar} className="pilha nao-imprimir">
          <div className="linha" style={{ justifyContent: "space-between" }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>{editando ? `Corrigir avaliação de ${dataBR(editando.data)}` : reavaliacao ? "Reavaliação" : "Nova avaliação"}</h2>
            {editando
              ? <button type="button" className="botao sec" onClick={cancelarEdicao}>Cancelar correção</button>
              : reavaliacao && <span className="suave" style={{ fontSize: 13 }}>"antes" = {dataCurta(ultima.data)}</span>}
          </div>
          {editando && <p role="status" className="cuidado" style={{ margin: 0, padding: "8px 12px" }}>Você está corrigindo uma avaliação já salva. A versão anterior fica guardada no histórico.</p>}
          {recuperado && <p role="status" className="suave" style={{ margin: 0 }}>Recuperamos a avaliação que você estava preenchendo.</p>}
          <div>
            <label className="rotulo" htmlFor="quando">Data e hora da avaliação</label>
            <input id="quando" type="datetime-local" value={quando} max={agoraLocal()} onChange={(e) => setQuando(e.target.value)} style={{ maxWidth: 260 }} />
          </div>

          <Secao titulo="Testes especiais" aberta n={Object.values(form.testes).filter((v) => v.D || v.E).length}>
            <label className="linha" style={{ cursor: "pointer", minHeight: 44 }}>
              <input type="checkbox" checked={soFavoritos} onChange={(e) => setSoFavoritos(e.target.checked)} style={{ width: 20, height: 20, accentColor: "var(--marca)" }} />
              Mostrar só favoritos {favoritos.length ? `(${favoritos.length})` : ""}
            </label>
            {soFavoritos && !favoritos.length && <p className="suave" style={{ margin: 0 }}>Você ainda não tem favoritos. Toque na estrela ao lado de um teste para marcar.</p>}
            {regioes.map((reg, ri) => {
              const testes = soFavoritos ? reg.testes.filter((t) => favoritos.includes(t.id)) : reg.testes;
              if (!testes.length) return null;
              return (
                <details key={reg.id} open={soFavoritos || reg.sugerida || (ri === 0 && !regioes.some((x) => x.sugerida))} style={{ border: "1px solid var(--linha)", borderRadius: 12 }}>
                  <summary style={{ cursor: "pointer", padding: "12px 14px", fontWeight: 600, minHeight: 44 }}>
                    {reg.nome}{reg.sugerida && <span className="etiqueta etq-ok" style={{ marginLeft: 8 }}>sugerida pela queixa</span>}
                  </summary>
                  <div style={{ padding: "0 14px 8px" }}>
                    {testes.map((t, i) => {
                      const ant = anterior.testes?.[t.id];
                      const fav = favoritos.includes(t.id);
                      return (
                        <div key={t.id} className="linha" style={{ justifyContent: "space-between", padding: "10px 0", borderTop: i ? "1px solid var(--linha)" : 0 }}>
                          <div className="linha" style={{ flex: "1 1 220px", flexWrap: "nowrap", gap: 6 }}>
                            <button type="button" onClick={() => alternarFavorito(t.id)} aria-pressed={fav} aria-label={fav ? `Remover ${t.nome} dos favoritos` : `Marcar ${t.nome} como favorito`}
                              style={{ width: 44, height: 44, flexShrink: 0, border: 0, background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg width="22" height="22" viewBox="0 0 24 24" fill={fav ? "#b7791f" : "none"} stroke={fav ? "#b7791f" : "#6b7f80"} strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z" /></svg>
                            </button>
                            <div>
                              <div>{t.nome}</div>
                              {ant && (ant.D || ant.E) && <div className="suave" style={{ fontSize: 13 }}>antes: {ant.D ? `D${sinal(ant.D)}` : ""} {ant.E ? `E${sinal(ant.E)}` : ""}</div>}
                            </div>
                          </div>
                          <div className="linha" style={{ gap: 14 }}>
                            {["D", "E"].map((lado) => (
                              <div key={lado} className="linha" style={{ gap: 6, flexWrap: "nowrap" }} role="group" aria-label={`${t.nome}, lado ${lado === "D" ? "direito" : "esquerdo"}`}>
                                <span style={{ fontWeight: 600, width: 14 }}>{lado}</span>
                                <ChipSinal ativo={form.testes[t.id]?.[lado] === "+"} onClick={() => alternarTeste(t.id, lado, "+")} rotulo={`${t.nome} ${lado === "D" ? "direito" : "esquerdo"} positivo`}>+</ChipSinal>
                                <ChipSinal ativo={form.testes[t.id]?.[lado] === "-"} onClick={() => alternarTeste(t.id, lado, "-")} rotulo={`${t.nome} ${lado === "D" ? "direito" : "esquerdo"} negativo`}>−</ChipSinal>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </Secao>

          <Secao titulo="Amplitude de movimento" n={Object.values(form.adm).filter((v) => !vazio(v.D) || !vazio(v.E)).length}>
            {ADM.map((item, i) => {
              const ant = anterior.adm?.[item.id] || {};
              return (
                <div key={item.id} className="linha" style={{ justifyContent: "space-between", padding: "6px 0", borderTop: i ? "1px solid var(--linha)" : 0 }}>
                  <span style={{ flex: "1 1 200px" }}>{item.articulacao} · {item.movimento}</span>
                  <div className="linha">
                    {(item.unico ? ["D"] : ["D", "E"]).map((lado) => {
                      const id = `adm_${item.id}_${lado}`;
                      return (
                        <div key={lado} className="linha" style={{ gap: 6, flexWrap: "nowrap" }}>
                          <label htmlFor={id} style={{ fontWeight: 600, minWidth: 14 }}>{item.unico ? "valor" : lado}</label>
                          <input id={id} type="text" inputMode="numeric" style={estiloNum} placeholder={vazio(ant[lado]) ? "°" : `antes ${ant[lado]}`}
                            value={form.adm[item.id]?.[lado] ?? ""} onChange={(e) => setLado("adm", item.id, lado, e.target.value.replace(/[^0-9,.-]/g, ""))} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </Secao>

          <Secao titulo="Força muscular (0 a 5)" n={Object.values(form.forca).filter((v) => !vazio(v.D) || !vazio(v.E)).length}>
            {FORCA.map((item, i) => {
              const ant = anterior.forca?.[item.id] || {};
              return (
                <div key={item.id} className="linha" style={{ justifyContent: "space-between", padding: "6px 0", borderTop: i ? "1px solid var(--linha)" : 0 }}>
                  <span style={{ flex: "1 1 200px" }}>{item.nome}</span>
                  <div className="linha">
                    {["D", "E"].map((lado) => {
                      const id = `forca_${item.id}_${lado}`;
                      return (
                        <div key={lado} className="linha" style={{ gap: 6, flexWrap: "nowrap" }}>
                          <label htmlFor={id} style={{ fontWeight: 600, minWidth: 14 }}>{lado}</label>
                          <select id={id} style={estiloSelect} value={form.forca[item.id]?.[lado] ?? ""} onChange={(e) => setLado("forca", item.id, lado, e.target.value)}>
                            <option value="">{vazio(ant[lado]) ? "—" : `antes ${ant[lado]}`}</option>
                            {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </Secao>

          <Secao titulo="Testes funcionais" n={Object.values(form.func).filter((v) => !vazio(v.D) || !vazio(v.E)).length}>
            {FUNCIONAIS.map((item, i) => {
              const ant = anterior.func?.[item.id] || {};
              return (
                <div key={item.id} className="linha" style={{ justifyContent: "space-between", padding: "6px 0", borderTop: i ? "1px solid var(--linha)" : 0 }}>
                  <span style={{ flex: "1 1 200px" }}>{item.nome} <span className="suave">({item.unidade})</span></span>
                  <div className="linha">
                    {(item.lado ? ["D", "E"] : ["D"]).map((lado) => {
                      const id = `func_${item.id}_${lado}`;
                      return (
                        <div key={lado} className="linha" style={{ gap: 6, flexWrap: "nowrap" }}>
                          <label htmlFor={id} style={{ fontWeight: 600, minWidth: 14 }}>{item.lado ? lado : "valor"}</label>
                          <input id={id} type="text" inputMode="decimal" style={estiloNum} placeholder={vazio(ant[lado]) ? item.unidade : `antes ${ant[lado]}`}
                            value={form.func[item.id]?.[lado] ?? ""} onChange={(e) => setLado("func", item.id, lado, e.target.value.replace(/[^0-9,.]/g, ""))} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </Secao>

          <Secao titulo="Palpação e postura" n={form.pg.length + (form.pgObs.trim() ? 1 : 0) + (form.postura.trim() ? 1 : 0) + arquivos.length}>
            {anterior.pg?.length > 0 && <p className="suave" style={{ margin: 0 }}>Antes: {anterior.pg.join(", ")}</p>}
            <div className="chips">
              {REGIOES_CORPO.map((reg) => (
                <label key={reg} className="chip"><input type="checkbox" checked={form.pg.includes(reg)} onChange={() => alternarPg(reg)} /><span>{reg}</span></label>
              ))}
            </div>
            <div>
              <div className="linha" style={{ justifyContent: "space-between" }}>
                <label className="rotulo" htmlFor="pgObs" style={{ margin: 0 }}>Observações da palpação</label>
                <BotaoMicrofone onTexto={(t) => acrescentar("pgObs", t)} />
              </div>
              <textarea id="pgObs" value={form.pgObs} onChange={(e) => setForm({ ...form, pgObs: e.target.value })} style={{ marginTop: 6 }} />
            </div>
            <div>
              <div className="linha" style={{ justifyContent: "space-between" }}>
                <label className="rotulo" htmlFor="postura" style={{ margin: 0 }}>Observações posturais</label>
                <BotaoMicrofone onTexto={(t) => acrescentar("postura", t)} />
              </div>
              <textarea id="postura" value={form.postura} onChange={(e) => setForm({ ...form, postura: e.target.value })} style={{ marginTop: 6 }} />
            </div>
            <div>
              <label className="rotulo" htmlFor="fotos">Fotos posturais (frente, lado e costas)</label>
              {r.fotos_ok === true ? (
                <>
                  <input id="fotos" type="file" accept="image/*" capture="environment" multiple onChange={(e) => setArquivos(Array.from(e.target.files || []))} />
                  {arquivos.length > 0 && <p className="suave" style={{ margin: "6px 0 0" }}>{arquivos.length} foto(s) selecionada(s)</p>}
                </>
              ) : <p className="suave" style={{ margin: 0, fontSize: 14 }}>O paciente não autorizou fotos na ficha.</p>}
            </div>
          </Secao>

          <Secao titulo="Observações gerais" n={form.obs.trim() ? 1 : 0}>
            <div className="linha" style={{ justifyContent: "space-between" }}>
              <label className="rotulo" htmlFor="obs" style={{ margin: 0 }}>Observações</label>
              <BotaoMicrofone onTexto={(t) => acrescentar("obs", t)} />
            </div>
            <textarea id="obs" value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} />
          </Secao>

          <Secao titulo="Conclusão: diagnóstico e plano de tratamento" aberta n={Object.values(form.conclusao || {}).filter((v) => String(v || "").trim()).length}>
            {anterior.conclusao?.diagnostico && <p className="suave" style={{ margin: 0 }}>Diagnóstico anterior: {anterior.conclusao.diagnostico}</p>}
            {CAMPOS_CONCLUSAO.map((c) => {
              const set = (v) => setForm((f) => ({ ...f, conclusao: { ...f.conclusao, [c.id]: v } }));
              return (
                <div key={c.id}>
                  <div className="linha" style={{ justifyContent: "space-between" }}>
                    <label className="rotulo" htmlFor={"c_" + c.id} style={{ margin: 0 }}>{c.nome}</label>
                    {c.area && <BotaoMicrofone onTexto={(t) => set(form.conclusao?.[c.id] ? `${form.conclusao[c.id].trim()} ${t}` : t)} />}
                  </div>
                  {c.area
                    ? <textarea id={"c_" + c.id} value={form.conclusao?.[c.id] || ""} placeholder={c.ph} onChange={(e) => set(e.target.value)} style={{ marginTop: 6, minHeight: 70 }} />
                    : <input id={"c_" + c.id} type="text" value={form.conclusao?.[c.id] || ""} placeholder={c.ph} onChange={(e) => set(e.target.value)} style={{ marginTop: 6 }} />}
                </div>
              );
            })}
          </Secao>

          {msg && <p role="status" style={{ margin: 0 }}>{msg}</p>}
          <button className="botao" disabled={salvando}>{salvando ? "Salvando..." : editando ? "Salvar correção" : reavaliacao ? "Salvar reavaliação" : "Salvar avaliação"}</button>
        </form>

        <section className="cartao">
          <h2 style={{ marginTop: 0 }}>Avaliações anteriores</h2>
          {!avaliacoes.length && <p className="suave">Nenhuma avaliação registrada ainda.</p>}
          {[...avaliacoes].reverse().map((a, i) => {
            const d = a.dados || {};
            const pos = positivos(d);
            const n = contarMedidas(d);
            return (
              <details key={a.id} open={i === 0} style={{ borderTop: i ? "1px solid var(--linha)" : 0, breakInside: "avoid" }}>
                <summary style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <b>{avaliacoes.length - i === 1 ? "Inicial" : `${avaliacoes.length - i}ª`} · {dataCurta(a.data)}</b>
                  <span className="suave" style={{ fontSize: 14 }}>{n} medida(s){pos.length ? ` · ${pos.length} teste(s) positivo(s)` : ""}</span>
                </summary>
                <div style={{ paddingBottom: 12, fontSize: 15 }}>
                {pos.length > 0 && <div className="suave">Positivos: {pos.join(", ")}</div>}
                {d.pg?.length > 0 && <div className="suave">Pontos-gatilho: {d.pg.join(", ")}</div>}
                {d.pgObs && <p style={{ margin: "6px 0 0" }}><b>Palpação:</b> {d.pgObs}</p>}
                {d.postura && <p style={{ margin: "6px 0 0" }}><b>Postura:</b> {d.postura}</p>}
                {d.obs && <p style={{ margin: "6px 0 0" }}>{d.obs}</p>}
                {d.conclusao && (
                  <div style={{ marginTop: 8, padding: "8px 12px", background: "var(--marca-clara)", borderRadius: 10 }}>
                    {CAMPOS_CONCLUSAO.filter((c) => d.conclusao[c.id]).map((c) => <div key={c.id} style={{ margin: "2px 0" }}><b>{c.nome}:</b> {d.conclusao[c.id]}</div>)}
                  </div>
                )}
                {a.fotos?.length > 0 && (
                  <div className="linha" style={{ marginTop: 8 }}>
                    {a.fotos.map((p) => urls[p] ? <a key={p} href={urls[p]} target="_blank" rel="noreferrer"><img src={urls[p]} alt={`Foto da avaliação de ${dataBR(a.data)}`} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }} /></a> : null)}
                  </div>
                )}
                <HistoricoRegistro registro={a} resumo={(x) => { const dd = x.dados || {}; return [x.data && dataBR(x.data), `${contarMedidas(dd)} medida(s)`, positivos(dd).length && `positivos: ${positivos(dd).join(", ")}`, dd.conclusao?.diagnostico && `diagnóstico: ${dd.conclusao.diagnostico}`, dd.obs].filter(Boolean).join(" · "); }} />
                {podeEditar && (
                  <div className="linha nao-imprimir" style={{ marginTop: 8, gap: 8 }}>
                    <button type="button" className="botao sec" style={{ minHeight: 40 }} onClick={() => iniciarEdicao(a)}>Editar</button>
                    <button type="button" className="botao sec" style={{ minHeight: 40, color: "var(--alerta)" }} onClick={() => excluir(a)}>Excluir</button>
                  </div>
                )}
                </div>
              </details>
            );
          })}
          {!podeEditar && avaliacoes.length > 0 && <p className="suave nao-imprimir" style={{ margin: "8px 0 0", fontSize: 13 }}>Para editar ou excluir avaliações, rode o arquivo supabase/historico_registros.sql no Supabase.</p>}
          {excluidas.length > 0 && (
            <details className="nao-imprimir" style={{ borderTop: "1px solid var(--linha)", marginTop: 8 }}>
              <summary className="suave" style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>Avaliações excluídas ({excluidas.length})</summary>
              {excluidas.map((a) => (
                <div key={a.id} className="suave" style={{ fontSize: 14, padding: "4px 0" }}>
                  <s>{dataBR(a.data)} · {contarMedidas(a.dados)} medida(s)</s> — excluída em {dataBR(a.excluido_em)}. Motivo: {a.excluido_motivo}
                </div>
              ))}
            </details>
          )}
        </section>
        <p className="suave nao-imprimir" style={{ margin: 0, fontSize: 13, textAlign: "center" }}>Os testes são sugestões e não substituem o raciocínio clínico.</p>
        </Impressao>
      </main>
    </>
  );
}
