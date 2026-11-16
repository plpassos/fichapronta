"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("erro")) setErro("O link expirou ou foi aberto em outro navegador. Peça um novo link e abra neste mesmo navegador.");
  }, []);

  async function entrarGoogle() {
    setErro("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setErro("Não foi possível entrar com Google. Tente pelo e-mail.");
  }

  async function enviarLink(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setCarregando(false);
    if (error) {
      const muitas = /rate|seconds|limit/i.test(error.message || "");
      return setErro(muitas ? "Muitos pedidos seguidos. Espere 1 minuto e tente de novo." : "Não foi possível enviar o link. Confira o e-mail e tente de novo.");
    }
    setEnviado(true);
  }

  return (
    <main className="estreito pilha">
      <div>
        <div className="logo">FichaPronta</div>
        <h1 style={{ fontSize: 28, margin: "10px 0 6px" }}>Entre para ver as fichas dos seus pacientes</h1>
        <p className="suave" style={{ margin: 0 }}>Sem senha para lembrar: enviamos um link de acesso para o seu e-mail. Primeira vez? Entrar já cria sua conta.</p>
      </div>

      <div className="cartao pilha">
        <button type="button" className="botao sec largo" onClick={entrarGoogle}>Entrar com Google</button>
        <div className="suave" style={{ textAlign: "center" }}>ou</div>

        {!enviado ? (
          <form onSubmit={enviarLink} className="pilha">
            <div>
              <label className="rotulo" htmlFor="email">Seu e-mail</label>
              <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
            </div>
            <button className="botao largo" disabled={carregando}>{carregando ? "Enviando..." : "Receber link de acesso"}</button>
          </form>
        ) : (
          <div className="pilha" role="status">
            <p style={{ margin: 0, fontSize: 17 }}><b>Enviamos um link para {email}.</b></p>
            <p className="suave" style={{ margin: 0 }}>Abra o e-mail <b>neste mesmo aparelho e navegador</b> e toque em “Log In” para entrar. Não chegou? Olhe a caixa de spam e as Promoções.</p>
            <button type="button" className="botao sec largo" onClick={() => setEnviado(false)}>Usar outro e-mail</button>
          </div>
        )}
        {erro && <p className="erro" role="alert">{erro}</p>}
      </div>
    </main>
  );
}
