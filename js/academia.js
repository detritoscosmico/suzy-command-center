const COURSE = [
  {
    id: "mentalidade",
    number: 1,
    title: "Mentalidade e profissão",
    duration: "20 min",
    summary: "Entenda o que diferencia treinamento, especulação e comportamento profissional.",
    objectives: [
      "Tratar trading como processo probabilístico, não como aposta.",
      "Separar resultado de curto prazo da qualidade da decisão.",
      "Criar rotina de preparação, execução e revisão."
    ],
    content: [
      "Um trader profissional não controla o resultado de uma operação isolada. Ele controla risco, seleção, execução e revisão.",
      "A meta inicial não é ganhar dinheiro rapidamente. É demonstrar que você consegue seguir um plano durante uma amostra relevante.",
      "FOMO, vingança e aumento impulsivo de mão são falhas de processo. Quando surgem, a resposta correta é reduzir exposição ou encerrar a sessão."
    ],
    exercise: "Escreva três regras pessoais para impedir operações por impulso.",
    question: {
      text: "Qual comportamento representa uma postura profissional?",
      options: [
        "Aumentar a entrada depois de uma perda.",
        "Avaliar a qualidade do processo em uma série de operações.",
        "Operar todos os movimentos para não perder oportunidades.",
        "Mudar de estratégia após cada loss."
      ],
      answer: 1
    }
  },
  {
    id: "mercados",
    number: 2,
    title: "Mercados e instrumentos",
    duration: "25 min",
    summary: "Conheça Forex, ações, índices, commodities e criptomoedas.",
    objectives: [
      "Reconhecer diferenças entre mercados e horários.",
      "Entender liquidez, volatilidade, spread e alavancagem.",
      "Evitar operar instrumentos que você ainda não estudou."
    ],
    content: [
      "Liquidez descreve a facilidade de negociar sem provocar grande alteração de preço. Mercados líquidos tendem a apresentar execução mais eficiente.",
      "Volatilidade mede a intensidade das oscilações. Mais volatilidade pode criar oportunidades, mas também aumenta a velocidade das perdas.",
      "Alavancagem amplia exposição. Ela não melhora uma estratégia e pode acelerar o drawdown quando usada sem limites."
    ],
    exercise: "Escolha dois mercados e registre horário principal, custo de negociação e risco específico de cada um.",
    question: {
      text: "O que a alavancagem faz?",
      options: [
        "Garante lucro em movimentos pequenos.",
        "Elimina o spread.",
        "Amplia a exposição e também o risco.",
        "Reduz automaticamente o drawdown."
      ],
      answer: 2
    }
  },
  {
    id: "graficos",
    number: 3,
    title: "Candles e estrutura de mercado",
    duration: "30 min",
    summary: "Leia abertura, máxima, mínima, fechamento, tendência e lateralização.",
    objectives: [
      "Interpretar corpo e pavios de uma vela.",
      "Distinguir tendência, correção e lateralização.",
      "Usar contexto em vez de depender de uma vela isolada."
    ],
    content: [
      "Cada candle resume abertura, máxima, mínima e fechamento de um período. O corpo mostra a distância entre abertura e fechamento; os pavios mostram extremos.",
      "Uma tendência de alta costuma apresentar topos e fundos ascendentes. Uma tendência de baixa costuma apresentar topos e fundos descendentes.",
      "Suporte e resistência são zonas, não linhas exatas. Uma leitura profissional combina estrutura, contexto, volatilidade e risco."
    ],
    exercise: "Abra o gráfico demo, gere três cenários e classifique cada um como alta, baixa ou lateral.",
    question: {
      text: "Qual leitura é mais adequada para uma tendência de alta?",
      options: [
        "Topos e fundos descendentes.",
        "Topos e fundos ascendentes.",
        "Somente candles verdes.",
        "RSI sempre acima de 90."
      ],
      answer: 1
    }
  },
  {
    id: "risco",
    number: 4,
    title: "Gestão de risco",
    duration: "35 min",
    summary: "Aprenda risco por operação, relação risco-retorno e drawdown.",
    objectives: [
      "Calcular o valor máximo de risco por operação.",
      "Entender relação risco-retorno e expectativa.",
      "Definir limites diário, semanal e por sequência de perdas."
    ],
    content: [
      "Risco por operação é a quantia que será perdida se o stop for atingido. Ele deve ser definido antes da entrada.",
      "Uma estratégia pode ser lucrativa com taxa de acerto abaixo de 50% quando o ganho médio supera a perda média. Por isso, win rate isolado é insuficiente.",
      "Drawdown é a redução do capital a partir de um pico. Quanto maior o drawdown, maior o retorno necessário para recuperar a banca."
    ],
    exercise: "Para uma banca demo de R$ 10.000 e risco de 1%, calcule o risco máximo por operação.",
    question: {
      text: "Com banca de R$ 10.000 e risco de 1%, qual é o risco máximo?",
      options: ["R$ 10", "R$ 50", "R$ 100", "R$ 1.000"],
      answer: 2
    }
  },
  {
    id: "plano",
    number: 5,
    title: "Plano e playbook operacional",
    duration: "30 min",
    summary: "Transforme regras em um processo verificável antes, durante e depois da operação.",
    objectives: [
      "Definir mercados, horários e setups permitidos.",
      "Criar critérios objetivos de entrada e bloqueio.",
      "Registrar evidências para revisar o desempenho."
    ],
    content: [
      "Um playbook descreve setups permitidos, contexto ideal, gatilho, invalidação, stop, alvo e exemplos.",
      "O checklist pré-operacional reduz decisões improvisadas. Se um critério obrigatório estiver ausente, a operação deve ser descartada.",
      "O diário deve registrar também operações evitadas. Não operar fora do plano é uma decisão válida e mensurável."
    ],
    exercise: "Crie um setup com cinco critérios obrigatórios e três condições de bloqueio.",
    question: {
      text: "O que fazer quando falta um critério obrigatório do setup?",
      options: [
        "Entrar com valor menor.",
        "Esperar confirmação ou descartar a operação.",
        "Usar martingale para compensar.",
        "Trocar o timeframe até aparecer um sinal."
      ],
      answer: 1
    }
  },
  {
    id: "validacao",
    number: 6,
    title: "Validação e evolução",
    duration: "30 min",
    summary: "Aprenda a testar hipóteses sem confundir simulação com resultado futuro.",
    objectives: [
      "Separar treinamento, backtest e validação fora da amostra.",
      "Evitar conclusões com amostras pequenas.",
      "Definir critérios antes de migrar para qualquer exposição real."
    ],
    content: [
      "Backtest serve para avaliar como uma regra teria se comportado em dados passados. Ele não garante repetição futura.",
      "Ajustar excessivamente uma estratégia ao passado cria overfitting. Uma regra robusta precisa funcionar em períodos e condições diferentes.",
      "Antes de considerar qualquer uso real, valide em conta demo, registre custos e respeite limites. O sistema não deve executar ordens automaticamente."
    ],
    exercise: "Defina uma amostra mínima, métricas de aprovação e condições que fariam você rejeitar uma estratégia.",
    question: {
      text: "Qual afirmação sobre backtest é correta?",
      options: [
        "Garante o mesmo resultado no futuro.",
        "Substitui gestão de risco.",
        "Ajuda a avaliar regras no passado, mas não garante desempenho futuro.",
        "Elimina a necessidade de conta demo."
      ],
      answer: 2
    }
  }
];

