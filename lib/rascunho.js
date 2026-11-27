"use client";

import { useEffect } from "react";

// Rascunhos guardados no próprio aparelho, para não perder o que foi digitado
// se a tela fechar. São apagados ao salvar e ao clicar em "Sair".
const PREFIXOS = ["fp-rascunho-", "ficha-"];

export function lerRascunho(chave, vazio) {
  try {
    const r = JSON.parse(localStorage.getItem(chave) || "null");
    return r && typeof r === "object" ? { ...vazio, ...r } : null;
  } catch { return null; }
}

export function gravarRascunho(chave, form, vazio) {
  try {
    if (JSON.stringify(form) === JSON.stringify(vazio)) localStorage.removeItem(chave);
    else localStorage.setItem(chave, JSON.stringify(form));
  } catch {}
}

// Apaga todos os rascunhos com dados de pacientes deste aparelho
export function limparRascunhos() {
  try {
    Object.keys(localStorage).filter((k) => PREFIXOS.some((p) => k.startsWith(p))).forEach((k) => localStorage.removeItem(k));
  } catch {}
}

// Avisa antes de fechar ou recarregar a página com algo não salvo
export function useAvisoSaida(sujo) {
  useEffect(() => {
    if (!sujo) return;
    const f = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", f);
    return () => window.removeEventListener("beforeunload", f);
  }, [sujo]);
}
