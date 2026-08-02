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

A formação aplicada inclui estrutura, zonas, tendência, pullbacks, candles, indicadores, confluência, invalidação, risco-retorno, checklist técnico e construção de playbook. São oito aulas sequenciais, cinco exercícios práticos e avaliação final com nota mínima de 75%.

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

## Simulador de Ordens e Custos

Abra:

```text
simulador.html
```

O simulador educacional inclui:

- ordens a mercado, limite e stop de entrada;
- compra no ask e venda no bid;
- spread configurável;
- slippage configurável;
- comissão cobrada na entrada e na saída;
- valor monetário por ponto;
- stop e alvo definidos antes da entrada;
- processamento por candles artificiais;
- melhoria de preço em ordens limite quando aplicável;
- slippage adverso em ordens stop e saídas por stop;
- critério conservador quando stop e alvo aparecem no mesmo candle;
- resultado bruto, custos e resultado líquido;
- taxa de acerto e média líquida da sessão;
- diário e exportação CSV protegida;
- persistência local da sessão.

As regras e limitações estão documentadas em `docs/simulador-custos-operacionais.md`.

## Diário Profissional

Abra:

```text
diario.html
```

O diário profissional inclui:

- registro de data, ativo, mercado, sessão, timeframe e direção;
- setup, resultado em `R` e qualidade da execução;
- aderência ao plano;
- emoção antes e depois;
- classificação de erros de processo;
- contexto, justificativa e lição aprendida;
- expectativa, profit factor e drawdown máximo;
- curva acumulada em `R`;
- desempenho por setup, ativo, sessão e timeframe;
- filtros por período, ativo, setup, sessão e resultado;
- ranking de erros recorrentes;
- exportação CSV protegida;
- backup completo em JSON;
- persistência local.

A metodologia e as limitações estão documentadas em `docs/diario-profissional.md`.

## Recursos atuais

- Academia Suzy — Nível 1.
- Academia Suzy — Nível 2.
- Laboratório de replay com dados artificiais ou históricos importados.
- Simulador de ordens com spread, comissão e slippage.
- Diário profissional com estatísticas avançadas.
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
├── diario.html
├── index.html
├── replay.html
├── simulador.html
├── assets/
│   └── suzy-avatar.webp
├── css/
│   ├── academia.css
│   ├── academia2.css
│   ├── base.css
│   ├── diario.css
│   ├── replay.css
│   ├── simulador.css
│   └── style.css
├── docs/
│   ├── diario-profissional.md
│   ├── importacao-historico-replay.md
│   └── simulador-custos-operacionais.md
├── js/
│   ├── academia.js
│   ├── academia2.js
│   ├── academy-core.js
│   ├── academy2-core.js
│   ├── app.js
│   ├── core.js
│   ├── diario.js
│   ├── journal-core.js
│   ├── replay-core.js
│   ├── replay.js
│   ├── simulator-core.js
│   └── simulador.js
├── dados/
│   └── ativos.json
├── test/
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
- O simulador não reproduz livro de ofertas, liquidez parcial, latência, swap, margem ou impostos.
- O diário ainda não possui sincronização, importação do backup JSON ou anexos de imagem.

## Próximas etapas recomendadas

1. Adicionar testes de integração da interface no navegador.
2. Criar backend com autenticação e histórico persistente.
3. Implementar calendário econômico por fonte autorizada.
4. Adicionar sincronização e recuperação de backup do diário.

## Aviso

Este software é educacional e demonstrativo. Ele não promete lucro, não fornece garantia de resultado e não substitui formação, supervisão ou avaliação financeira independente. Mercados alavancados e operações de curto prazo envolvem risco elevado de perda.
