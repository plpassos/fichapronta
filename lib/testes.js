// Catálogo da Avaliação física.
// IMPORTANTE: esta lista é uma SUGESTÃO e deve ser revisada clinicamente pelo profissional.
// O app apenas REGISTRA os resultados; ele não interpreta testes nem sugere diagnóstico.

export const REGIOES = [
  {
    id: "lombar", nome: "Lombar",
    palavras: ["lombar", "coluna", "costas", "lombo", "ciatic", "ciátic", "lombalgia"],
    testes: [
      { id: "lasegue", nome: "Lasègue / elevação da perna estendida (SLR)" },
      { id: "slump", nome: "Slump" },
      { id: "schober", nome: "Schober" },
      { id: "kemp", nome: "Extensão-rotação (Kemp)" },
    ],
  },
  {
    id: "cervical", nome: "Cervical",
    palavras: ["cervical", "pescoço", "pescoco", "nuca", "torcicolo"],
    testes: [
      { id: "spurling", nome: "Spurling" },
      { id: "distracao_cervical", nome: "Distração cervical" },
      { id: "ultt", nome: "Tensão neural do membro superior (ULTT)" },
    ],
  },
  {
    id: "ombro", nome: "Ombro",
    palavras: ["ombro", "ombros", "manguito", "escápula", "escapula"],
    testes: [
      { id: "neer", nome: "Neer" },
      { id: "hawkins", nome: "Hawkins-Kennedy" },
      { id: "jobe", nome: "Jobe (lata vazia)" },
      { id: "speed", nome: "Speed" },
      { id: "apprehension", nome: "Apreensão (Apprehension)" },
    ],
  },
  {
    id: "quadril", nome: "Quadril",
    palavras: ["quadril", "virilha", "glúteo", "gluteo", "bacia"],
    testes: [
      { id: "thomas", nome: "Thomas" },
      { id: "ober", nome: "Ober" },
      { id: "faber", nome: "FABER (Patrick)" },
      { id: "fadir", nome: "FADIR" },
    ],
  },
  {
    id: "joelho", nome: "Joelho",
    palavras: ["joelho", "joelhos", "menisco", "patela", "rótula", "rotula"],
    testes: [
      { id: "lachman", nome: "Lachman" },
      { id: "gaveta_anterior", nome: "Gaveta anterior" },
      { id: "mcmurray", nome: "McMurray" },
      { id: "valgo", nome: "Estresse em valgo" },
      { id: "varo", nome: "Estresse em varo" },
    ],
  },
  {
    id: "punho", nome: "Punho e mão",
    palavras: ["punho", "mão", "mao", "dedo", "dedos", "túnel", "tunel"],
    testes: [
      { id: "phalen", nome: "Phalen" },
      { id: "tinel", nome: "Tinel" },
      { id: "finkelstein", nome: "Finkelstein" },
    ],
  },
  {
    id: "tornozelo", nome: "Tornozelo e pé",
    palavras: ["tornozelo", "pé", "pe ", "calcanhar", "tendão de aquiles", "aquiles", "entorse"],
    testes: [
      { id: "gaveta_tornozelo", nome: "Gaveta anterior do tornozelo" },
      { id: "thompson", nome: "Thompson" },
    ],
  },
];

// unico: true = valor único (sem lado), guardado em "D"
export const ADM = [
  { id: "ombro_flexao", articulacao: "Ombro", movimento: "Flexão" },
  { id: "ombro_abducao", articulacao: "Ombro", movimento: "Abdução" },
  { id: "ombro_ri", articulacao: "Ombro", movimento: "Rotação interna" },
  { id: "ombro_re", articulacao: "Ombro", movimento: "Rotação externa" },
  { id: "cotovelo_flexao", articulacao: "Cotovelo", movimento: "Flexão" },
  { id: "punho_flexao", articulacao: "Punho", movimento: "Flexão" },
  { id: "punho_extensao", articulacao: "Punho", movimento: "Extensão" },
  { id: "cervical_flexao", articulacao: "Cervical", movimento: "Flexão", unico: true },
  { id: "cervical_extensao", articulacao: "Cervical", movimento: "Extensão", unico: true },
  { id: "cervical_rotacao", articulacao: "Cervical", movimento: "Rotação" },
  { id: "cervical_inclinacao", articulacao: "Cervical", movimento: "Inclinação" },
  { id: "tronco_flexao", articulacao: "Tronco", movimento: "Flexão", unico: true },
  { id: "tronco_extensao", articulacao: "Tronco", movimento: "Extensão", unico: true },
  { id: "quadril_flexao", articulacao: "Quadril", movimento: "Flexão" },
  { id: "quadril_abducao", articulacao: "Quadril", movimento: "Abdução" },
  { id: "quadril_ri", articulacao: "Quadril", movimento: "Rotação interna" },
  { id: "quadril_re", articulacao: "Quadril", movimento: "Rotação externa" },
  { id: "joelho_flexao", articulacao: "Joelho", movimento: "Flexão" },
  { id: "tornozelo_dorsi", articulacao: "Tornozelo", movimento: "Dorsiflexão" },
  { id: "tornozelo_plantar", articulacao: "Tornozelo", movimento: "Flexão plantar" },
];

