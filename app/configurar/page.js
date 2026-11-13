"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Topo from "@/components/Topo";
import { TECNICAS, OPCIONAIS, PRECAUCOES, montarEtapas, nomesTecnicas } from "@/lib/ficha";

export default function Configurar() {
  const supabase = createClient();
  const [tecnicas, setTecnicas] = useState([]);
  const [opcionais, setOpcionais] = useState({});
  const [carregado, setCarregado] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from("profiles").select("tecnicas, opcionais").eq("id", user.id).maybeSingle();
      if (!data) return (window.location.href = "/cadastro");
      setTecnicas(data.tecnicas || []);
      setOpcionais(data.opcionais || {});
      setCarregado(true);
    })();
  }, []);

  function alternar(id) {
    setMsg("");
    setTecnicas((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  }

  async function salvar() {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").update({ tecnicas, opcionais }).eq("id", user.id);
    setMsg(error ? "Não foi possível salvar." : "Ficha salva!");
  }

  if (!carregado) return <><Topo /><main className="conteudo suave">Carregando...</main></>;

  const etapas = montarEtapas(tecnicas, opcionais);

  return (
    <>
      <Topo />
      <main className="conteudo grade">
        <section className="pilha" style={{ gridColumn: "span 2", minWidth: 0 }}>
          <div>
            <h1 style={{ fontSize: 24, margin: "0 0 4px" }}>Quais técnicas você usa?</h1>
            <p className="suave" style={{ margin: 0 }}>A ficha ganha as perguntas de segurança de cada técnica ligada, e o termo de consentimento é ajustado sozinho.</p>
          </div>
          <div className="cartao">
            {TECNICAS.map((t) => {
              const qs = PRECAUCOES.filter((p) => p.tecnicas.includes(t.id));
              return (
                <label key={t.id} className="sn" style={{ cursor: "pointer" }}>
                  <span><b>{t.nome}</b><br /><span className="suave">{qs.length} perguntas de segurança · {qs.map((q) => q.resumo.toLowerCase()).slice(0, 4).join(", ")}{qs.length > 4 ? "…" : ""}</span></span>
                  <input type="checkbox" checked={tecnicas.includes(t.id)} onChange={() => alternar(t.id)} style={{ width: 24, height: 24, accentColor: "var(--marca)" }} />
                </label>
              );
            })}
          </div>
          <div className="cartao">
            <h2>Perguntas opcionais</h2>
            {OPCIONAIS.map((o) => (
              <label key={o.id} className="sn" style={{ cursor: "pointer" }}>
                <span>{o.nome}</span>
                <input type="checkbox" checked={!!opcionais[o.id]} onChange={() => { setMsg(""); setOpcionais({ ...opcionais, [o.id]: !opcionais[o.id] }); }} style={{ width: 24, height: 24, accentColor: "var(--marca)" }} />
              </label>
            ))}
          </div>
        </section>
        <aside className="cartao pilha">
          <h2 style={{ margin: 0 }}>Resumo da sua ficha</h2>
          <div className="linha">
            <div><div className="numero">{etapas.length}</div><div className="suave">etapas</div></div>
          </div>
          <p className="suave" style={{ margin: 0 }}>Sempre incluídos: identificação, queixa, dor, histórico, sinais de alerta e LGPD.</p>
          <p className="suave" style={{ margin: 0 }}>O termo vai citar: {nomesTecnicas(tecnicas).join(", ") || "nenhuma técnica"}.</p>
          <button type="button" className="botao" onClick={salvar}>Salvar ficha</button>
          {msg && <p role="status" style={{ margin: 0 }}>{msg}</p>}
        </aside>
      </main>
    </>
  );
}
