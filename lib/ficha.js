// Perguntas da ficha de anamnese. A base veio da ficha do Lucas Passos;
// as perguntas por técnica são montadas conforme o que o profissional ativou.
// IMPORTANTE: revise clinicamente as perguntas das técnicas novas antes de usar.

export const TECNICAS = [
  { id: "miofascial", nome: "Liberação miofascial" },
  { id: "dry_needling", nome: "Agulhamento a seco (dry needling)" },
  { id: "ventosa", nome: "Ventosaterapia" },
  { id: "quiropraxia", nome: "Quiropraxia / manipulação articular" },
  { id: "massagem", nome: "Massagem relaxante / terapêutica" },
  { id: "eletro", nome: "Eletroterapia (TENS, ultrassom)" },
  { id: "pilates", nome: "Pilates / exercício terapêutico" },
  { id: "cinesio", nome: "Cinesioterapia (exercícios terapêuticos)" },
  { id: "terapia_manual", nome: "Terapia manual / mobilização articular" },
  { id: "laser", nome: "Laser / fotobiomodulação" },
  { id: "bandagem", nome: "Bandagem elástica (kinesio taping)" },
  { id: "rpg", nome: "RPG / reeducação postural" },
  { id: "respiratoria", nome: "Fisioterapia respiratória" },
];

export const OPCIONAIS = [
  { id: "endereco", nome: "Endereço do atendimento (home-care)" },
  { id: "competicao", nome: "Competição ou prova esportiva marcada" },
  { id: "habitos", nome: "Hábitos: sono, estresse, água, tabagismo" },
];

export const SINAIS_ALERTA = [
  { id: "a_peso", q: "Você perdeu peso sem motivo (sem dieta nem exercício) nos últimos meses?", resumo: "Perda de peso sem explicação" },
  { id: "a_febre", q: "Você está com febre, calafrios ou alguma infecção no momento?", resumo: "Febre, calafrios ou infecção ativa" },
  { id: "a_dor", q: "Você tem uma dor que não alivia em nenhuma posição, nem em repouso, nem à noite?", resumo: "Dor que não alivia em nenhuma posição nem em repouso" },
  { id: "a_cancer", q: "Você tem ou já teve câncer?", resumo: "Histórico de câncer", detalhe: "Qual tipo e quando? Ainda faz tratamento?" },
  { id: "a_queda", q: "Você sofreu queda, acidente ou pancada forte nas últimas semanas?", resumo: "Queda ou trauma forte recente" },
  { id: "a_fraqueza", q: "Você sente as pernas ou os braços ficando cada vez mais fracos?", resumo: "Fraqueza progressiva em pernas ou braços" },
  { id: "a_urina", q: "Você notou dificuldade para segurar ou soltar a urina ou as fezes, ou dormência na região íntima?", resumo: "Alteração para urinar ou evacuar, ou dormência na região íntima" },
  { id: "a_trombose", q: "Você está com uma panturrilha (batata da perna) inchada, quente e dolorida?", resumo: "Panturrilha inchada, quente e dolorida" },
];

