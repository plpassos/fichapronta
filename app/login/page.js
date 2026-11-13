"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function entrarGoogle() {
    setErro("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setErro("Não foi possível entrar com Google. Tente pelo e-mail.");
  }

  async function enviarCodigo(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setCarregando(false);
    if (error) return setErro("Não foi possível enviar o código. Confira o e-mail e tente de novo.");
    setEnviado(true);
  }

  async function confirmarCodigo(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: codigo.trim(),
      type: "email",
    });
    setCarregando(false);
    if (error) return setErro("Código inválido ou vencido. Peça um novo código.");
    router.replace("/painel");
    router.refresh();
  }

  return (
    <main className="estreito pilha">
      <div>
        <div className="logo">FichaPronta</div>
        <h1 style={{ fontSize: 28, margin: "10px 0 6px" }}>Entre para ver as fichas dos seus pacientes</h1>
        <p className="suave" style={{ margin: 0 }}>Sem senha para lembrar. Primeira vez? Entrar já cria sua conta.</p>
      </div>

      <div className="cartao pilha">
        <button type="button" className="botao sec largo" onClick={entrarGoogle}>Entrar com Google</button>
        <div className="suave" style={{ textAlign: "center" }}>ou</div>

        {!enviado ? (
          <form onSubmit={enviarCodigo} className="pilha">
            <div>
              <label className="rotulo" htmlFor="email">Seu e-mail</label>
              <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
            </div>
            <button className="botao largo" disabled={carregando}>{carregando ? "Enviando..." : "Receber código por e-mail"}</button>
          </form>
        ) : (
          <form onSubmit={confirmarCodigo} className="pilha">
            <div>
              <label className="rotulo" htmlFor="codigo">Código enviado para {email}</label>
              <input id="codigo" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={8} required value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="000000" />
            </div>
            <button className="botao largo" disabled={carregando}>{carregando ? "Conferindo..." : "Entrar"}</button>
            <button type="button" className="botao sec largo" onClick={() => { setEnviado(false); setCodigo(""); }}>Usar outro e-mail</button>
          </form>
        )}
        {erro && <p className="erro" role="alert">{erro}</p>}
      </div>
    </main>
  );
}
