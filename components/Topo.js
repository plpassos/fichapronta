"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { limparRascunhos } from "@/lib/rascunho";

const ICONES = {
  pacientes: <path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM22 19v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8" />,
  novo: <path d="M12 5v14M5 12h14" />,
  ficha: <path d="M9 4h6v3H9zM7 5H5v15h14V5h-2M9 12h6M9 16h4" />,
  perfil: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" />,
};
function Icone({ nome }) {
  return <svg className="nav-icone" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONES[nome]}</svg>;
}

export default function Topo() {
  const path = usePathname();
  const router = useRouter();

  async function sair() {
    // Num computador compartilhado, nada do paciente pode ficar para o próximo usuário
    limparRascunhos();
    await createClient().auth.signOut();
    router.replace("/login");
  }

  // As telas de um paciente (/painel/<id>/...) pertencem à aba Pacientes
  const emPacientes = path.startsWith("/pacientes") || (path.startsWith("/painel/") && path !== "/painel/");
  const itens = [
    { href: "/pacientes", ativo: emPacientes, icone: "pacientes", longo: "Pacientes", curto: "Pacientes" },
    { href: "/painel", ativo: path === "/painel", icone: "novo", longo: "+ Novo paciente", curto: "Novo" },
    { href: "/configurar", ativo: path.startsWith("/configurar"), icone: "ficha", longo: "Configurar ficha", curto: "Ficha" },
    { href: "/cadastro", ativo: path.startsWith("/cadastro"), icone: "perfil", longo: "Perfil", curto: "Perfil" },
  ];

  return (
    <header className="topo">
      <Link href="/pacientes" className="logo">FichaPronta</Link>
      <button type="button" className="sair-topo" onClick={sair}>Sair</button>
      <nav className="nav" aria-label="Principal">
        {itens.map((i) => (
          <Link key={i.href} href={i.href} className={i.ativo ? "ativo" : ""} aria-current={i.ativo ? "page" : undefined}>
            <Icone nome={i.icone} />
            <span className="rot-longo">{i.longo}</span><span className="rot-curto">{i.curto}</span>
          </Link>
        ))}
        <button type="button" className="sair-nav" onClick={sair}>Sair</button>
      </nav>
    </header>
  );
}
