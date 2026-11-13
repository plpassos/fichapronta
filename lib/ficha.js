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
  { id: "a_cancer", q: "Você tem ou já teve câncer?", resumo: "Histórico de câncer" },
  { id: "a_queda", q: "Você sofreu queda, acidente ou pancada forte nas últimas semanas?", resumo: "Queda ou trauma forte recente" },
  { id: "a_fraqueza", q: "Você sente as pernas ou os braços ficando cada vez mais fracos?", resumo: "Fraqueza progressiva em pernas ou braços" },
  { id: "a_urina", q: "Você notou dificuldade para segurar ou soltar a urina ou as fezes, ou dormência na região íntima?", resumo: "Alteração para urinar ou evacuar, ou dormência na região íntima" },
  { id: "a_trombose", q: "Você está com uma panturrilha (batata da perna) inchada, quente e dolorida?", resumo: "Panturrilha inchada, quente e dolorida" },
];

// tecnicas: em quais técnicas a pergunta aparece; adapta: o que muda se a resposta for Sim
export const PRECAUCOES = [
  { id: "p_anticoag", q: "Você toma remédio para afinar o sangue (anticoagulante) ou tem algum problema de coagulação?", resumo: "Anticoagulante ou distúrbio de coagulação", tecnicas: ["dry_needling", "ventosa", "miofascial", "quiropraxia"], adapta: "agulhamento, ventosa, manipulação e pressão forte" },
  { id: "p_gravidez", q: "Você está grávida ou existe chance de estar?", resumo: "Gravidez ou possibilidade", tecnicas: ["dry_needling", "ventosa", "eletro", "massagem", "quiropraxia"], adapta: "técnicas na barriga e na lombar, agulhamento, ventosa e eletroterapia" },
  { id: "p_pele", q: "Você tem ferida, queimadura, problema de pele ou varizes na região que será tratada?", resumo: "Feridas, lesões de pele ou varizes na região", tecnicas: ["miofascial", "ventosa", "massagem", "dry_needling"], adapta: "todas as técnicas nesse local" },
  { id: "p_cirurgia", q: "Você fez cirurgia ou quebrou algum osso nos últimos 3 meses?", resumo: "Cirurgia ou fratura nos últimos 3 meses", tecnicas: ["miofascial", "dry_needling", "ventosa", "quiropraxia", "massagem", "eletro", "pilates"], adapta: "todas as técnicas nesse local" },
  { id: "p_osteo", q: "Você tem osteoporose (ossos frágeis)?", resumo: "Osteoporose", tecnicas: ["miofascial", "quiropraxia"], adapta: "pressão forte e manipulação" },
  { id: "p_diabetes", q: "Você tem diabetes ou alguma parte do corpo com pouca sensibilidade na pele?", resumo: "Diabetes ou alteração de sensibilidade", tecnicas: ["ventosa", "miofascial", "eletro"], adapta: "ventosa, pressão forte e eletroterapia" },
  { id: "p_marcapasso", q: "Você usa marca-passo?", resumo: "Marca-passo", tecnicas: ["dry_needling", "eletro"], adapta: "agulhamento e eletroterapia" },
  { id: "p_implante", q: "Você tem placa, pino ou prótese de metal no corpo?", resumo: "Implante metálico", tecnicas: ["eletro"], adapta: "eletroterapia sobre a região" },
  { id: "p_epilepsia", q: "Você tem epilepsia ou já teve convulsões?", resumo: "Epilepsia ou convulsões", tecnicas: ["dry_needling"], adapta: "agulhamento a seco" },
  { id: "p_agulha", q: "Você tem muito medo de agulhas?", resumo: "Medo intenso de agulhas", tecnicas: ["dry_needling"], adapta: "agulhamento a seco" },
  { id: "p_metal", q: "Você tem alergia a metais, como o níquel de bijuterias e fivelas?", resumo: "Alergia a metais (níquel)", tecnicas: ["dry_needling"], adapta: "agulhamento a seco" },
  { id: "p_linfedema", q: "Você tem linfedema (inchaço permanente em braço ou perna) ou já retirou gânglios (ínguas) em cirurgia?", resumo: "Linfedema ou retirada de linfonodos", tecnicas: ["miofascial", "massagem", "ventosa"], adapta: "todas as técnicas no braço ou perna afetado" },
  { id: "p_imuno", q: "Você está com a imunidade baixa (por quimioterapia ou uso prolongado de corticoide)?", resumo: "Imunidade baixa", tecnicas: ["dry_needling", "ventosa"], adapta: "agulhamento e ventosa" },
  { id: "p_oleo", q: "Você tem alergia a óleos, cremes ou perfumes?", resumo: "Alergia a óleos ou cremes", tecnicas: ["massagem"], adapta: "produtos usados na massagem" },
  { id: "p_cardiaco", q: "Você tem pressão alta ou algum problema no coração?", resumo: "Pressão alta ou problema cardíaco", tecnicas: ["pilates"], adapta: "intensidade dos exercícios" },
  { id: "p_tontura", q: "Você sente tontura com frequência, principalmente ao virar o pescoço ou levantar rápido?", resumo: "Tontura frequente", tecnicas: ["pilates", "quiropraxia"], adapta: "manipulação cervical e mudanças rápidas de posição" },
  { id: "p_artrite", q: "Você tem artrite reumatoide ou outra doença inflamatória nas articulações?", resumo: "Artrite reumatoide ou doença articular inflamatória", tecnicas: ["quiropraxia"], adapta: "manipulação articular" },
  { id: "p_coluna", q: "Você já fez cirurgia na coluna ou tem prótese em alguma articulação?", resumo: "Cirurgia na coluna ou prótese articular", tecnicas: ["quiropraxia"], adapta: "manipulação na região" },
];

