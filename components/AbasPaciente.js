import Link from "next/link";

// Abas iguais nas três telas do paciente, para trocar com um toque
export default function AbasPaciente({ id, atual }) {
  const abas = [
    { id: "evolucao", nome: "Evolução", href: `/painel/${id}/evolucao` },
    { id: "anamnese", nome: "Anamnese", href: `/painel/${id}` },
    { id: "avaliacao", nome: "Avaliação", href: `/painel/${id}/avaliacao` },
  ];
  return (
    <nav className="abas nao-imprimir" aria-label="Telas do paciente">
      <Link href="/pacientes" className="aba-voltar" aria-label="Voltar para Pacientes">←</Link>
      {abas.map((a) => (
        <Link key={a.id} href={a.href} className={a.id === atual ? "ativa" : ""} aria-current={a.id === atual ? "page" : undefined}>{a.nome}</Link>
      ))}
    </nav>
  );
}
