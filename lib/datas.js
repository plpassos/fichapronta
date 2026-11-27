// "2026-11-27T14:30" no horário local, para campos de data e hora
export function agoraLocal(d = new Date()) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 16);
}
