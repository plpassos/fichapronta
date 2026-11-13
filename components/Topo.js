"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Topo() {
  const path = usePathname();
  const router = useRouter();

  async function sair() {
    await createClient().auth.signOut();
    router.replace("/login");
  }

  return (
    <header className="topo">
      <Link href="/painel" className="logo">FichaPronta</Link>
      <nav className="nav" aria-label="Principal">
        <Link href="/painel" className={path.startsWith("/painel") ? "ativo" : ""}>Fichas</Link>
        <Link href="/configurar" className={path.startsWith("/configurar") ? "ativo" : ""}>Minha ficha</Link>
        <Link href="/cadastro" className={path.startsWith("/cadastro") ? "ativo" : ""}>Perfil</Link>
        <button type="button" onClick={sair}>Sair</button>
      </nav>
    </header>
  );
}
