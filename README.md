# SUZY COMMAND CENTER

Central demonstrativa para treinamento, registro de operações, gestão de risco e formação básica de traders. O projeto funciona no navegador e salva os dados localmente.

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

A primeira trilha de formação contém:

- mentalidade e postura profissional;
- mercados, liquidez, volatilidade e alavancagem;
- candles e estrutura de mercado;
- gestão de risco e drawdown;
- plano e playbook operacional;
- validação, backtest e conta demo;
- exercícios por aula;
- verificação obrigatória antes de liberar a próxima etapa;
- avaliação final com nota mínima de 70%;
- progresso salvo no `localStorage`.

O registro de conclusão é interno e não representa certificação profissional ou regulatória.

## Recursos atuais

- Academia Suzy — Nível 1 com seis aulas e avaliação final.
- Catálogo estruturado em JSON com fallback para abertura direta.
- Validação e normalização dos ativos antes da exibição.
- Catálogo com OTC, Forex, índices, criptomoedas e ouro.
- Busca, categorias, favoritos e ordenação.
- Cotações demonstrativas com pequenas variações simuladas.
- Scanner demo com ranking de força, popularidade e variação simulada.
- Gráfico responsivo de velas japonesas com cenários artificiais, M1/M5/M15 e EMA 9/21.
- Registro manual de WIN e LOSS.
- Banca e resultado atualizados automaticamente.
- Risco máximo por entrada.
- Stop loss e stop gain diários.
- Limite de operações e de perdas consecutivas.
- Relatório completo e exportação CSV protegida contra fórmulas.
- Configuração da missão diária.
- Voz da Suzy pelo recurso de fala do navegador.
- Persistência via `localStorage`.
- Layout responsivo para computador e celular.
- Testes automatizados e validação contínua pelo GitHub Actions.

## Estrutura

```text
suzy-command-center/
├── academia.html
├── index.html
├── assets/
│   └── suzy-avatar.webp
├── css/
│   ├── academia.css
│   ├── base.css
│   └── style.css
├── js/
│   ├── academia.js
│   ├── academy-core.js
│   ├── app.js
│   └── core.js
├── dados/
│   └── ativos.json
├── test/
│   ├── academy.test.js
│   └── core.test.js
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
- A formação ainda não inclui replay, backtesting profissional, diário avançado ou estatísticas completas.

## Próximas etapas recomendadas

1. Integrar a Academia Suzy ao menu principal do painel.
2. Criar o Nível 2 — análise técnica aplicada.
3. Adicionar replay e backtesting com dados históricos autorizados.
4. Criar diário profissional e estatísticas avançadas.
5. Adicionar testes de integração da interface no navegador.
6. Criar backend com autenticação e histórico persistente.

## Aviso

Este software é educacional e demonstrativo. Ele não promete lucro, não fornece garantia de resultado e não substitui formação, supervisão ou avaliação financeira independente. Mercados alavancados e operações de curto prazo envolvem risco elevado de perda.
