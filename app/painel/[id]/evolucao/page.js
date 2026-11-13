"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Topo from "@/components/Topo";
import { TECNICAS, calcularAlertas } from "@/lib/ficha";

const SINAIS = [
  { id: "pa", nome: "Pressão (mmHg)", ph: "120/80" },
  { id: "fc", nome: "Freq. cardíaca (bpm)", ph: "72" },
  { id: "spo2", nome: "Saturação SpO₂ (%)", ph: "98" },
  { id: "fr", nome: "Freq. respiratória (irpm)", ph: "16" },
  { id: "temp", nome: "Temperatura (°C)", ph: "36,5" },
  { id: "gli", nome: "Glicemia (mg/dL)", ph: "" },
];

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
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(10, Math.round(n))) : null;
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

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user.id);
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

  function campo(k) {
    return { value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) };
  }
  function alternarTecnica(id) {
    setForm((f) => ({ ...f, tecnicas: f.tecnicas.includes(id) ? f.tecnicas.filter((t) => t !== id) : [...f.tecnicas, id] }));
  }

  async function salvar(e) {
    e.preventDefault();
    setMsg("");
    if (arquivos.length && !autorizou) return setMsg("Marque que o paciente autorizou as fotos.");
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
  const { alertas, cuidados } = calcularAlertas(r, ficha.tecnicas || []);
  const ultima = evolucoes[0];
  const cronologica = [...evolucoes].reverse();
  const linkPaciente = ficha.token_evolucao && typeof window !== "undefined" ? `${window.location.origin}/e/${ficha.token_evolucao}` : "";
  let tel = (ficha.paciente_whatsapp || "").replace(/\D/g, "");
  if (tel && !tel.startsWith("55")) tel = "55" + tel;
  const whats = `https://wa.me/${tel}?text=${encodeURIComponent(`Olá, ${ficha.paciente_nome.split(" ")[0]}! Aqui você acompanha a sua evolução no tratamento: ${linkPaciente}`)}`;

  return (
    <>
      <div className="nao-imprimir"><Topo /></div>
      <main className="conteudo pilha">
        <div className="linha" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22 }}>{r.nome || ficha.paciente_nome}</h1>
            <div className="suave">
              {r.queixa ? String(r.queixa).slice(0, 80) + " · " : ""}{evolucoes.length} sessões registradas
              {alertas.length > 0 && <> · <b style={{ color: "var(--alerta)" }}>{alertas.length} alerta(s)</b></>}
              {cuidados.length > 0 && <> · <b style={{ color: "var(--cuidado)" }}>{cuidados.length} cuidado(s)</b></>}
            </div>
          </div>
          <div className="linha nao-imprimir">
            <Link href={`/painel/${ficha.id}`} className="botao sec">Ver anamnese</Link>
            <button type="button" className="botao sec" onClick={() => window.print()} disabled={!evolucoes.length}>Exportar todas em PDF</button>
          </div>
        </div>

        <section className="cartao nao-imprimir grade" style={{ gap: 16 }}>
          <div className="pilha" style={{ gap: 8 }}>
            <h2 style={{ margin: 0 }}>Link do paciente</h2>
            {ficha.token_evolucao ? (
              <>
                <div style={{ wordBreak: "break-all", fontSize: 14, background: "var(--fundo)", border: "1px solid var(--borda)", borderRadius: 8, padding: "10px 12px" }}>{linkPaciente}</div>
                <div className="linha">
                  <a className="botao" href={whats} target="_blank" rel="noreferrer">Enviar no WhatsApp</a>
                  <button type="button" className="botao sec" onClick={() => navigator.clipboard.writeText(linkPaciente)}>Copiar</button>
                  <button type="button" className="botao sec" onClick={desativarLink}>Desativar link</button>
                </div>
              </>
            ) : (
              <>
                <p className="suave" style={{ margin: 0 }}>O paciente acompanha a própria evolução por um link privado.</p>
                <button type="button" className="botao" onClick={ativarLink}>Compartilhar com o paciente</button>
              </>
            )}
          </div>
          <div className="pilha" style={{ gap: 4 }}>
            <h2 style={{ margin: "0 0 6px" }}>O que o paciente vê</h2>
            {[["dor", "Gráfico da dor"], ["orientacoes", "Orientações para casa"], ["fotos", "Fotos"], ["notas", "Anotações clínicas da sessão"]].map(([k, nome]) => (
              <label key={k} className="linha" style={{ cursor: "pointer", minHeight: 36 }}>
                <input type="checkbox" checked={!!ficha.compartilhar?.[k]} onChange={() => alternarCompartilhar(k)} style={{ width: 20, height: 20, accentColor: "var(--marca)" }} />
                {nome}
              </label>
            ))}
          </div>
        </section>

        <div className="grade">
          <form onSubmit={salvar} className="cartao pilha nao-imprimir">
            <h2 style={{ margin: 0 }}>Nova evolução · {dataBR(new Date())}</h2>
            <div className="linha" style={{ flexWrap: "nowrap" }}>
              <div style={{ flex: 1 }}><label className="rotulo" htmlFor="da">Dor antes (0–10)</label><input id="da" type="text" inputMode="numeric" {...campo("dor_antes")} /></div>
              <div style={{ flex: 1 }}><label className="rotulo" htmlFor="dd">Dor depois (0–10)</label><input id="dd" type="text" inputMode="numeric" {...campo("dor_depois")} /></div>
            </div>

            <fieldset style={{ border: "1px solid var(--linha)", borderRadius: 12, padding: 14, margin: 0 }}>
              <legend style={{ fontWeight: 600, padding: "0 6px" }}>Sinais vitais (opcional)</legend>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
                {SINAIS.map((s) => (
                  <div key={s.id}>
                    <label className="rotulo" htmlFor={"s_" + s.id} style={{ fontSize: 13 }}>{s.nome}</label>
                    <input id={"s_" + s.id} type="text" inputMode="decimal" placeholder={s.ph} value={form.sinais[s.id] || ""} onChange={(e) => setForm({ ...form, sinais: { ...form.sinais, [s.id]: e.target.value } })} />
                  </div>
                ))}
              </div>
              {ultima && Object.keys(ultima.sinais || {}).length > 0 && (
                <p className="suave" style={{ margin: "10px 0 0" }}>Última sessão: {SINAIS.filter((s) => ultima.sinais[s.id]).map((s) => `${s.nome.split(" (")[0]} ${ultima.sinais[s.id]}`).join(" · ")}</p>
              )}
            </fieldset>

            <div>
              <div className="rotulo">Técnicas usadas hoje</div>
              <div className="chips">
                {TECNICAS.filter((t) => (ficha.tecnicas || []).length === 0 || (ficha.tecnicas || []).includes(t.id)).map((t) => (
                  <label key={t.id} className="chip"><input type="checkbox" checked={form.tecnicas.includes(t.id)} onChange={() => alternarTecnica(t.id)} /><span>{t.nome.split(" (")[0]}</span></label>
                ))}
              </div>
              {cuidados.length > 0 && <div className="nota" style={{ marginTop: 8 }}>Lembrete da ficha: {cuidados.map((c) => `${c.resumo} → adaptar ${c.adapta}`).join("; ")}.</div>}
            </div>

            <div><label className="rotulo" htmlFor="reg">Regiões tratadas</label><input id="reg" type="text" {...campo("regioes")} /></div>
            <div><label className="rotulo" htmlFor="notas">Como foi a sessão</label><textarea id="notas" {...campo("notas")} /></div>
            <div><label className="rotulo" htmlFor="ori">Orientações para casa</label><textarea id="ori" {...campo("orientacoes")} /></div>

            <div>
              <label className="rotulo" htmlFor="fotos">Fotos da sessão</label>
              <input id="fotos" type="file" accept="image/*" capture="environment" multiple onChange={(e) => setArquivos(Array.from(e.target.files || []))} />
              {arquivos.length > 0 && <p className="suave" style={{ margin: "6px 0 0" }}>{arquivos.length} foto(s) selecionada(s)</p>}
              <label className="linha" style={{ marginTop: 8, flexWrap: "nowrap", alignItems: "flex-start", fontSize: 14, cursor: "pointer" }}>
                <input type="checkbox" checked={autorizou} onChange={(e) => setAutorizou(e.target.checked)} style={{ width: 20, height: 20, flexShrink: 0, accentColor: "var(--marca)" }} />
                <span className="suave">O paciente autorizou fotos para acompanhamento clínico. As fotos ficam só no prontuário.</span>
              </label>
            </div>

            {msg && <p role="status" style={{ margin: 0 }}>{msg}</p>}
            <button className="botao" disabled={salvando}>{salvando ? "Salvando..." : "Salvar evolução"}</button>
          </form>

          <section className="pilha" style={{ minWidth: 0 }}>
            {cronologica.some((e) => e.dor_antes !== null || e.dor_depois !== null) && (
              <div className="cartao">
                <h2>Dor ao longo das sessões</h2>
                <div role="img" aria-label={"Dor antes e depois por sessão: " + cronologica.map((e, i) => `${i + 1}ª ${e.dor_antes ?? "-"} para ${e.dor_depois ?? "-"}`).join(", ")} style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 150, borderBottom: "1px solid var(--linha)" }}>
                  {cronologica.map((e) => (
                    <div key={e.id} style={{ flex: 1, display: "flex", gap: 3, alignItems: "flex-end", height: "100%" }}>
                      <div style={{ flex: 1, height: `${(e.dor_antes ?? 0) * 10}%`, background: "#9fb5b4", borderRadius: "4px 4px 0 0" }} />
                      <div style={{ flex: 1, height: `${(e.dor_depois ?? 0) * 10}%`, background: "var(--marca)", borderRadius: "4px 4px 0 0" }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 12 }} className="suave">{cronologica.map((e, i) => <span key={e.id} style={{ flex: 1, textAlign: "center" }}>{i + 1}ª</span>)}</div>
                <div className="linha suave" style={{ marginTop: 6, fontSize: 13 }}><span>■ <span style={{ color: "#9fb5b4" }}>antes</span></span><span>■ <span style={{ color: "var(--marca)" }}>depois</span></span></div>
              </div>
            )}

            <div className="cartao">
              <h2>Sessões</h2>
              {!evolucoes.length && <p className="suave">Nenhuma evolução registrada ainda.</p>}
              {evolucoes.map((e, i) => (
                <article key={e.id} style={{ padding: "12px 0", borderTop: i ? "1px solid var(--linha)" : 0, breakInside: "avoid" }}>
                  <div className="linha" style={{ justifyContent: "space-between" }}>
                    <b>{evolucoes.length - i}ª sessão · {dataBR(e.data)}</b>
                    {(e.dor_antes !== null || e.dor_depois !== null) && <span className="suave">Dor {e.dor_antes ?? "—"} → {e.dor_depois ?? "—"}</span>}
                  </div>
                  {Object.keys(e.sinais || {}).length > 0 && <div className="suave">{SINAIS.filter((s) => e.sinais[s.id]).map((s) => `${s.nome.split(" (")[0]}: ${e.sinais[s.id]}`).join(" · ")}</div>}
                  {e.tecnicas?.length > 0 && <div className="suave">Técnicas: {TECNICAS.filter((t) => e.tecnicas.includes(t.id)).map((t) => t.nome.split(" (")[0]).join(", ")}</div>}
                  {e.regioes && <div className="suave">Regiões: {e.regioes}</div>}
                  {e.notas && <p style={{ margin: "6px 0 0" }}>{e.notas}</p>}
                  {e.orientacoes && <p style={{ margin: "6px 0 0" }}><b>Para casa:</b> {e.orientacoes}</p>}
                  {e.fotos?.length > 0 && (
                    <div className="linha" style={{ marginTop: 8 }}>
                      {e.fotos.map((p) => urls[p] ? <a key={p} href={urls[p]} target="_blank" rel="noreferrer"><img src={urls[p]} alt={`Foto da sessão de ${dataBR(e.data)}`} style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8 }} /></a> : null)}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