// tecnicas: em quais técnicas a pergunta aparece; adapta: o que muda se a resposta for Sim
export const PRECAUCOES = [
  { id: "p_anticoag", q: "Você toma remédio para afinar o sangue (anticoagulante) ou tem algum problema de coagulação?", resumo: "Anticoagulante ou distúrbio de coagulação", tecnicas: ["dry_needling", "ventosa", "miofascial", "quiropraxia", "terapia_manual"], adapta: "agulhamento, ventosa, manipulação e pressão forte" },
  { id: "p_gravidez", q: "Você está grávida ou existe chance de estar?", resumo: "Gravidez ou possibilidade", tecnicas: ["dry_needling", "ventosa", "eletro", "massagem", "quiropraxia", "laser"], adapta: "técnicas na barriga e na lombar, agulhamento, ventosa, eletroterapia e laser" },
  { id: "p_pele", q: "Você tem ferida, queimadura, problema de pele ou varizes na região que será tratada?", resumo: "Feridas, lesões de pele ou varizes na região", tecnicas: ["miofascial", "ventosa", "massagem", "dry_needling", "bandagem", "laser", "terapia_manual"], adapta: "todas as técnicas nesse local" },
  { id: "p_cirurgia", q: "Você fez cirurgia ou quebrou algum osso nos últimos 3 meses?", resumo: "Cirurgia ou fratura nos últimos 3 meses", tecnicas: ["miofascial", "dry_needling", "ventosa", "quiropraxia", "massagem", "eletro", "pilates", "cinesio", "terapia_manual", "rpg"], adapta: "todas as técnicas nesse local" },
  { id: "p_osteo", q: "Você tem osteoporose (ossos frágeis)?", resumo: "Osteoporose", tecnicas: ["miofascial", "quiropraxia", "terapia_manual"], adapta: "pressão forte e manipulação" },
  { id: "p_diabetes", q: "Você tem diabetes ou alguma parte do corpo com pouca sensibilidade na pele?", resumo: "Diabetes ou alteração de sensibilidade", tecnicas: ["ventosa", "miofascial", "eletro", "bandagem"], adapta: "ventosa, pressão forte, eletroterapia e bandagem" },
  { id: "p_marcapasso", q: "Você usa marca-passo?", resumo: "Marca-passo", tecnicas: ["dry_needling", "eletro"], adapta: "agulhamento e eletroterapia" },
  { id: "p_implante", q: "Você tem placa, pino ou prótese de metal no corpo?", resumo: "Implante metálico", tecnicas: ["eletro"], adapta: "eletroterapia sobre a região" },
  { id: "p_epilepsia", q: "Você tem epilepsia ou já teve convulsões?", resumo: "Epilepsia ou convulsões", tecnicas: ["dry_needling"], adapta: "agulhamento a seco" },
  { id: "p_agulha", q: "Você tem muito medo de agulhas?", resumo: "Medo intenso de agulhas", tecnicas: ["dry_needling"], adapta: "agulhamento a seco" },
  { id: "p_metal", q: "Você tem alergia a metais, como o níquel de bijuterias e fivelas?", resumo: "Alergia a metais (níquel)", tecnicas: ["dry_needling"], adapta: "agulhamento a seco" },
  { id: "p_linfedema", q: "Você tem linfedema (inchaço permanente em braço ou perna) ou já retirou gânglios (ínguas) em cirurgia?", resumo: "Linfedema ou retirada de linfonodos", tecnicas: ["miofascial", "massagem", "ventosa", "terapia_manual"], adapta: "todas as técnicas no braço ou perna afetado" },
  { id: "p_imuno", q: "Você está com a imunidade baixa (por quimioterapia ou uso prolongado de corticoide)?", resumo: "Imunidade baixa", tecnicas: ["dry_needling", "ventosa"], adapta: "agulhamento e ventosa" },
  { id: "p_oleo", q: "Você tem alergia a óleos, cremes ou perfumes?", resumo: "Alergia a óleos ou cremes", tecnicas: ["massagem"], adapta: "produtos usados na massagem" },
  { id: "p_cardiaco", q: "Você tem pressão alta ou algum problema no coração?", resumo: "Pressão alta ou problema cardíaco", tecnicas: ["pilates", "cinesio", "respiratoria", "rpg"], adapta: "intensidade dos exercícios" },
  { id: "p_tontura", q: "Você sente tontura com frequência, principalmente ao virar o pescoço ou levantar rápido?", resumo: "Tontura frequente", tecnicas: ["pilates", "quiropraxia", "cinesio", "terapia_manual"], adapta: "manipulação cervical e mudanças rápidas de posição" },
  { id: "p_artrite", q: "Você tem artrite reumatoide ou outra doença inflamatória nas articulações?", resumo: "Artrite reumatoide ou doença articular inflamatória", tecnicas: ["quiropraxia", "terapia_manual"], adapta: "manipulação articular" },
  { id: "p_coluna", q: "Você já fez cirurgia na coluna ou tem prótese em alguma articulação?", resumo: "Cirurgia na coluna ou prótese articular", tecnicas: ["quiropraxia", "terapia_manual", "rpg"], adapta: "manipulação na região" },
  { id: "p_adesivo", q: "Você tem alergia ou irritação na pele com esparadrapo, curativo ou fita adesiva?", resumo: "Alergia a adesivo", tecnicas: ["bandagem"], adapta: "bandagem elástica" },
];

