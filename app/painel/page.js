"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Topo from "@/components/Topo";
import { calcularAlertas } from "@/lib/ficha";

function gerarToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 56]).join("");
}

function linkWhatsApp(telefone, texto) {
  let num = (telefone || "").replace(/\D/g, "");
  if (num && !num.startsWith("55")) num = "55" + num;
  return `https://wa.me/${num}?text=${encodeURIComponent(texto)}`;
}

function quando(d) {
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function Painel() {
  const supabase = createClient();
  const [perfil, setPerfil] = useState(null);
  const [fichas, setFichas] = useState([]);
  const [nome, setNome] = useState("");
  const [tel, setTel] = useState("");
  const [gerado, setGerado] = useState(null);
  const [erro, setErro] = useState("");
  const [novas, setNovas] = useState([]);
  const [modo, setModo] = useState("formulario");
  const [criando, setCriando] = useState(false);
  const [facil, setFacil] = useState(true); // uma pergunta por tela (padrão) ou várias

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (!p) return (window.location.href = "/cadastro");
    setPerfil(p);
    const { data } = await supabase.from("fichas").select("*").order("created_at", { ascending: false }).limit(100);
    setFichas((data || []).filter((f) => f.ativo !== false && f.status !== "respondida"));
    setNovas((data || []).filter((f) => f.ativo !== false && f.status === "respondida" && !f.vista_em));
  }

  useEffect(() => { carregar(); }, []);

  async function criar(e) {
    e.preventDefault();
    setErro("");
    const presencial = modo === "presencial";
    const dig = tel.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
    // No atendimento o WhatsApp é opcional; para enviar o link, é obrigatório
    if ((!presencial || dig) && (dig.length < 10 || dig.length > 11)) return setErro("Confira o WhatsApp: use DDD + número, por exemplo (11) 98765-4321.");
    if (nome.trim().length < 2) return setErro("Escreva o nome do paciente.");
    const token = gerarToken();
    setCriando(true);
    const { data: nova, error } = await supabase.from("fichas").insert({
      profissional_id: perfil.id, token, paciente_nome: nome.trim(), paciente_whatsapp: tel.trim(), modo: presencial ? "presencial" : facil ? "formulario" : "formulario_rapido",
    }).select("id").single();
    if (error) { setCriando(false); return setErro(presencial ? "Não foi possível abrir a ficha. Tente de novo." : "Não foi possível gerar o link. Tente de novo."); }
    if (presencial) return (window.location.href = `/f/${token}?p=${nova.id}`);
    setCriando(false);
    const url = `${window.location.origin}/f/${token}${facil ? "" : "?r=1"}`;
    const primeiro = nome.trim().split(" ")[0];
    const texto = `Olá, ${primeiro}! Antes da nossa primeira sessão, preciso de algumas informações. Leva uns 8 minutos: ${url}`;
    setGerado({ url, whats: linkWhatsApp(tel, texto) });
    setNome(""); setTel("");
    carregar();
  }

  if (!perfil) return <><Topo /><main className="conteudo suave">Carregando...</main></>;

  return (
    <>
      <Topo />
      <main className="conteudo grade">
        <section className="cartao pilha">
          <h2 style={{ margin: 0 }}>Novo paciente</h2>
          <form onSubmit={criar} className="pilha">
            <div><label className="rotulo" htmlFor="pn">Nome do paciente</label><input id="pn" type="text" required value={nome} onChange={(e) => setNome(e.target.value)} /></div>
            <div><label className="rotulo" htmlFor="pt">WhatsApp do paciente{modo === "presencial" ? " (opcional)" : ""}</label><input id="pt" type="tel" placeholder="(11) 90000-0000" value={tel} onChange={(e) => setTel(e.target.value)} /></div>
            <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
              <legend className="rotulo">Quem vai preencher a anamnese?</legend>
              <label className="linha" style={{ cursor: "pointer", minHeight: 40 }}><input type="radio" name="modo" checked={modo === "formulario"} onChange={() => setModo("formulario")} /> O paciente, pelo link no WhatsApp</label>
              <label className="linha" style={{ cursor: "pointer", minHeight: 40 }}><input type="radio" name="modo" checked={modo === "presencial"} onChange={() => setModo("presencial")} /> Eu preencho agora, com o paciente</label>
              <label className="linha suave" style={{ minHeight: 40 }}><input type="radio" name="modo" disabled /> Conversa com a assistente (em breve)</label>
            </fieldset>
            {modo === "formulario" && (
              <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
                <legend className="rotulo">Facilidade para preencher</legend>
                <label className="linha" style={{ cursor: "pointer", minHeight: 40, flexWrap: "nowrap", alignItems: "flex-start" }}><input type="radio" name="facil" checked={facil} onChange={() => setFacil(true)} style={{ marginTop: 5 }} /><span><b>Uma pergunta por tela</b><br /><span className="suave">Mais fácil: para idosos ou quem tem dificuldade com o celular</span></span></label>
                <label className="linha" style={{ cursor: "pointer", minHeight: 40, flexWrap: "nowrap", alignItems: "flex-start" }}><input type="radio" name="facil" checked={!facil} onChange={() => setFacil(false)} style={{ marginTop: 5 }} /><span><b>Várias perguntas por tela</b><br /><span className="suave">Mais rápido: para adultos acostumados com o celular</span></span></label>
              </fieldset>
            )}
            <button className="botao" disabled={criando}>{modo === "presencial" ? (criando ? "Abrindo..." : "Começar a anamnese") : "Gerar link"}</button>
          </form>
          {erro && <p className="erro" role="alert">{erro}</p>}
          {gerado && (
            <div className="pilha" style={{ background: "var(--marca-clara)", borderRadius: 12, padding: 14 }}>
              <div style={{ wordBreak: "break-all", fontSize: 14 }}>{gerado.url}</div>
              <div className="linha">
                <a className="botao" href={gerado.whats} target="_blank" rel="noreferrer">Enviar pelo WhatsApp</a>
                <button type="button" className="botao sec" onClick={() => navigator.clipboard.writeText(gerado.url)}>Copiar link</button>
              </div>
            </div>
          )}
        </section>

        <section className="pilha" style={{ gridColumn: "span 2", minWidth: 0 }}>
        {novas.length > 0 && (
          <div className="cartao" style={{ borderColor: "#7FD6A4", background: "#F0FAF4" }} role="status">
            <h2 style={{ margin: "0 0 4px" }}>{novas.length === 1 ? "1 ficha nova respondida" : `${novas.length} fichas novas respondidas`}</h2>
            <p className="suave" style={{ margin: "0 0 8px" }}>Toque para ver. Depois de aberta, ela fica só na aba Pacientes.</p>
            {novas.map((f) => {
              const { alertas, cuidados } = calcularAlertas(f.respostas || {}, f.tecnicas || []);
              return (
                <Link key={f.id} href={`/painel/${f.id}`} className="item-ficha">
                  <div className="linha" style={{ justifyContent: "space-between" }}><b>{f.paciente_nome}</b><span className="suave">respondida {quando(f.respondida_em)}</span></div>
                  <div className="linha" style={{ marginTop: 6, gap: 6 }}>
                    <span className="etiqueta etq-ok">Nova</span>
                    {alertas.length > 0 && <span className="etiqueta etq-alerta">{alertas.length} alerta{alertas.length > 1 ? "s" : ""}</span>}
                    {cuidados.length > 0 && <span className="etiqueta etq-cuidado">{cuidados.length} cuidado{cuidados.length > 1 ? "s" : ""}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        <div className="cartao">
          <h2>Aguardando resposta do formulário</h2>
          {!fichas.length && <p className="suave">Nenhum paciente aguardando resposta. Os pacientes que já responderam ficam na aba Pacientes.</p>}
          {fichas.map((f) => {
            const { alertas, cuidados } = f.respostas ? calcularAlertas(f.respostas, f.tecnicas || []) : { alertas: [], cuidados: [] };
            return (
              <Link key={f.id} href={`/painel/${f.id}`} className="item-ficha">
                <div className="linha" style={{ justifyContent: "space-between" }}>
                  <b>{f.paciente_nome}</b>
                  <span className="suave">{f.status === "respondida" ? `respondida ${quando(f.respondida_em)}` : `enviada ${quando(f.created_at)}`}</span>
                </div>
                <div className="linha" style={{ marginTop: 6, gap: 6 }}>
                  {f.status !== "respondida" && <span className="etiqueta etq-pend">Aguardando resposta</span>}
                  {f.status === "respondida" && alertas.length > 0 && <span className="etiqueta etq-alerta">{alertas.length} alerta{alertas.length > 1 ? "s" : ""}</span>}
                  {f.status === "respondida" && cuidados.length > 0 && <span className="etiqueta etq-cuidado">{cuidados.length} cuidado{cuidados.length > 1 ? "s" : ""}</span>}
                  {f.status === "respondida" && !alertas.length && !cuidados.length && <span className="etiqueta etq-ok">Sem alertas</span>}
                  {f.respostas?.queixa && <span className="suave">{String(f.respostas.queixa).slice(0, 60)}</span>}
                </div>
              </Link>
            );
          })}
        </div>
        </section>
      </main>
    </>
  );
}
