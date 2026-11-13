"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Topo from "@/components/Topo";

function limparSlug(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

export default function Cadastro() {
  const supabase = createClient();
  const router = useRouter();
  const [form, setForm] = useState({ nome: "", profissao: "Fisioterapeuta", registro: "", whatsapp: "", slug: "" });
  const [novo, setNovo] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) {
        setNovo(false);
        setForm({ nome: data.nome || "", profissao: data.profissao || "Fisioterapeuta", registro: data.registro || "", whatsapp: data.whatsapp || "", slug: data.slug || "" });
      }
    })();
  }, []);

  function campo(k) {
    return { value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) };
  }

  async function salvar(e) {
    e.preventDefault();
    setErro("");
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    const dados = { id: user.id, ...form, slug: limparSlug(form.slug || form.nome) || null };
    const { error } = await supabase.from("profiles").upsert(dados);
    setSalvando(false);
    if (error) {
      return setErro(error.code === "23505" ? "Esse endereço de link já está em uso. Escolha outro." : "Não foi possível salvar. Tente de novo.");
    }
    router.push(novo ? "/configurar" : "/painel");
  }

  return (
    <>
      {!novo && <Topo />}
      <main className="estreito pilha">
        <h1 style={{ fontSize: 24, margin: 0 }}>{novo ? "Bem-vindo! Vamos montar seu perfil" : "Seu perfil"}</h1>
        <form onSubmit={salvar} className="cartao pilha">
          <div><label className="rotulo" htmlFor="nome">Nome que o paciente vai ver</label><input id="nome" type="text" required {...campo("nome")} /></div>
          <div>
            <label className="rotulo" htmlFor="prof">Profissão</label>
            <select id="prof" {...campo("profissao")}>
              <option>Fisioterapeuta</option><option>Massoterapeuta</option><option>Quiropraxista</option><option>Outra</option>
            </select>
          </div>
          <div><label className="rotulo" htmlFor="reg">Registro profissional (opcional)</label><input id="reg" type="text" placeholder="Ex.: CREFITO-3 000000-F" {...campo("registro")} /></div>
          <div><label className="rotulo" htmlFor="wa">Seu WhatsApp</label><input id="wa" type="tel" placeholder="(11) 90000-0000" {...campo("whatsapp")} /></div>
          <div>
            <label className="rotulo" htmlFor="slug">Nome curto para seus links</label>
            <p className="dica">Só letras, números e hífen. Ex.: lucas-passos</p>
            <input id="slug" type="text" {...campo("slug")} />
          </div>
          {erro && <p className="erro" role="alert">{erro}</p>}
          <button className="botao largo" disabled={salvando}>{salvando ? "Salvando..." : novo ? "Continuar: escolher técnicas" : "Salvar"}</button>
        </form>
      </main>
    </>
  );
}