const SIM_NAO = ["Sim", "Não"];

export function nomesTecnicas(tecnicas = []) {
  return TECNICAS.filter((t) => tecnicas.includes(t.id)).map((t) => t.nome);
}

export function precaucoesAtivas(tecnicas = []) {
  return PRECAUCOES.filter((p) => p.tecnicas.some((t) => tecnicas.includes(t)));
}

// Explicações curtas para termos difíceis (aparecem embaixo da pergunta)
export const DICAS = {
  a_urina: "Por exemplo: escapar xixi ou fezes sem querer, ou não conseguir urinar.",
  a_trombose: "Batata da perna inchada, quente e doendo ao mesmo tempo.",
  p_anticoag: "São remédios que deixam o sangue mais fino, usados para evitar trombose ou derrame. Se não souber, marque \"Não sei\".",
  p_osteo: "Doença que deixa os ossos fracos e mais fáceis de quebrar.",
  p_diabetes: "Também vale se você sente pouco o toque em alguma parte da pele.",
  p_marcapasso: "Aparelho colocado no peito para controlar os batimentos do coração.",
  p_implante: "Por exemplo: placa, parafuso ou prótese colocados em cirurgia.",
  p_linfedema: "Inchaço que não passa em um braço ou perna, às vezes depois de cirurgia.",
  p_imuno: "Quando o corpo fica com menos defesa contra infecções.",
  p_artrite: "Doença que inflama e deforma as juntas, como as dos dedos.",
};

// Regiões do mapa do corpo. Retângulos em um boneco de 120 x 260, vista de frente;
// regiões com lado guardam a forma do lado DIREITO do paciente (que fica à esquerda de quem olha a frente).
export const CORPO = [
  { id: "pescoco", nome: "Pescoço", vistas: "fc", r: [52, 38, 16, 12] },
  { id: "ombro", nome: "Ombro", lado: true, vistas: "fc", r: [24, 50, 20, 16] },
  { id: "braco", nome: "Braço / cotovelo", lado: true, vistas: "fc", r: [12, 68, 14, 44] },
  { id: "mao", nome: "Punho / mão", lado: true, vistas: "fc", r: [8, 114, 14, 26] },
  { id: "peito", nome: "Peito", vistas: "f", r: [44, 52, 32, 30] },
  { id: "barriga", nome: "Barriga", vistas: "f", r: [44, 84, 32, 28] },
  { id: "costas", nome: "Costas (parte de cima)", vistas: "c", r: [42, 52, 36, 32] },
  { id: "lombar", nome: "Lombar (parte de baixo das costas)", vistas: "c", r: [42, 86, 36, 26] },
  { id: "quadril", nome: "Quadril / glúteo", lado: true, vistas: "fc", r: [40, 114, 20, 22] },
  { id: "coxa", nome: "Coxa", lado: true, vistas: "fc", r: [40, 138, 19, 46] },
  { id: "joelho", nome: "Joelho", lado: true, vistas: "fc", r: [41, 186, 17, 16] },
  { id: "perna", nome: "Perna / panturrilha", lado: true, vistas: "fc", r: [41, 204, 17, 34] },
  { id: "pe", nome: "Tornozelo / pé", lado: true, vistas: "fc", r: [39, 240, 20, 14] },
];

