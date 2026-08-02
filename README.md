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

## Laboratório de Replay — Nível 1

Abra:

```text
replay.html
```

O laboratório inclui:

- cenário artificial com 120 candles;
- candles futuros ocultos;
- avanço candle a candle;
- entradas compradas e vendidas;
- stop e alvo definidos antes da entrada;
- fechamento automático;
- resultado em múltiplos de risco (`R`);
- expectativa, win rate e drawdown;
- diário e exportação CSV protegida;
- persistência local da sessão.

Todos os cenários são artificiais e não representam mercado ao vivo, recomendação ou sinal operacional.

## Recursos atuais

- Academia Suzy — Nível 1 com seis aulas e avaliação final.
- Academia Suzy — Nível 2 com oito aulas, prática técnica e avaliação final.
- Laboratório de replay candle a candle com diário e métricas em R.
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
- O replay usa candles artificiais e ainda não importa históricos autorizados.
- Ainda não existe simulador completo com spread, comissão e slippage.
- O diário avançado e as estatísticas por setup ainda não foram implementados.

## Próximas etapas recomendadas

1. Permitir importação validada de históricos autorizados para replay.
2. Adicionar simulador de ordens com spread, comissão e slippage.
3. Criar diário profissional e estatísticas avançadas.
4. Adicionar testes de integração da interface no navegador.
5. Criar backend com autenticação e histórico persistente.

## Aviso

Este software é educacional e demonstrativo. Ele não promete lucro, não fornece garantia de resultado e não substitui formação, supervisão ou avaliação financeira independente. Mercados alavancados e operações de curto prazo envolvem risco elevado de perda.