const FINAL_QUESTIONS = [
  { id: "q1", text: "O principal controle do trader é:", options: ["O preço", "O resultado isolado", "O risco e o processo", "A notícia"], answer: 2 },
  { id: "q2", text: "Liquidez representa:", options: ["Garantia de lucro", "Facilidade de negociar", "Quantidade de indicadores", "Taxa de acerto"], answer: 1 },
  { id: "q3", text: "Topos e fundos ascendentes sugerem:", options: ["Tendência de alta", "Tendência de baixa", "Spread zero", "Martingale"], answer: 0 },
  { id: "q4", text: "Risco de 1% sobre R$ 5.000 equivale a:", options: ["R$ 5", "R$ 50", "R$ 500", "R$ 1.000"], answer: 1 },
  { id: "q5", text: "Win rate isolado é insuficiente porque:", options: ["Não considera ganho e perda médios", "É sempre falso", "Não usa candles", "Só funciona em cripto"], answer: 0 },
  { id: "q6", text: "Quando um setup obrigatório não aparece:", options: ["Entrar mesmo assim", "Aumentar o lote", "Descartar ou aguardar", "Trocar o resultado"], answer: 2 },
  { id: "q7", text: "Drawdown é:", options: ["Lucro máximo", "Queda do capital desde um pico", "Número de candles", "Custo do spread"], answer: 1 },
  { id: "q8", text: "Overfitting ocorre quando:", options: ["A estratégia é excessivamente ajustada ao passado", "O risco é reduzido", "Há poucas operações por dia", "O mercado fecha"], answer: 0 },
  { id: "q9", text: "O diário profissional deve registrar:", options: ["Apenas wins", "Somente saldo", "Contexto, regra, resultado e comportamento", "Somente notícias"], answer: 2 },
  { id: "q10", text: "O certificado da Academia Suzy é:", options: ["Credenciamento regulatório", "Garantia de renda", "Registro interno de conclusão", "Licença para administrar recursos"], answer: 2 }
];

