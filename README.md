# SUZY COMMAND CENTER

Central educacional para treinamento, registro de operações, gestão de risco e formação estruturada de traders. O projeto possui dois modos:

- **GitHub Pages:** demonstração estática, com dados salvos no navegador;
- **modo local seguro:** servidor restrito ao computador, autenticação e histórico persistente em SQLite.

## Demonstração pública

A versão publicada no GitHub Pages continua funcionando sem backend. Ela não conecta com corretora, não executa ordens e não utiliza cotações reais.

## Executar a versão estática

1. Clone ou baixe o repositório.
2. Abra a pasta no VS Code.
3. Instale a extensão **Live Server**.
4. Clique com o botão direito em `index.html`.
5. Selecione **Open with Live Server**.

Também é possível abrir os arquivos HTML diretamente no navegador.

## Executar o modo local seguro

Requer Node.js 22 ou superior.

```bash
npm install
npm run serve:secure
```

O terminal informa um endereço semelhante a:

```text
http://127.0.0.1:8787
```

Abra `http://127.0.0.1:8787/login.html`, crie a primeira conta e depois use `http://127.0.0.1:8787/diario.html` para sincronizar o histórico diretamente com o SQLite.

O banco padrão fica em:

```text
data/suzy-local.sqlite3
```

A implementação e as limitações estão documentadas em `docs/backend-local-seguro.md` e `docs/sincronizacao-direta-diario.md`.

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
- exportação CSV e backup JSON;
- detecção automática do backend local;
- envio e restauração direta do SQLite;
- confirmação explícita quando as cópias divergem;
- sincronização automática após o alinhamento inicial.

A metodologia está documentada em `docs/diario-profissional.md`. A persistência direta está documentada em `docs/sincronizacao-direta-diario.md`.

### Conta local protegida

Arquivo: `login.html`

No modo local seguro, essa página oferece:

- criação da primeira conta;
- login e logout;
- sessão com cookie HttpOnly;
- importação manual de backup JSON como recurso adicional;
- exportação do histórico persistido;
- remoção confirmada do histórico remoto;
- indicador da quantidade de registros no SQLite.

## Segurança do backend local

- servidor vinculado somente a `127.0.0.1`;
- senha derivada com PBKDF2-HMAC-SHA256 e salt aleatório;
- token de sessão armazenado apenas como hash;
- cookie `HttpOnly` e `SameSite=Strict`;
- proteção CSRF para alterações;
- limitação de tentativas de login;
- validação de payload e limites de tamanho;
- cabeçalhos CSP, antiframe e `nosniff`;
- proteção contra leitura de arquivos fora da raiz do projeto;
- conflitos entre navegador e SQLite não são sobrescritos silenciosamente.

## Recursos atuais

- Academia Suzy — Níveis 1 e 2;
- replay com dados artificiais ou históricos importados;
- simulador de ordens com custos operacionais;
- diário profissional com estatísticas avançadas;
- autenticação individual no modo local;
- sincronização direta do diário com SQLite;
- restauração direta e resolução explícita de divergências;
- catálogo estruturado em JSON com fallback local;
- scanner demonstrativo e gráfico de velas artificiais;
- registro manual de WIN e LOSS;
- gestão de risco com entrada máxima, stop diário e limites operacionais;
- relatórios e exportação CSV protegida contra fórmulas;
- voz da Suzy pelo navegador;
- layout responsivo para computador e celular;
- testes unitários, testes da API e testes de integração no navegador;
- validação contínua pelo GitHub Actions.

## Estrutura

```text
suzy-command-center/
├── .github/workflows/quality.yml
├── academia.html
├── academia-nivel2.html
├── diario.html
├── index.html
├── login.html
├── replay.html
├── simulador.html
├── playwright.config.js
├── assets/
├── css/
│   ├── diario-sync.css
│   └── login.css
├── dados/
├── docs/
│   ├── backend-local-seguro.md
│   ├── diario-profissional.md
│   ├── importacao-historico-replay.md
│   ├── simulador-custos-operacionais.md
│   ├── sincronizacao-direta-diario.md
│   └── testes-integracao-interface.md
├── js/
│   ├── diario-sync.js
│   ├── journal-sync-core.js
│   └── login.js
├── server/
│   ├── database.js
│   ├── security.js
│   ├── server.js
│   └── validation.js
├── test/
│   ├── e2e/
│   ├── journal-sync.test.js
│   ├── server-api.test.js
│   ├── server-security.test.js
│   └── demais testes unitários
├── package.json
└── README.md
```

## Testes

Instale as dependências e o Chromium:

```bash
npm install
npx playwright install chromium
```

Verificação de sintaxe:

```bash
npm run check
```

Testes unitários, segurança e API local:

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

## Limitações atuais

- o GitHub Pages não executa o backend local;
- o servidor local precisa permanecer ligado para usar o SQLite;
- não existe sincronização pela internet ou entre computadores;
- não existe recuperação de senha;
- o banco local não é criptografado em repouso;
- não há feed real de preços ou calendário econômico oficial;
- não há conexão com corretora;
- não executa ordens reais ou automáticas;
- a origem e a licença dos históricos importados são responsabilidade do usuário;
- o simulador não reproduz livro de ofertas, liquidez parcial, latência, swap, margem ou impostos;
- os testes de navegador usam apenas Chromium.

## Próximas etapas recomendadas

1. Criar alteração e recuperação segura de senha local.
2. Implementar calendário econômico por fonte autorizada.
3. Ampliar testes para Firefox, WebKit e acessibilidade automatizada.
4. Adicionar histórico de versões e lixeira ao diário.

## Aviso

Este software é educacional e demonstrativo. Ele não promete lucro, não fornece garantia de resultado e não substitui formação, supervisão ou avaliação financeira independente. Mercados alavancados e operações de curto prazo envolvem risco elevado de perda.
