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

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (!p) return (window.location.href = "/cadastro");
    setPerfil(p);
    const { data } = await supabase.from("fichas").select("*").order("created_at", { ascending: false }).limit(100);
    setFichas((data || []).filter((f) => f.ativo !== false && f.status !== "respondida"));
  }

  useEffect(() => { carregar(); }, []);

  async function criar(e) {
    e.preventDefault();
    setErro("");
    const token = gerarToken();
    const { error } = await supabase.from("fichas").insert({
      profissional_id: perfil.id, token, paciente_nome: nome.trim(), paciente_whatsapp: tel.trim(), modo: "formulario",
    });
    if (error) return setErro("Não foi possível gerar o link. Tente de novo.");
    const url = `${window.location.origin}/f/${token}`;
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
          <h2 style={{ margin: 0 }}>Enviar ficha para um paciente</h2>
          <form onSubmit={criar} className="pilha">
            <div><label className="rotulo" htmlFor="pn">Nome do paciente</label><input id="pn" type="text" required value={nome} onChange={(e) => setNome(e.target.value)} /></div>
            <div><label className="rotulo" htmlFor="pt">WhatsApp do paciente</label><input id="pt" type="tel" placeholder="(11) 90000-0000" value={tel} onChange={(e) => setTel(e.target.value)} /></div>
            <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
              <legend className="rotulo">Como o paciente vai responder?</legend>
              <label className="linha" style={{ cursor: "pointer" }}><input type="radio" name="modo" defaultChecked /> Formulário</label>
              <label className="linha suave"><input type="radio" name="modo" disabled /> Conversa com a assistente (em breve)</label>
            </fieldset>
            <button className="botao">Gerar link</button>
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

        <section className="cartao" style={{ gridColumn: "span 2", minWidth: 0 }}>
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
        </section>
      </main>
    </>
  );
}
