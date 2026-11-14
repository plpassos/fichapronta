"use client";

import { useEffect, useRef, useState } from "react";

// Recursos de voz do próprio navegador (sem custo).
// Ouvir: leitura em voz alta. Microfone: transforma fala em texto (Chrome/Android/Edge).

export function falar(texto) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = "pt-BR";
  u.rate = 0.9;
  const voz = window.speechSynthesis.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith("pt"));
  if (voz) u.voice = voz;
  window.speechSynthesis.speak(u);
}

export function BotaoOuvir({ texto, rotulo = "Ouvir" }) {
  const [suporta, setSuporta] = useState(false);
  useEffect(() => { setSuporta(typeof window !== "undefined" && !!window.speechSynthesis); }, []);
  if (!suporta) return null;
  return (
    <button type="button" className="botao-icone" onClick={() => falar(texto)} aria-label={`${rotulo}: ${texto}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 9a4 4 0 0 1 0 6" /><path d="M19 6a8 8 0 0 1 0 12" /></svg>
      <span>{rotulo}</span>
    </button>
  );
}

export function BotaoMicrofone({ onTexto, rotulo = "Falar" }) {
  const [suporta, setSuporta] = useState(false);
  const [ouvindo, setOuvindo] = useState(false);
  const rec = useRef(null);

  useEffect(() => {
    setSuporta(typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition));
    return () => { try { rec.current?.stop(); } catch {} };
  }, []);

  function alternar() {
    if (ouvindo) { try { rec.current?.stop(); } catch {} return; }
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new R();
    r.lang = "pt-BR";
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (e) => {
      const t = Array.from(e.results).map((x) => x[0].transcript).join(" ").trim();
      if (t) onTexto(t);
    };
    r.onend = () => setOuvindo(false);
    r.onerror = () => setOuvindo(false);
    rec.current = r;
    setOuvindo(true);
    try { r.start(); } catch { setOuvindo(false); }
  }

  if (!suporta) return null;
  return (
    <button type="button" className={"botao-icone" + (ouvindo ? " gravando" : "")} onClick={alternar} aria-pressed={ouvindo} aria-label={ouvindo ? "Parar de gravar" : `${rotulo}: responder falando`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
      <span>{ouvindo ? "Ouvindo... toque para parar" : rotulo}</span>
    </button>
  );
}
