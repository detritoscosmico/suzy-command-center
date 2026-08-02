# SUZY COMMAND CENTER

Central demonstrativa para treinamento, registro de operações, gestão de risco e formação estruturada de traders. O projeto funciona no navegador e salva os dados localmente.

## Executar no VS Code

1. Clone ou baixe o repositório.
2. Abra a pasta no VS Code.
3. Instale a extensão **Live Server**.
4. Clique com o botão direito em `index.html`.
5. Selecione **Open with Live Server**.

Também é possível abrir os arquivos diretamente no navegador.

## Academia Suzy — Nível 1

Abra:

```text
academia.html
```

A primeira trilha contém seis aulas sobre mentalidade, mercados, candles, gestão de risco, playbook e validação. As aulas são sequenciais, possuem exercícios, verificação obrigatória e avaliação final com nota mínima de 70%.

## Academia Suzy — Nível 2

Abra:

```text
academia-nivel2.html
```

A formação aplicada inclui:

- estrutura e contexto de mercado;
- suporte, resistência e zonas;
- tendência, pullback e continuidade;
- candles como gatilho contextual;
- EMA, RSI e indicadores como filtros;
- confluência e checklist verificável;
- invalidação e relação risco-retorno;
- construção e validação do playbook técnico;
- laboratório de classificação de cenários artificiais;
- checklist com critérios obrigatórios e bloqueadores;
- oito aulas sequenciais;
- avaliação final com 12 questões e nota mínima de 75%;
- progresso e melhor nota salvos no `localStorage`.

## Laboratório de Replay

Abra:

```text
replay.html
```

O laboratório inclui:

- cenário artificial com 120 candles;
- importação local de históricos CSV autorizados;
- validação de timestamp e OHLC;
- suporte a cabeçalhos em português e inglês;
- detecção de vírgula, ponto e vírgula ou tabulação;
- limite de 2 MB e 5.000 linhas;
- descarte de linhas inválidas e timestamps duplicados;
- ordenação cronológica automática;
- candles futuros ocultos;
- avanço candle a candle;
- entradas compradas e vendidas;
- stop e alvo definidos antes da entrada;
- fechamento automático;
- resultado em múltiplos de risco (`R`);
- expectativa, win rate e drawdown;
- diário e exportação CSV protegida;
- identificação explícita da origem da sessão;
- persistência local da sessão.

O botão **Baixar modelo CSV** gera um arquivo compatível. O formato completo está documentado em `docs/importacao-historico-replay.md`.

## Recursos atuais

- Academia Suzy — Nível 1 com seis aulas e avaliação final.
- Academia Suzy — Nível 2 com oito aulas, prática técnica e avaliação final.
- Laboratório de replay candle a candle com dados artificiais ou históricos importados.
- Catálogo estruturado em JSON com fallback local.
- Scanner demonstrativo e gráfico de velas artificiais.
- Registro manual de WIN e LOSS.
- Gestão de risco com entrada máxima, stop diário e limite operacional.
- Relatórios e exportação CSV protegida contra fórmulas.
- Voz da Suzy pelo navegador.
- Persistência via `localStorage`.
- Layout responsivo para computador e celular.
- Testes automatizados e GitHub Actions.

## Estrutura

```text
suzy-command-center/
├── academia.html
├── academia-nivel2.html
├── index.html
├── replay.html
├── assets/
│   └── suzy-avatar.webp
├── css/
│   ├── academia.css
│   ├── academia2.css
│   ├── base.css
│   ├── replay.css
│   └── style.css
├── docs/
│   └── importacao-historico-replay.md
├── js/
│   ├── academia.js
│   ├── academia2.js
│   ├── academy-core.js
│   ├── academy2-core.js
│   ├── app.js
│   ├── core.js
│   ├── replay-core.js
│   └── replay.js
├── dados/
│   └── ativos.json
├── test/
│   ├── academy.test.js
│   ├── academy2.test.js
│   ├── core.test.js
│   └── replay.test.js
├── package.json
└── README.md
```

## Testes

```bash
npm run check
npm test
```

## Limitações atuais

- Não existe autenticação.
- Os dados ficam somente no navegador usado.
- Não há feed real de preços ou calendário econômico oficial.
- Não há conexão com corretora.
- Não executa ordens reais ou automáticas.
- A origem e a licença dos históricos importados são responsabilidade do usuário.
- Ainda não existe simulador completo com spread, comissão e slippage.
- O diário avançado e as estatísticas por setup ainda não foram implementados.

## Próximas etapas recomendadas

1. Adicionar simulador de ordens com spread, comissão e slippage.
2. Criar diário profissional e estatísticas avançadas.
3. Adicionar testes de integração da interface no navegador.
4. Criar backend com autenticação e histórico persistente.

## Aviso

Este software é educacional e demonstrativo. Ele não promete lucro, não fornece garantia de resultado e não substitui formação, supervisão ou avaliação financeira independente. Mercados alavancados e operações de curto prazo envolvem risco elevado de perda.