const SIM_NAO = ["Sim", "Não"];

export function nomesTecnicas(tecnicas = []) {
  return TECNICAS.filter((t) => tecnicas.includes(t.id)).map((t) => t.nome);
}

export function precaucoesAtivas(tecnicas = []) {
  return PRECAUCOES.filter((p) => p.tecnicas.some((t) => tecnicas.includes(t)));
}

export function montarEtapas(tecnicas = [], opcionais = {}) {
  const identificacao = [
    { id: "nome", label: "Qual é o seu nome completo?", type: "text", req: true },
    { id: "nasc", label: "Qual é a sua data de nascimento?", type: "date" },
    { id: "tel", label: "Qual é o seu WhatsApp (com DDD)?", type: "tel", req: true, ph: "(11) 90000-0000" },
  ];
  if (opcionais.endereco) {
    identificacao.push({ id: "endereco", label: "Em qual endereço será o atendimento?", hint: "Informe rua, número, bairro e cidade.", type: "text" });
  }
  identificacao.push(
    { id: "profissao", label: "Qual é a sua profissão?", hint: "Ex.: pedreiro, professora, motorista, aposentado(a)", type: "text" },
    { id: "esporte", label: "Você pratica atividade física ou esporte?", type: "radio", opts: SIM_NAO, other: "Sim", otherPh: "Qual atividade e quantas vezes por semana?" },
    { id: "origem", label: "Como você ficou sabendo do atendimento?", type: "radio", opts: ["Instagram", "Indicação de alguém", "Outro"], other: "Outro", otherPh: "Como ficou sabendo?" }
  );

  const etapas = [
    { title: "Identificação", intro: "Seus dados para contato e para o registro do atendimento.", fields: identificacao },
    {
      title: "Queixa principal",
      intro: "Conte com suas palavras o que está sentindo. Não existe resposta certa ou errada.",
      fields: [
        { id: "queixa", label: "Qual é o principal problema que fez você procurar o atendimento?", hint: "Ex.: dor na lombar, tensão no pescoço", type: "textarea", req: true },
        { id: "desde", label: "Há quanto tempo você sente isso?", hint: "Ex.: 2 semanas, 3 meses, mais de 1 ano", type: "text" },
        { id: "inicio", label: "Como esse problema começou?", type: "radio", opts: ["Depois de uma lesão ou queda", "Depois de um esforço físico", "Por má postura", "Surgiu sem motivo aparente", "Outro"], other: "Outro", otherPh: "Conte como começou" },
        { id: "trat", label: "Você já fez algum tratamento para esse problema?", type: "radio", opts: SIM_NAO, other: "Sim", otherPh: "Qual tratamento e qual foi o resultado?" },
        { id: "piora", label: "O que faz a dor ou o incômodo piorar?", type: "textarea" },
        { id: "melhora", label: "O que faz a dor ou o incômodo melhorar?", type: "textarea" },
        { id: "expect", label: "O que você quer alcançar com o tratamento?", hint: "Ex.: dormir sem dor, voltar a treinar", type: "textarea" },
      ],
    },
    {
      title: "Avaliação da dor",
      intro: "0 significa nenhuma dor e 10 é a pior dor que você consegue imaginar.",
      fields: [
        { id: "dor_hoje", label: "De 0 a 10, quanto está doendo hoje?", type: "scale" },
        { id: "dor_pior", label: "De 0 a 10, quanto doeu no pior momento dos últimos 7 dias?", type: "scale" },
        { id: "local", label: "Em que parte do corpo dói?", hint: "Diga também o lado. Ex.: lado direito do pescoço", type: "text" },
        { id: "tipo", label: "Como é a dor que você sente?", hint: "Pode marcar mais de uma opção", type: "checks", opts: ["Pontada (fisgada)", "Queimação (ardor)", "Peso ou cansaço", "Latejante (pulsa)", "Formigamento", "Outro"], other: "Outro", otherPh: "Descreva como é a dor" },
        { id: "espalha", label: "A dor se espalha para outra parte do corpo?", type: "radio", opts: SIM_NAO, other: "Sim", otherPh: "Para onde?" },
        { id: "acorda", label: "A dor chega a acordar você durante a noite?", type: "radio", opts: SIM_NAO },
        { id: "formig", label: "Você sente formigamento, dormência ou perda de força em alguma parte do corpo?", type: "radio", opts: SIM_NAO, other: "Sim", otherPh: "Em que parte do corpo?" },
      ],
    },
    {
      title: "Histórico de saúde",
      intro: "Se a resposta for não ou se você não souber, pode deixar em branco.",
      fields: [
        { id: "doencas", label: "Você tem alguma doença diagnosticada por médico? Qual?", hint: "Ex.: pressão alta, diabetes, tireoide", type: "textarea" },
        { id: "cirurgias", label: "Você já fez alguma cirurgia? Qual e em que ano?", type: "textarea" },
        { id: "meds", label: "Você toma algum remédio com frequência? Quais?", hint: "Inclua remédios para afinar o sangue e anti-inflamatórios", type: "textarea" },
        { id: "alergias", label: "Você tem alguma alergia? A quê?", type: "text" },
        { id: "exames", label: "Você fez algum exame da região que dói nos últimos 12 meses? Qual?", type: "text" },
        { id: "outro_prof", label: "Você está em acompanhamento com outro profissional de saúde? Qual?", type: "text" },
      ],
    },
  ];

  const triagem = [
    { type: "sub", title: "Sinais de alerta", intro: "Responda pensando em como você está agora e nos últimos meses." },
    { type: "yn", items: SINAIS_ALERTA },
  ];
  const prec = precaucoesAtivas(tecnicas);
  if (prec.length) {
    triagem.push(
      { type: "sub", title: "Cuidados com as técnicas", intro: "Dependendo da resposta, a técnica é adaptada." },
      { type: "yn", items: prec }
    );
  }
  etapas.push({ title: "Triagem de segurança", intro: "Marque Sim ou Não em todas as perguntas.", fields: triagem });

  if (opcionais.habitos || opcionais.competicao) {
    const habitos = [];
    if (opcionais.competicao) {
      habitos.push({ id: "competicao", label: "Você tem alguma competição ou prova esportiva marcada?", type: "radio", opts: SIM_NAO, other: "Sim", otherPh: "Qual e em que data?" });
    }
    if (opcionais.habitos) {
      habitos.push(
        { id: "postura", label: "Como você passa a maior parte do tempo no trabalho?", type: "checks", opts: ["Sentado(a)", "Em pé", "Carregando peso", "Dirigindo", "Muito tempo no celular", "Muito tempo no computador"] },
        { id: "sono_h", label: "Quantas horas você dorme por noite, em média?", type: "text", ph: "Ex.: 7 horas" },
        { id: "sono_q", label: "Como você avalia o seu sono?", type: "radio", opts: ["Bom", "Regular", "Ruim"] },
        { id: "estresse", label: "De 0 a 10, qual é o seu nível de estresse no dia a dia?", type: "scale" },
        { id: "agua", label: "Quanta água você bebe por dia?", type: "text", ph: "Ex.: 2 litros" },
        { id: "fuma", label: "Você fuma?", type: "radio", opts: SIM_NAO }
      );
    }
    etapas.push({ title: "Hábitos e rotina", intro: "Sua rotina influencia muito o seu corpo.", fields: habitos });
  }

  const nomes = nomesTecnicas(tecnicas);
  etapas.push({
    title: "Termo de consentimento",
    intro: "Leia, marque as caixinhas e assine com seu nome para concluir.",
    fields: [
      {
        id: "termo",
        type: "consent",
        req: true,
        label: `Declaro que as informações acima são verdadeiras e que avisarei o profissional sobre qualquer mudança no meu estado de saúde. Fui informado(a) sobre as técnicas que podem ser usadas${nomes.length ? ` (${nomes.join(", ")})` : ""}, seus objetivos e possíveis efeitos. Sei que posso pedir para interromper ou mudar a técnica a qualquer momento.`,
      },
      { id: "lgpd", type: "consent", req: true, label: "Autorizo o registro e o armazenamento destes dados apenas para fins de atendimento, conforme a Lei Geral de Proteção de Dados (LGPD)." },
      { id: "assinatura", label: "Digite seu nome completo (vale como sua assinatura)", type: "text", req: true },
    ],
  });

  return etapas;
}

export function calcularAlertas(respostas = {}, tecnicas = []) {
  const alertas = SINAIS_ALERTA.filter((a) => respostas[a.id] === "Sim");
  const cuidados = precaucoesAtivas(tecnicas).filter((p) => respostas[p.id] === "Sim");
  return { alertas, cuidados };
}

export function formatarResposta(field, respostas) {
  const v = respostas[field.id];
  if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) return "—";
  let txt = Array.isArray(v) ? v.join(", ") : String(v);
  if (field.type === "consent") txt = v ? "Aceito" : "—";
  const outro = respostas[field.id + "_outro"];
  const temOutro = Array.isArray(v) ? v.includes(field.other) : v === field.other;
  if (field.other && temOutro && outro) txt += ` — ${outro}`;
  return txt;
}
