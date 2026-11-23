"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Topo from "@/components/Topo";
import { BotaoMicrofone } from "@/components/Voz";
import { TECNICAS, calcularAlertas } from "@/lib/ficha";

const SINAIS = [
  { id: "pa", nome: "Pressão (mmHg)", ph: "120/80" },
  { id: "fc", nome: "Freq. cardíaca (bpm)", ph: "72" },
  { id: "spo2", nome: "Saturação SpO₂ (%)", ph: "98" },
  { id: "fr", nome: "Freq. respiratória (irpm)", ph: "16" },
  { id: "temp", nome: "Temperatura (°C)", ph: "36,5" },
  { id: "gli", nome: "Glicemia (mg/dL)", ph: "" },
];

const FAIXAS = { fc: [20, 250, "Freq. cardíaca"], spo2: [50, 100, "Saturação"], fr: [4, 60, "Freq. respiratória"], temp: [30, 43, "Temperatura"], gli: [20, 600, "Glicemia"] };
function erroSinais(sinais) {
  for (const [k, bruto] of Object.entries(sinais || {})) {
    const v = String(bruto).trim();
    if (!v) continue;
    if (k === "pa") {
      const m = v.match(/^(\d{2,3})\s*[\/x]\s*(\d{2,3})$/i);
      if (!m || +m[1] < 60 || +m[1] > 260 || +m[2] < 30 || +m[2] > 160 || +m[2] >= +m[1]) return "Confira a pressão: use o formato 120/80.";
      continue;
    }
    const n = Number(v.replace(",", "."));
    const [min, max, nome] = FAIXAS[k] || [];
    if (!min) continue;
    if (!/^\d+([.,]\d+)?$/.test(v) || n < min || n > max) return `Confira ${nome}: use só números (entre ${min} e ${max}).`;
  }
  return "";
}

const FRASES_PADRAO = {
  notas: ["Paciente relata melhora desde a última sessão.", "Sem intercorrências durante a sessão.", "Boa tolerância às técnicas aplicadas."],
  orientacoes: ["Manter as orientações da sessão anterior.", "Evitar esforço intenso nas próximas 24 horas."],
};

const VAZIO = { dor_antes: "", dor_depois: "", sinais: {}, tecnicas: [], regioes: "", notas: "", orientacoes: "" };

function gerarToken() {
  const b = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(b, (x) => "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"[x % 56]).join("");
}
function dataBR(d) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function numOuNulo(v) {
  if (v === "" || v === null || v === undefined) return null;
  return Number(String(v).trim());
}
function dorInvalida(v) {
  const t = String(v ?? "").trim();
  if (!t) return false;
  return !/^\d{1,2}$/.test(t) || Number(t) > 10;
}