export function regioesCorpo() {
  const lista = [];
  for (const c of CORPO) {
    if (!c.lado) { lista.push({ nome: c.nome, base: c }); continue; }
    lista.push({ nome: `${c.nome} (lado direito)`, base: c, lado: "D" });
    lista.push({ nome: `${c.nome} (lado esquerdo)`, base: c, lado: "E" });
  }
  return lista;
}

export function montarEtapas(tecnicas = [], opcionais = {}) {
  const identificacao = [
    { id: "nome", label: "Qual é o seu nome completo?", type: "text", req: true },
    { id: "nasc", label: "Qual é a sua data de nascimento?", type: "data3" },
    { id: "tel", label: "Qual é o seu WhatsApp (com DDD)?", type: "tel", req: true, ph: "(11) 90000-0000" },
  ];
  if (opcionais.endereco) {
    identificacao.push({ id: "endereco", label: "Em qual endereço será o atendimento?", hint: "Rua, número, bairro e cidade.", type: "text", voz: true });
  }
  identificacao.push(
    { id: "profissao", label: "Qual é a sua profissão?", hint: "Ex.: pedreiro, professora, motorista, aposentado(a)", type: "text", voz: true },
    { id: "esporte", label: "Você faz atividade física ou esporte?", type: "radio", opts: SIM_NAO, other: "Sim", otherPh: "Qual e quantas vezes por semana?" }
  );

  const etapas = [
    { title: "Sobre você", intro: "Seus dados para contato.", fields: identificacao },
    {
      title: "O que você está sentindo",
      intro: "Conte com suas palavras. Não existe resposta certa ou errada.",
      fields: [
        { id: "queixa", label: "Qual é o principal problema que fez você procurar o atendimento?", hint: "Ex.: dor nas costas, pescoço travado, dor no ombro. Pode responder falando.", type: "textarea", req: true, voz: true },
        { id: "desde", label: "Há quanto tempo você sente isso?", type: "radio", opts: ["Menos de 1 semana", "1 a 4 semanas", "1 a 6 meses", "Mais de 6 meses"] },
        { id: "inicio", label: "Como esse problema começou?", type: "radio", opts: ["Depois de uma queda ou pancada", "Depois de um esforço", "Por má postura", "Começou sem motivo", "Outro"], other: "Outro", otherPh: "Conte como começou" },
        { id: "trat", label: "Você já fez algum tratamento para isso?", type: "radio", opts: SIM_NAO, other: "Sim", otherPh: "Qual tratamento e se ajudou" },
        { id: "piora", label: "O que faz piorar?", hint: "Pode marcar mais de uma", type: "checks", opts: ["Ficar sentado", "Ficar em pé", "Andar", "Abaixar ou levantar peso", "Final do dia", "Frio", "Outro"], other: "Outro", otherPh: "O que mais piora?" },
        { id: "melhora", label: "O que faz melhorar?", hint: "Pode marcar mais de uma", type: "checks", opts: ["Repouso", "Calor", "Gelo", "Remédio", "Alongar", "Massagem", "Nada melhora", "Outro"], other: "Outro", otherPh: "O que mais melhora?" },
        { id: "expect", label: "O que você quer conseguir com o tratamento?", hint: "Ex.: dormir sem dor, voltar a caminhar, trabalhar sem incômodo", type: "textarea", voz: true },
      ],
    },
    {
      title: "Sua dor",
      intro: "Escolha a cor ou o número que mais combina com a sua dor.",
      fields: [
        { id: "dor_hoje", label: "Quanto está doendo hoje?", type: "scale" },
        { id: "dor_pior", label: "E no pior momento da última semana?", type: "scale" },
        { id: "local", label: "Onde dói?", hint: "Toque no boneco ou nos nomes. Pode marcar mais de um lugar.", type: "corpo" },
        { id: "tipo", label: "Como é essa dor?", hint: "Pode marcar mais de uma", type: "checks", opts: ["Pontada (fisgada)", "Queimação", "Peso ou cansaço", "Latejante (pulsa)", "Choque", "Outro"], other: "Outro", otherPh: "Como é a dor?" },
        { id: "espalha", label: "A dor desce ou se espalha para outra parte do corpo?", type: "radio", opts: SIM_NAO, other: "Sim", otherPh: "Para onde? Ex.: desce para a perna esquerda" },
        { id: "acorda", label: "A dor acorda você durante a noite?", type: "radio", opts: SIM_NAO },
        { id: "formig", label: "Você sente formigamento, dormência ou fraqueza em alguma parte do corpo?", type: "radio", opts: SIM_NAO, other: "Sim", otherPh: "Em qual parte?" },
      ],
    },
    {
      title: "Sua saúde",
      intro: "Se não souber, pode pular.",
      fields: [
        { id: "doencas", label: "Algum médico já disse que você tem alguma destas doenças?", hint: "Pode marcar mais de uma", type: "checks", opts: ["Nenhuma", "Pressão alta", "Diabetes", "Problema no coração", "Tireoide", "Colesterol alto", "Outra"], other: "Outra", otherPh: "Qual doença?" },
        { id: "cirurgias", label: "Você já fez alguma cirurgia?", type: "radio", opts: SIM_NAO, other: "Sim", otherPh: "Qual e em que ano? Ex.: joelho em 2022" },
        { id: "meds", label: "Você toma algum remédio todos os dias ou com frequência?", type: "radio", opts: SIM_NAO, other: "Sim", otherPh: "Quais remédios? Se preferir, tire foto da receita e mostre na consulta", voz: true },
        { id: "alergias", label: "Você tem alguma alergia?", type: "radio", opts: SIM_NAO, other: "Sim", otherPh: "A quê? Ex.: remédio, látex, creme ou óleo" },
        { id: "exames", label: "Você fez algum exame da região que dói no último ano?", hint: "Ex.: raio-X, ressonância, ultrassom", type: "radio", opts: SIM_NAO, other: "Sim", otherPh: "Qual exame? Se tiver, separe para o dia da sessão" },
        { id: "outro_prof", label: "Você faz acompanhamento com outro profissional de saúde?", type: "radio", opts: SIM_NAO, other: "Sim", otherPh: "Qual? Ex.: ortopedista, cardiologista" },
      ],
    },
  ];

  const triagem = [
    { type: "sub", title: "Perguntas de segurança", intro: "Pense em como você está agora e nos últimos meses. Se tiver dúvida, marque \"Não sei\"." },
    { type: "yn", items: SINAIS_ALERTA },
  ];
  const prec = precaucoesAtivas(tecnicas);
  if (prec.length) {
    triagem.push(
      { type: "sub", title: "Cuidados com as técnicas", intro: "Dependendo da resposta, a técnica é adaptada para você." },
      { type: "yn", items: prec }
    );
  }
  etapas.push({ title: "Segurança", intro: "Marque Sim, Não ou Não sei.", fields: triagem });

  if (opcionais.habitos || opcionais.competicao) {
    const habitos = [];
    if (opcionais.competicao) {
      habitos.push({ id: "competicao", label: "Você tem alguma competição ou prova esportiva marcada?", type: "radio", opts: SIM_NAO, other: "Sim", otherPh: "Qual e em que data?" });
    }
    if (opcionais.habitos) {
      habitos.push(
        { id: "postura", label: "Como você passa a maior parte do dia?", hint: "Pode marcar mais de uma", type: "checks", opts: ["Sentado(a)", "Em pé", "Carregando peso", "Dirigindo", "No celular", "No computador", "Cuidando da casa"] },
        { id: "sono_q", label: "Como está o seu sono?", type: "radio", opts: ["Bom", "Mais ou menos", "Ruim"] },
        { id: "estresse", label: "Quanto estresse você sente no dia a dia?", type: "scale", ends: ["Tranquilo", "Muito estressado"] },
        { id: "fuma", label: "Você fuma?", type: "radio", opts: SIM_NAO }
      );
    }
    etapas.push({ title: "Sua rotina", intro: "A rotina influencia muito o corpo.", fields: habitos });
  }

  const nomes = nomesTecnicas(tecnicas);
  etapas.push({
    title: "Autorização",
    intro: "Leia o resumo, marque as caixinhas e escreva seu nome.",
    final: true,
    fields: [
      {
        id: "termo",
        type: "consent",
        req: true,
        resumo: [
          "As informações que dei são verdadeiras.",
          "Vou avisar se a minha saúde mudar.",
          nomes.length ? `Sei quais técnicas podem ser usadas: ${nomes.join(", ")}.` : "Sei quais técnicas podem ser usadas.",
          "Posso sentir dor muscular leve ou ficar com marcas roxas por alguns dias.",
          "Posso pedir para parar ou mudar a técnica a qualquer momento.",
        ],
        label: `Declaro que as informações acima são verdadeiras e que avisarei o profissional sobre qualquer mudança no meu estado de saúde. Fui informado(a) sobre as técnicas que podem ser usadas${nomes.length ? ` (${nomes.join(", ")})` : ""}, seus objetivos e possíveis efeitos, como dor muscular leve, vermelhidão ou marcas roxas temporárias. Sei que posso pedir para interromper ou mudar a técnica a qualquer momento.`,
      },
      { id: "fotos_ok", type: "consent", opcional: true, botao: "Autorizo fotos (opcional)", resumo: ["Autorizo fotos durante o tratamento, só para acompanhar a minha evolução. Elas ficam guardadas no meu prontuário e não são publicadas."], label: "Autorizo o registro de fotos durante o tratamento, exclusivamente para acompanhamento clínico. As fotos ficam no prontuário e não serão divulgadas. Posso retirar esta autorização quando quiser." },
      { id: "lgpd", type: "consent", req: true, botao: "Autorizo", resumo: ["Meus dados ficam guardados com segurança e só são usados no meu atendimento (LGPD)."], label: "Autorizo o registro e o armazenamento destes dados apenas para fins de atendimento, conforme a Lei Geral de Proteção de Dados (LGPD)." },
      { id: "assinatura", label: "Escreva seu nome completo (vale como assinatura)", type: "text", req: true },
    ],
  });

  return etapas;
}