export const FORCA = [
  { id: "flexores_ombro", nome: "Flexores do ombro" },
  { id: "abdutores_ombro", nome: "Abdutores do ombro" },
  { id: "rotadores_ext_ombro", nome: "Rotadores externos do ombro" },
  { id: "biceps", nome: "Flexores do cotovelo (bíceps)" },
  { id: "triceps", nome: "Extensores do cotovelo (tríceps)" },
  { id: "preensao", nome: "Preensão da mão" },
  { id: "flexores_quadril", nome: "Flexores do quadril" },
  { id: "gluteo_medio", nome: "Abdutores do quadril (glúteo médio)" },
  { id: "gluteo_maximo", nome: "Extensores do quadril (glúteo máximo)" },
  { id: "quadriceps", nome: "Quadríceps" },
  { id: "isquiotibiais", nome: "Isquiotibiais" },
  { id: "dorsiflexores", nome: "Dorsiflexores do tornozelo" },
  { id: "flexores_plantares", nome: "Flexores plantares (panturrilha)" },
];

export const FUNCIONAIS = [
  { id: "tug", nome: "TUG (levantar e caminhar cronometrado)", unidade: "s", lado: false },
  { id: "sentar_levantar", nome: "Sentar e levantar em 30 s", unidade: "repetições", lado: false },
  { id: "apoio_unipodal", nome: "Apoio em uma perna", unidade: "s", lado: true },
  { id: "caminhada_6min", nome: "Caminhada de 6 minutos", unidade: "m", lado: false },
];

export const REGIOES_CORPO = [
  "Trapézio superior D", "Trapézio superior E",
  "Levantador da escápula D", "Levantador da escápula E",
  "Esternocleidomastoideo D", "Esternocleidomastoideo E",
  "Suboccipitais",
  "Romboides D", "Romboides E",
  "Infraespinal D", "Infraespinal E",
  "Peitoral D", "Peitoral E",
  "Paravertebrais torácicos",
  "Paravertebrais lombares",
  "Quadrado lombar D", "Quadrado lombar E",
  "Glúteo médio D", "Glúteo médio E",
  "Piriforme D", "Piriforme E",
  "Tensor da fáscia lata D", "Tensor da fáscia lata E",
  "Isquiotibiais D", "Isquiotibiais E",
  "Panturrilha D", "Panturrilha E",
];

function normalizar(s) {
  return String(s || "").toLowerCase();
}

// Ordena as regiões pelas palavras encontradas na queixa e no local de dor da anamnese.
export function sugerirRegioes(respostas = {}) {
  const local = Array.isArray(respostas.local) ? respostas.local.join(" ") : respostas.local;
  const texto = normalizar([respostas.queixa, local].filter(Boolean).join(" "));
  const pontuadas = REGIOES.map((r, i) => ({
    r, i,
    pontos: texto ? r.palavras.filter((p) => texto.includes(normalizar(p))).length : 0,
  }));
  pontuadas.sort((a, b) => b.pontos - a.pontos || a.i - b.i);
  return pontuadas.map((x) => ({ ...x.r, sugerida: x.pontos > 0 }));
}

export function nomeTeste(id) {
  for (const r of REGIOES) {
    const t = r.testes.find((x) => x.id === id);
    if (t) return t.nome;
  }
  return id;
}
