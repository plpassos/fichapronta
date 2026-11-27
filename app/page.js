import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { landingHTML } from "@/lib/landing";

export const metadata = {
  title: "FichaPronta – anamnese e evolução sem papel",
  description: "Ficha de anamnese por link e evolução de cada sessão para fisioterapeutas, massoterapeutas e quiropraxistas.",
};

export default async function Inicio() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/pacientes");
  return <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#fff", color: "#10292B" }} dangerouslySetInnerHTML={{ __html: landingHTML }} />;
}
