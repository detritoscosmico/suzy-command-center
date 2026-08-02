const COURSE = [
  {
    id: "estrutura",
    number: 1,
    title: "Estrutura e contexto",
    duration: "30 min",
    summary: "Classifique tendência, lateralização, impulso e correção antes de procurar entradas.",
    objectives: [
      "Distinguir tendência de ruído.",
      "Reconhecer topos e fundos relevantes.",
      "Separar contexto de gatilho."
    ],
    content: [
      "A estrutura descreve como o preço organiza máximas e mínimas. Uma sequência ascendente sugere domínio comprador; uma sequência descendente sugere domínio vendedor.",
      "O contexto vem antes do gatilho. Um candle isolado não transforma uma lateralização em tendência nem invalida sozinho uma estrutura consolidada.",
      "Impulso é o movimento dominante; correção é o movimento contrário e geralmente mais curto. A entrada precisa respeitar o lado que o plano autoriza."
    ],
    exercise: "Abra três cenários no laboratório e registre: tendência, último impulso, correção e ponto de invalidação.",
    question: {
      text: "Qual é a ordem mais consistente para analisar um gráfico?",
      options: ["Gatilho, contexto e risco", "Contexto, zona, gatilho e risco", "Indicador, entrada e notícia", "Entrada, stop e depois contexto"],
      answer: 1
    }
  },
  {
    id: "zonas",
    number: 2,
    title: "Suporte, resistência e zonas",
    duration: "30 min",
    summary: "Use áreas de reação, não linhas exatas ou preços mágicos.",
    objectives: [
      "Marcar zonas com evidência de reação.",
      "Avaliar rompimento e falso rompimento.",
      "Evitar excesso de marcações."
    ],
    content: [
      "Suporte e resistência representam regiões onde oferta e demanda produziram reação. Elas devem ser tratadas como faixas, não como um único preço.",
      "Uma zona ganha relevância quando coincide com estrutura, volume de negociação observável, rejeição ou mudança de comportamento. Repetir toques indefinidamente também pode enfraquecê-la.",
      "Rompimento exige aceitação além da zona. Um pavio isolado pode ser apenas teste de liquidez; o plano deve definir o que confirma e o que invalida."
    ],
    exercise: "Em um cenário artificial, marque no máximo duas zonas e explique por que cada uma é relevante.",
    question: {
      text: "Como suporte e resistência devem ser tratados?",
      options: ["Como preços exatos", "Como zonas com margem", "Como garantia de reversão", "Como substitutos do stop"],
      answer: 1
    }
  },
  {
    id: "tendencia",
    number: 3,
    title: "Tendência, pullback e continuidade",
    duration: "35 min",
    summary: "Avalie quando uma correção oferece contexto e quando a estrutura já foi perdida.",
    objectives: [
      "Diferenciar pullback de reversão.",
      "Definir continuação com invalidação.",
      "Evitar perseguir preço esticado."
    ],
    content: [
      "Um pullback é uma correção dentro de uma estrutura ainda válida. A reversão ocorre quando o mercado perde pontos estruturais definidos pelo plano.",
      "Entrar depois de um movimento excessivamente esticado aumenta a distância até uma invalidação lógica. O melhor contexto nem sempre exige entrada imediata.",
      "Continuidade precisa de estrutura, zona e gatilho. A simples presença de médias alinhadas não é suficiente."
    ],
    exercise: "Defina qual fundo ou topo precisa permanecer intacto para que um pullback continue válido.",
    question: {
      text: "O que melhor diferencia pullback de reversão?",
      options: ["A cor do candle", "A preservação ou perda da estrutura", "O número de indicadores", "O tamanho da banca"],
      answer: 1
    }
  },
  {
    id: "candles",
    number: 4,
    title: "Candles como gatilho",
    duration: "30 min",
    summary: "Use candles para confirmar uma hipótese, não para criar contexto do nada.",
    objectives: [
      "Interpretar rejeição, força e fechamento.",
      "Combinar candle com zona e estrutura.",
      "Evitar nomes de padrões sem contexto."
    ],
    content: [
      "O corpo informa deslocamento entre abertura e fechamento; o pavio mostra tentativa e rejeição. O significado depende da posição do candle no gráfico.",
      "Um candle de rejeição em uma zona relevante pode servir como gatilho. O mesmo candle no meio de uma lateralização pode não ter valor operacional.",
      "Padrões não são ordens automáticas. Antes de entrar, defina invalidação, alvo e tamanho do risco."
    ],
    exercise: "Compare o mesmo padrão de rejeição em uma zona estrutural e no meio do range. Explique por que a leitura muda.",
    question: {
      text: "Quando um padrão de candle tende a ser mais útil?",
      options: ["Quando aparece isolado", "Quando confirma contexto e zona", "Quando não há stop", "Quando o spread aumenta"],
      answer: 1
    }
  },
  {
    id: "indicadores",
    number: 5,
    title: "Indicadores como filtros",
    duration: "35 min",
    summary: "Use EMA, RSI e volatilidade como medidas auxiliares, não como oráculos.",
    objectives: [
      "Entender atraso e limitações dos indicadores.",
      "Usar médias para direção e inclinação.",
      "Usar osciladores sem operar sobrecompra ou sobrevenda automaticamente."
    ],
    content: [
      "Indicadores derivam do preço e, por isso, não removem incerteza. Médias móveis ajudam a resumir direção e ritmo, mas podem falhar em lateralizações.",
      "RSI mede força relativa do movimento. Sobrecompra não significa venda imediata; sobrevenda não significa compra imediata.",
      "O filtro deve reduzir operações ruins sem destruir a amostra. Todo parâmetro precisa ser testado antes de entrar no playbook."
    ],
    exercise: "Gere cinco cenários e compare a estrutura visual com o alinhamento EMA 9/21. Registre divergências.",
    question: {
      text: "Qual uso é mais adequado para indicadores?",
      options: ["Garantir direção", "Filtrar e contextualizar", "Eliminar stop", "Substituir o diário"],
      answer: 1
    }
  },
  {
    id: "confluencia",
    number: 6,
    title: "Confluência e qualidade do setup",
    duration: "35 min",
    summary: "Transforme elementos técnicos em critérios objetivos e auditáveis.",
    objectives: [
      "Definir critérios obrigatórios.",
      "Separar confirmação de redundância.",
      "Criar condições claras de bloqueio."
    ],
    content: [
      "Confluência é a combinação de evidências independentes. Três médias calculadas sobre o mesmo preço podem ser redundantes, não três confirmações diferentes.",
      "Um setup verificável descreve contexto, zona, gatilho, invalidação e risco. Cada item deve ser respondido antes da entrada.",
      "Notícia de alto impacto, baixa liquidez, spread anormal ou estado emocional inadequado podem bloquear uma operação mesmo quando o gráfico parece favorável."
    ],
    exercise: "Use o checklist desta página e monte um setup que só seja aprovado com todos os cinco critérios e nenhum bloqueador.",
    question: {
      text: "Qual conjunto representa confluência mais robusta?",
      options: ["EMA 8, EMA 9 e EMA 10", "Estrutura, zona, gatilho e risco", "Três osciladores iguais", "Somente candle verde"],
      answer: 1
    }
  },
  {
    id: "riscoretorno",
    number: 7,
    title: "Invalidação e risco-retorno",
    duration: "40 min",
    summary: "Defina stop técnico, alvo lógico e relação risco-retorno antes de executar.",
    objectives: [
      "Posicionar stop pela hipótese, não pelo valor desejado.",
      "Calcular múltiplos de risco.",
      "Recusar operações com assimetria inadequada."
    ],
    content: [
      "O stop deve ficar onde a hipótese técnica deixa de ser válida. Ajustar o stop apenas para aumentar lote distorce o setup.",
      "Risco-retorno compara ganho potencial com perda planejada. Uma relação 2R significa que o alvo está a duas vezes a distância do risco.",
      "Boa relação risco-retorno não corrige entrada sem vantagem. Ela precisa ser analisada junto com taxa de acerto, custos e expectativa."
    ],
    exercise: "Para uma compra em 100, stop em 98 e alvo em 104, calcule risco, retorno e múltiplo R.",
    question: {
      text: "Compra em 100, stop em 98 e alvo em 104 produz:",
      options: ["0,5R", "1R", "2R", "4R"],
      answer: 2
    }
  },
  {
    id: "playbook",
    number: 8,
    title: "Playbook técnico e validação",
    duration: "45 min",
    summary: "Documente o setup, teste a hipótese e defina critérios de aprovação.",
    objectives: [
      "Escrever regras sem ambiguidade.",
      "Registrar exemplos válidos e inválidos.",
      "Validar em replay e conta demo."
    ],
    content: [
      "O playbook deve conter mercado, timeframe, contexto, zona, gatilho, invalidação, alvo, risco, bloqueadores e exemplos.",
      "A validação precisa de amostra suficiente e separação entre ajuste e teste. Alterar regras durante a amostra impede interpretação confiável.",
      "Uma estratégia deve ser rejeitada quando não apresenta expectativa aceitável, viola limites de drawdown ou depende de condições impossíveis de executar."
    ],
    exercise: "Escreva a versão 1.0 de um setup e defina amostra mínima, métricas e condições de descarte.",
    question: {
      text: "Durante uma amostra de validação, o que deve ser evitado?",
      options: ["Registrar custos", "Alterar regras após cada resultado", "Separar períodos", "Medir drawdown"],
      answer: 1
    }
  }
];