export default function Evolucao({ params }) {
  const supabase = createClient();
  const [ficha, setFicha] = useState(undefined);
  const [evolucoes, setEvolucoes] = useState([]);
  const [urls, setUrls] = useState({});
  const [form, setForm] = useState(VAZIO);
  const [arquivos, setArquivos] = useState([]);
  const [autorizou, setAutorizou] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");
  const [userId, setUserId] = useState(null);
  const [frases, setFrases] = useState(FRASES_PADRAO);
  const [podeSalvarFrases, setPodeSalvarFrases] = useState(false);
  const [aviso, setAviso] = useState("");

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user.id);
    const { data: perfil, error: erroPerfil } = await supabase.from("profiles").select("frases").eq("id", user.id).maybeSingle();
    if (!erroPerfil) {
      setPodeSalvarFrases(true);
      const fr = perfil?.frases || {};
      setFrases({
        notas: Array.isArray(fr.notas) ? fr.notas : FRASES_PADRAO.notas,
        orientacoes: Array.isArray(fr.orientacoes) ? fr.orientacoes : FRASES_PADRAO.orientacoes,
      });
    }
    const { data: f } = await supabase.from("fichas").select("*").eq("id", params.id).maybeSingle();
    setFicha(f || null);
    if (!f) return;
    const { data: ev } = await supabase.from("evolucoes").select("*").eq("ficha_id", f.id).order("data", { ascending: false });
    setEvolucoes(ev || []);
    const caminhos = (ev || []).flatMap((e) => e.fotos || []);
    if (caminhos.length) {
      const { data: assinadas } = await supabase.storage.from("fotos").createSignedUrls(caminhos, 3600);
      const mapa = {};
      (assinadas || []).forEach((s) => { if (s.signedUrl) mapa[s.path] = s.signedUrl; });
      setUrls(mapa);
    }
  }

  useEffect(() => { carregar(); }, [params.id]);

  function anexar(k, texto) {
    setForm((f) => {
      const atual = (f[k] || "").trim();
      const sep = k === "regioes" ? ", " : k === "orientacoes" ? "\n" : " ";
      return { ...f, [k]: atual ? atual + sep + texto : texto };
    });
  }

  function repetirUltima() {
    const u = evolucoes[0];
    if (!u) return;
    setForm((f) => ({ ...f, tecnicas: u.tecnicas || [], regioes: u.regioes || "", orientacoes: u.orientacoes || "" }));
    setAviso("Dados da última sessão copiados. Ajuste o que mudou.");
  }

  async function gravarFrases(novas) {
    setFrases(novas);
    if (!podeSalvarFrases) return;
    const { error } = await supabase.from("profiles").update({ frases: novas }).eq("id", userId);
    if (error) setAviso("Não foi possível salvar as frases.");
  }
  function salvarFrase(k) {
    const t = (form[k] || "").trim();
    if (!t || frases[k].includes(t)) return;
    gravarFrases({ ...frases, [k]: [...frases[k], t] });
  }
  function removerFrase(k, i) {
    gravarFrases({ ...frases, [k]: frases[k].filter((_, j) => j !== i) });
  }

  function Frases({ k }) {
    return (
      <div className="pilha" style={{ gap: 6, marginTop: 6 }}>
        <div className="chips">
          {frases[k].map((fr, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", border: "1px solid var(--borda)", borderRadius: 99, background: "var(--fundo)" }}>
              <button type="button" onClick={() => anexar(k, fr)} style={{ minHeight: 40, padding: "0 6px 0 12px", border: 0, background: "none", font: "inherit", fontSize: 14, cursor: "pointer", textAlign: "left" }}>{fr}</button>
              {podeSalvarFrases && <button type="button" aria-label={`Remover frase ${fr}`} onClick={() => removerFrase(k, i)} style={{ minWidth: 36, minHeight: 40, border: 0, background: "none", fontSize: 18, color: "var(--suave)", cursor: "pointer" }}>×</button>}
            </span>
          ))}
        </div>
        {podeSalvarFrases && <button type="button" onClick={() => salvarFrase(k)} disabled={!(form[k] || "").trim()} style={{ alignSelf: "flex-start", minHeight: 36, padding: "0 10px", border: 0, background: "none", color: "var(--marca)", font: "inherit", fontSize: 13, cursor: "pointer" }}>+ Salvar texto atual como frase</button>}
      </div>
    );
  }

  function campo(k) {
    return { value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) };
  }
  function alternarTecnica(id) {
    setForm((f) => ({ ...f, tecnicas: f.tecnicas.includes(id) ? f.tecnicas.filter((t) => t !== id) : [...f.tecnicas, id] }));
  }

  async function salvar(e) {
    e.preventDefault();
    setMsg("");
    if (dorInvalida(form.dor_antes) || dorInvalida(form.dor_depois)) return setMsg("A dor precisa ser um número inteiro de 0 a 10.");
    if (arquivos.length && ficha?.respostas?.fotos_ok !== true) return setMsg("O paciente não autorizou fotos na ficha. Remova as fotos para salvar.");
    const eS = erroSinais(form.sinais);
    if (eS) return setMsg(eS);
    const temSinal = Object.values(form.sinais || {}).some((v) => String(v).trim());
    const vazio = !String(form.dor_antes).trim() && !String(form.dor_depois).trim() && !temSinal && !form.tecnicas.length && !form.regioes.trim() && !form.notas.trim() && !form.orientacoes.trim() && !arquivos.length;
    if (vazio) return setMsg("Preencha pelo menos um campo antes de salvar a evolução.");
    setSalvando(true);
    const fotos = [];
    for (const arq of arquivos) {
      const ext = (arq.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const caminho = `${userId}/${ficha.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("fotos").upload(caminho, arq, { contentType: arq.type });
      if (error) { setSalvando(false); return setMsg("Não foi possível enviar uma das fotos. Tente de novo."); }
      fotos.push(caminho);
    }
    const sinais = Object.fromEntries(Object.entries(form.sinais).filter(([, v]) => String(v).trim()));
    const { error } = await supabase.from("evolucoes").insert({
      ficha_id: ficha.id,
      profissional_id: userId,
      dor_antes: numOuNulo(form.dor_antes),
      dor_depois: numOuNulo(form.dor_depois),
      sinais,
      tecnicas: form.tecnicas,
      regioes: form.regioes.trim() || null,
      notas: form.notas.trim() || null,
      orientacoes: form.orientacoes.trim() || null,
      fotos,
    });
    setSalvando(false);
    if (error) return setMsg("Não foi possível salvar a evolução.");
    setForm(VAZIO); setArquivos([]); setAutorizou(false);
    setMsg("Evolução salva!");
    carregar();
  }

  async function ativarLink() {
    const token = ficha.token_evolucao || gerarToken();
    const { error } = await supabase.from("fichas").update({ token_evolucao: token }).eq("id", ficha.id);
    if (!error) setFicha({ ...ficha, token_evolucao: token });
  }
  async function desativarLink() {
    const { error } = await supabase.from("fichas").update({ token_evolucao: null }).eq("id", ficha.id);
    if (!error) setFicha({ ...ficha, token_evolucao: null });
  }
  async function alternarCompartilhar(k) {
    const c = { ...(ficha.compartilhar || {}), [k]: !ficha.compartilhar?.[k] };
    const { error } = await supabase.from("fichas").update({ compartilhar: c }).eq("id", ficha.id);
    if (!error) setFicha({ ...ficha, compartilhar: c });
  }

  if (ficha === undefined) return <><Topo /><main className="conteudo suave">Carregando...</main></>;
  if (!ficha) return <><Topo /><main className="conteudo">Paciente não encontrado.</main></>;

  const r = ficha.respostas || {};
  const fotosOk = r.fotos_ok === true;
  const { alertas, cuidados } = calcularAlertas(r, ficha.tecnicas || []);
  const ultima = evolucoes[0];
  const cronologica = [...evolucoes].reverse();
  const linkPaciente = ficha.token_evolucao && typeof window !== "undefined" ? `${window.location.origin}/e/${ficha.token_evolucao}` : "";
  let tel = (ficha.paciente_whatsapp || "").replace(/\D/g, "");
  if (tel && !tel.startsWith("55")) tel = "55" + tel;
  const whats = `https://wa.me/${tel}?text=${encodeURIComponent(`Olá, ${ficha.paciente_nome.split(" ")[0]}! Aqui você acompanha a sua evolução no tratamento: ${linkPaciente}`)}`;

  function imprimir() {
    document.querySelectorAll("details").forEach((d) => (d.open = true));
    setTimeout(() => window.print(), 50);
  }
  const nomeTec = (ids) => TECNICAS.filter((t) => ids.includes(t.id)).map((t) => t.nome.split(" (")[0]).join(", ");
  const extrasPreenchidos = [form.regioes.trim() && "regiões", Object.values(form.sinais || {}).some((v) => String(v).trim()) && "sinais vitais", arquivos.length && "fotos"].filter(Boolean);
  const comDor = cronologica.filter((e) => e.dor_antes !== null || e.dor_depois !== null).slice(-8);
  const sumario = { cursor: "pointer", fontWeight: 600, minHeight: 44, display: "flex", alignItems: "center" };

  return (
    <>
      <div className="nao-imprimir"><Topo /></div>
      <main className="conteudo pilha">
        {ficha.ativo === false && <div className="cartao nao-imprimir" style={{ background: "#eceff0" }}>Paciente inativo. Você ainda pode registrar evoluções.</div>}

        <div className="linha" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22 }}>{r.nome || ficha.paciente_nome}</h1>
            <div className="suave" style={{ fontSize: 14 }}>
              {evolucoes.length === 1 ? "1 sessão" : `${evolucoes.length} sessões`}
              {ultima && (ultima.dor_antes !== null || ultima.dor_depois !== null) && <> · última dor {ultima.dor_antes ?? "—"} → {ultima.dor_depois ?? "—"}</>}
            </div>
          </div>
          <div className="linha nao-imprimir" style={{ gap: 8 }}>
            <Link href={`/painel/${ficha.id}`} className="botao sec">Anamnese</Link>
            <Link href={`/painel/${ficha.id}/avaliacao`} className="botao sec">Avaliação</Link>
            <button type="button" className="botao sec" onClick={imprimir} disabled={!evolucoes.length}>PDF</button>
          </div>
        </div>

        {(alertas.length > 0 || cuidados.length > 0) && (
          <div className="nota nao-imprimir" style={{ margin: 0 }}>
            {alertas.length > 0 && <div><b style={{ color: "var(--alerta)" }}>Alerta:</b> {alertas.map((a) => a.resumo || a.titulo || a).join("; ")}</div>}
            {cuidados.length > 0 && <div><b style={{ color: "var(--cuidado)" }}>Cuidado:</b> {cuidados.map((c) => `${c.resumo} → adaptar ${c.adapta}`).join("; ")}</div>}
          </div>
        )}

        <div className="grade">
          <form onSubmit={salvar} className="cartao pilha nao-imprimir">
            <div className="linha" style={{ justifyContent: "space-between" }}>
              <h2 style={{ margin: 0 }}>Nova sessão · {dataBR(new Date())}</h2>
              {evolucoes.length > 0 && <button type="button" className="botao sec" onClick={repetirUltima}>Repetir última</button>}
            </div>
            {aviso && <p role="status" className="suave" style={{ margin: 0 }}>{aviso}</p>}
            <div className="linha" style={{ flexWrap: "nowrap" }}>
              <div style={{ flex: 1 }}><label className="rotulo" htmlFor="da">Dor antes</label><input id="da" type="text" inputMode="numeric" placeholder="0–10" {...campo("dor_antes")} /></div>
              <div style={{ flex: 1 }}><label className="rotulo" htmlFor="dd">Dor depois</label><input id="dd" type="text" inputMode="numeric" placeholder="0–10" {...campo("dor_depois")} /></div>
            </div>

            <div>
              <div className="rotulo">Técnicas</div>
              <div className="chips">
                {TECNICAS.filter((t) => (ficha.tecnicas || []).length === 0 || (ficha.tecnicas || []).includes(t.id)).map((t) => (
                  <label key={t.id} className="chip"><input type="checkbox" checked={form.tecnicas.includes(t.id)} onChange={() => alternarTecnica(t.id)} /><span>{t.nome.split(" (")[0]}</span></label>
                ))}
              </div>
            </div>

            <div><div className="linha" style={{ justifyContent: "space-between", marginBottom: 6 }}><label className="rotulo" htmlFor="notas" style={{ margin: 0 }}>Como foi a sessão</label><BotaoMicrofone onTexto={(t) => anexar("notas", t)} /></div><textarea id="notas" {...campo("notas")} /><Frases k="notas" /></div>
            <div><div className="linha" style={{ justifyContent: "space-between", marginBottom: 6 }}><label className="rotulo" htmlFor="ori" style={{ margin: 0 }}>Para casa</label><BotaoMicrofone onTexto={(t) => anexar("orientacoes", t)} /></div><textarea id="ori" {...campo("orientacoes")} style={{ minHeight: 70 }} /><Frases k="orientacoes" /></div>

            <details style={{ border: "1px solid var(--linha)", borderRadius: 12, padding: "0 14px" }}>
              <summary style={sumario}>Mais detalhes{extrasPreenchidos.length ? ` · ${extrasPreenchidos.join(", ")}` : " (regiões, sinais vitais, fotos)"}</summary>
              <div className="pilha" style={{ paddingBottom: 14 }}>
                <div><div className="linha" style={{ justifyContent: "space-between", marginBottom: 6 }}><label className="rotulo" htmlFor="reg" style={{ margin: 0 }}>Regiões tratadas</label><BotaoMicrofone onTexto={(t) => anexar("regioes", t)} /></div><input id="reg" type="text" {...campo("regioes")} /></div>
                <div>
                  <div className="rotulo">Sinais vitais</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
                    {SINAIS.map((s) => (
                      <div key={s.id}>
                        <label className="suave" htmlFor={"s_" + s.id} style={{ fontSize: 13 }}>{s.nome}</label>
                        <input id={"s_" + s.id} type="text" inputMode="decimal" placeholder={ultima?.sinais?.[s.id] || s.ph} value={form.sinais[s.id] || ""} onChange={(e) => setForm({ ...form, sinais: { ...form.sinais, [s.id]: e.target.value } })} />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="rotulo" htmlFor="fotos">Fotos</label>
                  {fotosOk ? (
                    <>
                      <input id="fotos" type="file" accept="image/*" capture="environment" multiple onChange={(e) => setArquivos(Array.from(e.target.files || []))} />
                      {arquivos.length > 0 && <p className="suave" style={{ margin: "6px 0 0" }}>{arquivos.length} foto(s) selecionada(s)</p>}
                    </>
                  ) : (
                    <p className="suave" style={{ margin: 0, fontSize: 14 }}>O paciente não autorizou fotos na ficha.</p>
                  )}
                </div>
              </div>
            </details>

            {msg && <p role="status" style={{ margin: 0 }}>{msg}</p>}
            <button className="botao" disabled={salvando}>{salvando ? "Salvando..." : "Salvar evolução"}</button>
          </form>

          <section className="pilha" style={{ minWidth: 0 }}>
            {comDor.length > 0 && (
              <div className="cartao">
                <div className="linha" style={{ justifyContent: "space-between" }}>
                  <h2 style={{ margin: 0 }}>Dor por sessão</h2>
                  <span className="suave" style={{ fontSize: 13 }}><span style={{ color: "#9fb5b4" }}>■</span> antes <span style={{ color: "var(--marca)" }}>■</span> depois</span>
                </div>
                <div role="img" aria-label={"Dor antes e depois por sessão: " + comDor.map((e) => `${e.dor_antes ?? "-"} para ${e.dor_depois ?? "-"}`).join(", ")} style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 90, marginTop: 10, borderBottom: "1px solid var(--linha)" }}>
                  {comDor.map((e) => (
                    <div key={e.id} style={{ flex: 1, maxWidth: 48, display: "flex", gap: 2, alignItems: "flex-end", height: "100%" }}>
                      <div style={{ flex: 1, height: `${Math.max((e.dor_antes ?? 0) * 10, 2)}%`, background: "#9fb5b4", borderRadius: "3px 3px 0 0" }} />
                      <div style={{ flex: 1, height: `${Math.max((e.dor_depois ?? 0) * 10, 2)}%`, background: "var(--marca)", borderRadius: "3px 3px 0 0" }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="cartao">
              <h2 style={{ marginTop: 0 }}>Sessões</h2>
              {!evolucoes.length && <p className="suave" style={{ margin: 0 }}>Nenhuma sessão registrada ainda.</p>}
              {evolucoes.map((e, i) => (
                <details key={e.id} open={i === 0} style={{ borderTop: i ? "1px solid var(--linha)" : 0, breakInside: "avoid" }}>
                  <summary style={{ ...sumario, fontWeight: 400, gap: 8, flexWrap: "wrap" }}>
                    <b>{evolucoes.length - i}ª · {dataBR(e.data).slice(0, 5)}</b>
                    {(e.dor_antes !== null || e.dor_depois !== null) && <span className="etiqueta">Dor {e.dor_antes ?? "—"}→{e.dor_depois ?? "—"}</span>}
                    {e.tecnicas?.length > 0 && <span className="suave" style={{ fontSize: 14 }}>{nomeTec(e.tecnicas)}</span>}
                  </summary>
                  <div style={{ padding: "0 0 12px", fontSize: 15 }}>
                    {e.notas && <p style={{ margin: "0 0 6px" }}>{e.notas}</p>}
                    {e.orientacoes && <p style={{ margin: "0 0 6px" }}><b>Para casa:</b> {e.orientacoes}</p>}
                    {e.regioes && <div className="suave">Regiões: {e.regioes}</div>}
                    {Object.keys(e.sinais || {}).length > 0 && <div className="suave">{SINAIS.filter((s) => e.sinais[s.id]).map((s) => `${s.nome.split(" (")[0]} ${e.sinais[s.id]}`).join(" · ")}</div>}
                    {e.fotos?.length > 0 && (
                      <div className="linha" style={{ marginTop: 8 }}>
                        {e.fotos.map((p) => urls[p] ? <a key={p} href={urls[p]} target="_blank" rel="noreferrer"><img src={urls[p]} alt={`Foto da sessão de ${dataBR(e.data)}`} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }} /></a> : null)}
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>

            <details className="cartao nao-imprimir">
              <summary style={sumario}>Link do paciente {ficha.token_evolucao ? <span className="etiqueta etq-ok" style={{ marginLeft: 8 }}>ativo</span> : <span className="suave" style={{ marginLeft: 8, fontWeight: 400 }}>desligado</span>}</summary>
              <div className="pilha" style={{ gap: 10, paddingTop: 8 }}>
                {!r.nasc ? (
                  <p className="suave" style={{ margin: 0 }}>A ficha não tem data de nascimento, que o link usa para proteger os dados. Não é possível ativar.</p>
                ) : ficha.token_evolucao ? (
                  <>
                    <div className="linha">
                      <a className="botao" href={whats} target="_blank" rel="noreferrer">Enviar no WhatsApp</a>
                      <button type="button" className="botao sec" onClick={() => navigator.clipboard.writeText(linkPaciente)}>Copiar link</button>
                      <button type="button" className="botao sec" onClick={desativarLink}>Desligar</button>
                    </div>
                    <p className="suave" style={{ margin: 0, fontSize: 13 }}>O paciente confirma a data de nascimento ao abrir.</p>
                  </>
                ) : (
                  <button type="button" className="botao" onClick={ativarLink}>Ativar link do paciente</button>
                )}
                <div>
                  <div className="rotulo">O paciente vê</div>
                  <div className="chips">
                    {[["dor", "Gráfico da dor"], ["orientacoes", "Para casa"], ["notas", "Anotações"]].map(([k, nome]) => (
                      <label key={k} className="chip"><input type="checkbox" checked={!!ficha.compartilhar?.[k]} onChange={() => alternarCompartilhar(k)} /><span>{nome}</span></label>
                    ))}
                  </div>
                </div>
              </div>
            </details>
          </section>
        </div>
      </main>
    </>
  );
}