const STORAGE_KEY = "suzy-academia-nivel1-v1";
const lessonIds = COURSE.map(lesson => lesson.id);
let state = loadState();
let activeLessonId = state.activeLesson || lessonIds[0];

const $ = id => document.getElementById(id);

function loadState() {
  try {
    return AcademyCore.normalizeAcademyState(
      JSON.parse(localStorage.getItem(STORAGE_KEY)),
      lessonIds
    );
  } catch (error) {
    return AcademyCore.normalizeAcademyState({}, lessonIds);
  }
}

function saveState() {
  state.activeLesson = activeLessonId;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function renderSidebar() {
  const progress = AcademyCore.calculateProgress(state.completed, COURSE.length);
  $("courseProgressText").textContent = `${progress.completed} de ${progress.total} aulas`;
  $("courseProgressBar").style.width = `${progress.percent}%`;

  $("lessonList").innerHTML = COURSE.map((lesson, index) => {
    const completed = state.completed.includes(lesson.id);
    const unlocked = AcademyCore.canUnlockLesson(index, state.completed, lessonIds);
    const active = lesson.id === activeLessonId;
    return `
      <button class="lesson-nav ${active ? "active" : ""} ${completed ? "completed" : ""}"
        data-lesson="${lesson.id}" ${unlocked ? "" : "disabled"}>
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

    <section class="academy-block">
      <h2>Objetivos</h2>
      <ul>${lesson.objectives.map(item => `<li>${item}</li>`).join("")}</ul>
    </section>

    <section class="academy-block">
      <h2>Conteúdo essencial</h2>
      ${lesson.content.map(item => `<p>${item}</p>`).join("")}
    </section>

    <section class="exercise-box">
      <span>EXERCÍCIO PRÁTICO</span>
      <p>${lesson.exercise}</p>
    </section>

    <section class="lesson-check">
      <h2>Verificação da aula</h2>
      <p>${lesson.question.text}</p>
      <div class="answer-grid">
        ${lesson.question.options.map((option, optionIndex) => `
          <label><input type="radio" name="lessonAnswer" value="${optionIndex}"> <span>${option}</span></label>
        `).join("")}
      </div>
      <button id="completeLesson" class="academy-primary">${completed ? "AULA CONCLUÍDA" : "VALIDAR E CONCLUIR"}</button>
      <p id="lessonFeedback" class="academy-feedback" aria-live="polite"></p>
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
  if (state.completed.includes(lesson.id)) {
    $("lessonFeedback").textContent = "Esta aula já foi concluída.";
    return;
  }

  const selected = document.querySelector('input[name="lessonAnswer"]:checked');
  if (!selected) {
    $("lessonFeedback").textContent = "Selecione uma resposta antes de validar.";
    return;
  }

  if (Number(selected.value) !== lesson.question.answer) {
    $("lessonFeedback").textContent = "Resposta incorreta. Revise o conteúdo e tente novamente.";
    return;
  }

  state.completed.push(lesson.id);
  saveState();
  render();
  $("lessonFeedback").textContent = "Resposta correta. Aula concluída e próxima etapa liberada.";
}

function navigateLesson(index) {
  if (index < 0 || index >= COURSE.length) return;
  if (!AcademyCore.canUnlockLesson(index, state.completed, lessonIds)) return;
  activeLessonId = COURSE[index].id;
  saveState();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderDashboard() {
  const progress = AcademyCore.calculateProgress(state.completed, COURSE.length);
  $("progressPercent").textContent = `${progress.percent}%`;
  $("completedLessons").textContent = `${progress.completed}/${progress.total}`;
  $("bestScore").textContent = `${state.bestScore}%`;
  $("courseStatus").textContent = state.passed ? "APROVADO" : progress.percent === 100 ? "PROVA LIBERADA" : "EM FORMAÇÃO";
  $("courseStatus").className = state.passed ? "status-approved" : "";

  const examButton = $("openAssessment");
  examButton.disabled = progress.percent < 100;
  examButton.textContent = state.passed ? "REFAZER AVALIAÇÃO" : progress.percent === 100 ? "INICIAR AVALIAÇÃO FINAL" : "CONCLUA AS 6 AULAS";
}

function openAssessment() {
  const progress = AcademyCore.calculateProgress(state.completed, COURSE.length);
  if (progress.percent < 100) return;

  $("assessmentModal").classList.add("open");
  $("assessmentModal").setAttribute("aria-hidden", "false");
  $("assessmentForm").innerHTML = FINAL_QUESTIONS.map((question, index) => `
    <fieldset>
      <legend>${index + 1}. ${question.text}</legend>
      ${question.options.map((option, optionIndex) => `
        <label><input type="radio" name="${question.id}" value="${optionIndex}"> <span>${option}</span></label>
      `).join("")}
    </fieldset>
  `).join("");
  $("assessmentResult").textContent = "";
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

  if (Object.keys(answers).length !== FINAL_QUESTIONS.length) {
    $("assessmentResult").textContent = "Responda todas as questões antes de finalizar.";
    return;
  }

  const key = Object.fromEntries(FINAL_QUESTIONS.map(question => [question.id, question.answer]));
  const result = AcademyCore.gradeAssessment(answers, key, 70);
  state.attempts += 1;
  state.bestScore = Math.max(state.bestScore, result.score);
  state.passed = state.passed || result.passed;
  saveState();

  $("assessmentResult").innerHTML = result.passed
    ? `<strong class="green">Aprovado: ${result.score}%</strong><br>Você concluiu o Nível 1. Este registro é interno e não representa certificação regulatória.`
    : `<strong class="red">Resultado: ${result.score}%</strong><br>Nota mínima: ${result.passingScore}%. Revise as aulas e tente novamente.`;
  renderDashboard();
}

function resetCourse() {
  if (!confirm("Apagar todo o progresso da Academia Suzy neste navegador?")) return;
  localStorage.removeItem(STORAGE_KEY);
  state = AcademyCore.normalizeAcademyState({}, lessonIds);
  activeLessonId = lessonIds[0];
  render();
}

function render() {
  renderSidebar();
  renderDashboard();
  renderLesson();
}

$("openAssessment").addEventListener("click", openAssessment);
$("closeAssessment").addEventListener("click", closeAssessment);
$("assessmentForm").addEventListener("submit", submitAssessment);
$("resetCourse").addEventListener("click", resetCourse);
$("assessmentModal").addEventListener("click", event => {
  if (event.target === $("assessmentModal")) closeAssessment();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeAssessment();
});

render();