const FINAL_QUESTIONS = [
  { id: "q1", text: "A análise técnica deve começar por:", options: ["Gatilho isolado", "Contexto e estrutura", "Tamanho do lote", "Resultado anterior"], answer: 1 },
  { id: "q2", text: "Suporte e resistência são melhor tratados como:", options: ["Zonas", "Preços garantidos", "Ordens automáticas", "Metas fixas"], answer: 0 },
  { id: "q3", text: "Um pullback continua válido enquanto:", options: ["O RSI estiver abaixo de 30", "A estrutura definida permanecer intacta", "Houver candle verde", "O preço tocar qualquer média"], answer: 1 },
  { id: "q4", text: "O valor de um candle depende principalmente de:", options: ["Seu nome", "Seu contexto e localização", "Sua cor", "Seu timeframe isolado"], answer: 1 },
  { id: "q5", text: "Indicadores técnicos devem ser usados como:", options: ["Filtros auxiliares", "Garantia de resultado", "Substitutos do stop", "Previsão exata"], answer: 0 },
  { id: "q6", text: "Confluência robusta combina:", options: ["Indicadores redundantes", "Evidências independentes", "Somente médias", "Somente padrões"], answer: 1 },
  { id: "q7", text: "O stop técnico deve ficar:", options: ["Onde a hipótese é invalidada", "Onde o lote fica maior", "No mesmo valor sempre", "Depois da entrada"], answer: 0 },
  { id: "q8", text: "Compra em 50, stop em 49 e alvo em 53 possui:", options: ["1R", "2R", "3R", "4R"], answer: 2 },
  { id: "q9", text: "Uma notícia de alto impacto próxima pode:", options: ["Garantir movimento", "Bloquear o setup pelo plano", "Eliminar spread", "Aumentar certeza"], answer: 1 },
  { id: "q10", text: "Durante a validação, mudar regras após cada loss:", options: ["Melhora a amostra", "Contamina a análise", "Elimina drawdown", "Aumenta liquidez"], answer: 1 },
  { id: "q11", text: "Boa relação risco-retorno:", options: ["Compensa qualquer setup", "Precisa de vantagem e execução", "Garante lucro", "Dispensa custos"], answer: 1 },
  { id: "q12", text: "O objetivo do playbook é:", options: ["Criar regras auditáveis", "Prever todos os candles", "Operar mais", "Evitar diário"], answer: 0 }
];

