# SUZY COMMAND CENTER

Central demonstrativa para treinamento, registro de operações, gestão de risco e formação estruturada de traders. O projeto funciona no navegador e mantém os dados localmente.

## Executar no VS Code

1. Clone ou baixe o repositório.
2. Abra a pasta no VS Code.
3. Instale a extensão **Live Server**.
4. Clique com o botão direito em `index.html`.
5. Selecione **Open with Live Server**.

Também é possível abrir os arquivos HTML diretamente no navegador.

## Módulos de formação

### Academia Suzy — Nível 1

Arquivo: `academia.html`

Seis aulas sobre mentalidade, mercados, candles, gestão de risco, playbook e validação. As aulas são sequenciais, possuem exercícios, verificação obrigatória e avaliação final com nota mínima de 70%.

### Academia Suzy — Nível 2

Arquivo: `academia-nivel2.html`

Oito aulas de análise técnica aplicada, cinco exercícios práticos e avaliação final com nota mínima de 75%. Abrange estrutura, zonas, tendência, pullbacks, candles, indicadores, confluência, invalidação, risco-retorno, checklist e playbook.

### Laboratório de Replay

Arquivo: `replay.html`

- cenário artificial com 120 candles;
- importação local de históricos CSV autorizados;
- validação de timestamp e OHLC;
- limite de 2 MB e 5.000 linhas;
- descarte de linhas inválidas e timestamps duplicados;
- candles futuros ocultos;
- avanço candle a candle;
- entradas compradas e vendidas;
- stop e alvo definidos antes da entrada;
- resultado em múltiplos de risco (`R`);
- expectativa, win rate e drawdown;
- diário e exportação CSV protegida.

O formato de importação está documentado em `docs/importacao-historico-replay.md`.

### Simulador de Ordens e Custos

Arquivo: `simulador.html`

- ordens a mercado, limite e stop de entrada;
- compra no ask e venda no bid;
- spread, slippage e comissão configuráveis;
- valor monetário por ponto;
- stop e alvo definidos antecipadamente;
- processamento por candles artificiais;
- melhoria de preço em ordens limite;
- slippage adverso em ordens stop;
- resultado bruto, custos e resultado líquido;
- taxa de acerto, diário e exportação CSV protegida.

As regras estão documentadas em `docs/simulador-custos-operacionais.md`.

### Diário Profissional

Arquivo: `diario.html`

- ativo, mercado, sessão, timeframe, direção e setup;
- resultado em `R` e qualidade da execução;
- aderência ao plano;
- emoções antes e depois;
- erros de processo, contexto e lição aprendida;
- expectativa, profit factor e drawdown máximo;
- curva acumulada em `R`;
- desempenho por setup, ativo, sessão e timeframe;
- filtros por período e resultado;
- ranking de erros recorrentes;
- exportação CSV e backup JSON.

A metodologia está documentada em `docs/diario-profissional.md`.

## Recursos atuais

- Academia Suzy — Níveis 1 e 2.
- Replay com dados artificiais ou históricos importados.
- Simulador de ordens com custos operacionais.
- Diário profissional com estatísticas avançadas.
- Catálogo estruturado em JSON com fallback local.
- Scanner demonstrativo e gráfico de velas artificiais.
- Registro manual de WIN e LOSS.
- Gestão de risco com entrada máxima, stop diário e limites operacionais.
- Relatórios e exportação CSV protegida contra fórmulas.
- Voz da Suzy pelo navegador.
- Persistência por `localStorage`.
- Layout responsivo para computador e celular.
- Testes unitários e testes de integração no navegador.
- Validação contínua pelo GitHub Actions.

## Estrutura

```text
suzy-command-center/
├── .github/workflows/quality.yml
├── academia.html
├── academia-nivel2.html
├── diario.html
├── index.html
├── replay.html
├── simulador.html
├── playwright.config.js
├── assets/
├── css/
├── dados/
├── docs/
│   ├── diario-profissional.md
│   ├── importacao-historico-replay.md
│   ├── simulador-custos-operacionais.md
│   └── testes-integracao-interface.md
├── js/
├── test/
│   ├── e2e/
│   │   ├── critical-flows.spec.js
│   │   └── server.js
│   ├── academy.test.js
│   ├── academy2.test.js
│   ├── core.test.js
│   ├── journal.test.js
│   ├── replay.test.js
│   └── simulator.test.js
├── package.json
└── README.md
```

## Testes

Instale as dependências e o navegador de testes:

```bash
npm install
npx playwright install chromium
```

Verificação de sintaxe:

```bash
npm run check
```

Testes unitários:

```bash
npm run test:unit
```

Testes de integração em Chromium desktop e celular:

```bash
npm run test:e2e
```

Abrir o relatório HTML:

```bash
npm run test:e2e:report
```

A cobertura e as limitações estão documentadas em `docs/testes-integracao-interface.md`.

## Limitações atuais

- Não existe autenticação.
- Os dados ficam somente no navegador usado.
- Não há feed real de preços ou calendário econômico oficial.
- Não há conexão com corretora.
- Não executa ordens reais ou automáticas.
- A origem e a licença dos históricos importados são responsabilidade do usuário.
- O simulador não reproduz livro de ofertas, liquidez parcial, latência, swap, margem ou impostos.
- O diário ainda não possui sincronização, restauração de backup JSON ou anexos de imagem.
- Os testes de navegador usam apenas Chromium.

## Próximas etapas recomendadas

1. Criar backend com autenticação e histórico persistente.
2. Implementar sincronização e restauração segura do backup do diário.
3. Implementar calendário econômico por fonte autorizada.
4. Ampliar testes para Firefox, WebKit e acessibilidade automatizada.

## Aviso

Este software é educacional e demonstrativo. Ele não promete lucro, não fornece garantia de resultado e não substitui formação, supervisão ou avaliação financeira independente. Mercados alavancados e operações de curto prazo envolvem risco elevado de perda.
