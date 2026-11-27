"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { limparRascunhos } from "@/lib/rascunho";

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

  return (
    <header className="topo">
      <Link href="/pacientes" className="logo">FichaPronta</Link>
      <nav className="nav" aria-label="Principal">
        <Link href="/pacientes" className={emPacientes ? "ativo" : ""}>Pacientes</Link>
        <Link href="/painel" className={path === "/painel" ? "ativo" : ""}>+ Novo paciente</Link>
        <Link href="/configurar" className={path.startsWith("/configurar") ? "ativo" : ""}>Minha ficha</Link>
        <Link href="/cadastro" className={path.startsWith("/cadastro") ? "ativo" : ""}>Perfil</Link>
        <button type="button" onClick={sair}>Sair</button>
      </nav>
    </header>
  );
}