const STORAGE_KEY = "suzy-academia-nivel2-v1";
const lessonIds = COURSE.map(lesson => lesson.id);
let state = loadState();
let activeLessonId = state.activeLesson || lessonIds[0];
let scenarioCandles = [];
let expectedTrend = "SIDEWAYS";
let scenarioAnswered = false;
const $ = id => document.getElementById(id);

function loadState() {
  try {
    return Academy2Core.normalizeLevel2State(
      JSON.parse(localStorage.getItem(STORAGE_KEY)),
      lessonIds
    );
  } catch (error) {
    return Academy2Core.normalizeLevel2State({}, lessonIds);
  }
}

function saveState() {
  state.activeLesson = activeLessonId;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function renderSidebar() {
  const progress = Academy2Core.calculateProgress(state.completed, COURSE.length);
  $("courseProgressText").textContent = `${progress.completed} de ${progress.total} aulas`;
  $("courseProgressBar").style.width = `${progress.percent}%`;
  $("lessonList").innerHTML = COURSE.map((lesson, index) => {
    const completed = state.completed.includes(lesson.id);
    const unlocked = Academy2Core.canUnlockLesson(index, state.completed, lessonIds);
    return `<button class="lesson-nav ${lesson.id === activeLessonId ? "active" : ""} ${completed ? "completed" : ""}" data-lesson="${lesson.id}" ${unlocked ? "" : "disabled"}>
      <span>${completed ? "✓" : lesson.number}</span>
      <div><strong>${lesson.title}</strong><small>${unlocked ? lesson.duration : "Bloqueada"}</small></div>
    </button>`;
  }).join("");

  document.querySelectorAll("[data-lesson]").forEach(button => {
    button.addEventListener("click", () => {
      activeLessonId = button.dataset.lesson;
      saveState();
      render();
    });
  });
}

function renderLesson() {
  const lesson = COURSE.find(item => item.id === activeLessonId) || COURSE[0];
  const index = COURSE.findIndex(item => item.id === lesson.id);
  const completed = state.completed.includes(lesson.id);

  $("lessonContent").innerHTML = `
    <div class="lesson-kicker">AULA ${lesson.number} DE ${COURSE.length} • ${lesson.duration}</div>
    <h1>${lesson.title}</h1>
    <p class="lesson-summary">${lesson.summary}</p>
    <section class="academy-block"><h2>Objetivos</h2><ul>${lesson.objectives.map(item => `<li>${item}</li>`).join("")}</ul></section>
    <section class="academy-block"><h2>Conteúdo aplicado</h2>${lesson.content.map(item => `<p>${item}</p>`).join("")}</section>
    <section class="exercise-box"><span>EXERCÍCIO PRÁTICO</span><p>${lesson.exercise}</p></section>
    <section class="lesson-check">
      <h2>Verificação da aula</h2><p>${lesson.question.text}</p>
      <div class="answer-grid">${lesson.question.options.map((option, optionIndex) => `<label><input type="radio" name="lessonAnswer" value="${optionIndex}"> <span>${option}</span></label>`).join("")}</div>
      <button id="completeLesson" class="primary-button">${completed ? "AULA CONCLUÍDA" : "VALIDAR E CONCLUIR"}</button>
      <p id="lessonFeedback" class="feedback" aria-live="polite"></p>
    </section>
    <div class="lesson-actions">
      <button id="previousLesson" ${index === 0 ? "disabled" : ""}>← Aula anterior</button>
      <button id="nextLesson" ${index === COURSE.length - 1 || !completed ? "disabled" : ""}>Próxima aula →</button>
    </div>`;

  $("completeLesson").addEventListener("click", () => completeLesson(lesson));
  $("previousLesson").addEventListener("click", () => navigateLesson(index - 1));
  $("nextLesson").addEventListener("click", () => navigateLesson(index + 1));
}

function completeLesson(lesson) {
  const selected = document.querySelector('input[name="lessonAnswer"]:checked');
  if (!selected) {
    $("lessonFeedback").textContent = "Selecione uma resposta antes de validar.";
    return;
  }

  if (Number(selected.value) !== lesson.question.answer) {
    $("lessonFeedback").textContent = "Resposta incorreta. Revise o conteúdo e tente novamente.";
    $("lessonFeedback").className = "feedback red";
    return;
  }

  if (!state.completed.includes(lesson.id)) state.completed.push(lesson.id);
  saveState();
  $("lessonFeedback").textContent = "Aula concluída. A próxima etapa foi liberada.";
  $("lessonFeedback").className = "feedback green";
  render();
}

function navigateLesson(index) {
  if (index < 0 || index >= COURSE.length) return;
  if (!Academy2Core.canUnlockLesson(index, state.completed, lessonIds)) return;
  activeLessonId = COURSE[index].id;
  saveState();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderProgress() {
  const progress = Academy2Core.calculateProgress(state.completed, COURSE.length);
  $("progressPercent").textContent = `${progress.percent}%`;
  $("completedLessons").textContent = `${progress.completed}/${progress.total}`;
  $("practiceScore").textContent = `${state.practiceCorrect}/${state.practiceAttempts}`;
  $("bestScore").textContent = `${state.bestScore}%`;

  const unlocked = Academy2Core.canOpenAssessment(state, COURSE.length, 5);
  $("openAssessment").disabled = !unlocked;
  $("openAssessment").textContent = unlocked ? "ABRIR AVALIAÇÃO" : `AULAS ${progress.completed}/${progress.total} • PRÁTICA ${Math.min(state.practiceAttempts, 5)}/5`;
}

function generateScenario() {
  const mode = ["UP", "DOWN", "SIDEWAYS"][Math.floor(Math.random() * 3)];
  const candles = [];
  let price = 1.1;
  const now = Date.now();

  for (let index = 0; index < 36; index += 1) {
    const open = price;
    const drift = mode === "UP" ? 0.00012 : mode === "DOWN" ? -0.00012 : 0;
    const cycle = mode === "SIDEWAYS" ? Math.sin(index / 2.8) * 0.00008 : 0;
    const noise = (Math.random() - 0.5) * 0.00018;
    const close = Math.max(0.0001, open + drift + cycle + noise);
    const high = Math.max(open, close) + Math.random() * 0.00009;
    const low = Math.min(open, close) - Math.random() * 0.00009;
    candles.push({ time: now - (35 - index) * 300000, open, high, low, close });
    price = close;
  }

  scenarioCandles = candles;
  expectedTrend = Academy2Core.classifyTechnicalContext(candles).trend;
  if (expectedTrend === "INSUFFICIENT") expectedTrend = "SIDEWAYS";
  scenarioAnswered = false;
  document.querySelectorAll("[data-answer]").forEach(button => { button.disabled = false; });
  $("practiceFeedback").textContent = "Analise o cenário antes de responder.";
  $("practiceFeedback").className = "feedback";
  drawScenario();
}

function drawScenario() {
  const canvas = $("practiceChart");
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#030a13";
  ctx.fillRect(0, 0, width, height);

  const values = scenarioCandles.flatMap(candle => [candle.high, candle.low]);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const padding = (max - min || 0.001) * 0.08;
  const top = max + padding;
  const bottom = min - padding;
  const chartHeight = height - 34;
  const step = width / scenarioCandles.length;
  const y = value => 10 + ((top - value) / (top - bottom)) * chartHeight;

  ctx.strokeStyle = "rgba(146,167,191,.15)";
  for (let line = 0; line <= 4; line += 1) {
    const py = 10 + (chartHeight / 4) * line;
    ctx.beginPath();ctx.moveTo(0, py);ctx.lineTo(width, py);ctx.stroke();
  }

  scenarioCandles.forEach((candle, index) => {
    const x = index * step + step / 2;
    const rising = candle.close >= candle.open;
    const color = rising ? "#22e582" : "#ff6262";
    ctx.strokeStyle = color;ctx.fillStyle = color;
    ctx.beginPath();ctx.moveTo(x, y(candle.high));ctx.lineTo(x, y(candle.low));ctx.stroke();
    const bodyTop = y(Math.max(candle.open, candle.close));
    const bodyBottom = y(Math.min(candle.open, candle.close));
    ctx.fillRect(x - 3, bodyTop, 6, Math.max(1, bodyBottom - bodyTop));
  });

  const closes = scenarioCandles.map(candle => candle.close);
  [[9, "#38bdf8"], [21, "#ff5ec7"]].forEach(([period, color]) => {
    const ema = Academy2Core.calculateEma(closes, period);
    ctx.strokeStyle = color;ctx.lineWidth = 1.6;ctx.beginPath();
    ema.forEach((value, index) => {
      const x = index * step + step / 2;
      const py = y(value);
      if (index === 0) ctx.moveTo(x, py); else ctx.lineTo(x, py);
    });
    ctx.stroke();ctx.lineWidth = 1;
  });
}

function answerScenario(answer) {
  if (scenarioAnswered) return;
  const result = Academy2Core.scorePractice(answer, expectedTrend);
  scenarioAnswered = true;
  state.practiceAttempts += 1;
  if (result.correct) state.practiceCorrect += 1;
  saveState();
  document.querySelectorAll("[data-answer]").forEach(button => { button.disabled = true; });
  const labels = { UP: "alta", DOWN: "baixa", SIDEWAYS: "lateral" };
  $("practiceFeedback").textContent = result.correct
    ? `Leitura correta: ${labels[result.expected]}.`
    : `Leitura registrada como ${labels[result.answer]}; o motor classificou o contexto como ${labels[result.expected]}. Revise estrutura e médias.`;
  $("practiceFeedback").className = `feedback ${result.correct ? "green" : "orange"}`;
  renderProgress();
}

function updateChecklist() {
  const checks = {};
  document.querySelectorAll("[data-check]").forEach(input => {
    checks[input.dataset.check] = input.checked;
  });
  const result = Academy2Core.evaluateSetupChecklist(checks);
  $("checklistScore").textContent = `${result.score}%`;
  $("checklistStatus").textContent = result.approved
    ? "Setup tecnicamente completo e sem bloqueadores. Isso não garante resultado."
    : result.blockers.length
      ? "Setup bloqueado por risco contextual ou emocional."
      : `Faltam ${result.missing.length} critérios obrigatórios.`;
  $("checklistStatus").className = `feedback ${result.approved ? "green" : result.blockers.length ? "red" : "orange"}`;
}

function renderAssessment() {
  $("assessmentForm").innerHTML = FINAL_QUESTIONS.map((question, index) => `
    <fieldset><legend>${index + 1}. ${question.text}</legend>
      ${question.options.map((option, optionIndex) => `<label><input type="radio" name="${question.id}" value="${optionIndex}"> <span>${option}</span></label>`).join("")}
    </fieldset>`).join("");
}

function openAssessment() {
  if (!Academy2Core.canOpenAssessment(state, COURSE.length, 5)) return;
  $("assessmentModal").classList.add("open");
  $("assessmentModal").setAttribute("aria-hidden", "false");
}

function closeAssessment() {
  $("assessmentModal").classList.remove("open");
  $("assessmentModal").setAttribute("aria-hidden", "true");
}

function submitAssessment(event) {
  event.preventDefault();
  const answers = {};
  FINAL_QUESTIONS.forEach(question => {
    const selected = document.querySelector(`input[name="${question.id}"]:checked`);
    if (selected) answers[question.id] = Number(selected.value);
  });
  const answerKey = Object.fromEntries(FINAL_QUESTIONS.map(question => [question.id, question.answer]));
  const result = Academy2Core.gradeAssessment(answers, answerKey, 75);
  state.attempts += 1;
  state.bestScore = Math.max(state.bestScore, result.score);
  state.passed = state.passed || result.passed;
  saveState();
  $("assessmentResult").textContent = result.passed
    ? `Aprovado com ${result.score}% (${result.correct}/${result.total}). Registro interno de conclusão atualizado.`
    : `Nota ${result.score}% (${result.correct}/${result.total}). Revise as aulas e tente novamente. Mínimo: ${result.passingScore}%.`;
  $("assessmentResult").className = `assessment-result ${result.passed ? "green" : "red"}`;
  renderProgress();
}

function resetCourse() {
  if (!confirm("Reiniciar todo o progresso do Nível 2 e as tentativas práticas?")) return;
  localStorage.removeItem(STORAGE_KEY);
  state = Academy2Core.normalizeLevel2State({}, lessonIds);
  activeLessonId = lessonIds[0];
  generateScenario();
  render();
}

function render() {
  renderSidebar();
  renderLesson();
  renderProgress();
}

$("newScenario").addEventListener("click", generateScenario);
document.querySelectorAll("[data-answer]").forEach(button => button.addEventListener("click", () => answerScenario(button.dataset.answer)));
document.querySelectorAll("[data-check]").forEach(input => input.addEventListener("change", updateChecklist));
$("openAssessment").addEventListener("click", openAssessment);
$("closeAssessment").addEventListener("click", closeAssessment);
$("assessmentForm").addEventListener("submit", submitAssessment);
$("resetCourse").addEventListener("click", resetCourse);
$("assessmentModal").addEventListener("click", event => { if (event.target === $("assessmentModal")) closeAssessment(); });

renderAssessment();
generateScenario();
updateChecklist();
render();