export function calcularAlertas(respostas = {}, tecnicas = []) {
  const prec = precaucoesAtivas(tecnicas);
  const alertas = SINAIS_ALERTA.filter((a) => respostas[a.id] === "Sim");
  const cuidados = prec.filter((p) => respostas[p.id] === "Sim");
  const duvidas = [...SINAIS_ALERTA, ...prec].filter((x) => respostas[x.id] === "Não sei");
  return { alertas, cuidados, duvidas };
}

export function formatarResposta(field, respostas) {
  const v = respostas[field.id];
  if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) return "—";
  if (field.type === "consent") return v ? "Aceito" : "—";
  if (field.type === "data3" || field.type === "date") {
    const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  }
  let txt = Array.isArray(v) ? v.join(", ") : String(v);
  const outro = respostas[field.id + "_outro"];
  const temOutro = Array.isArray(v) ? v.includes(field.other) : v === field.other;
  if (field.other && temOutro && outro) txt += ` — ${outro}`;
  return txt;
}

// Campos que já existiram em versões antigas da ficha (para mostrar respostas antigas no painel)
export const ROTULOS_ANTIGOS = {
  origem: "Como conheceu o atendimento",
  sono_h: "Horas de sono",
  agua: "Água por dia",
  fraturas: "Fraturas ou lesões anteriores",
  data_av: "Data de preenchimento",
};
