# SUZY COMMAND CENTER

Central educacional para treinamento, registro de operações, gestão de risco e formação estruturada de traders. O projeto possui dois modos:

- **GitHub Pages:** demonstração estática, com dados salvos no navegador;
- **modo local seguro:** servidor restrito ao computador, autenticação e histórico persistente em SQLite.

## Demonstração pública

A versão publicada no GitHub Pages continua funcionando sem backend. Ela não conecta com corretora, não executa ordens e não utiliza cotações reais.

O painel de velas inclui um laboratório gráfico artificial com EMA 9/21, SMA 50, Bandas de Bollinger, RSI 14, reconhecimento heurístico de padrões de velas e bandeiras, além de linhas manuais de tendência, suporte e resistência. Esses recursos servem apenas para estudo e não produzem sinais operacionais.

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

Abra `http://127.0.0.1:8787/login.html`, crie a primeira conta e guarde a chave de recuperação exibida. Depois use `http://127.0.0.1:8787/diario.html` para sincronizar o histórico diretamente com o SQLite.

O banco padrão fica em:

```text
data/suzy-local.sqlite3
```

A implementação e as limitações estão documentadas em `docs/backend-local-seguro.md`, `docs/recuperacao-senha-local.md` e `docs/sincronizacao-direta-diario.md`.

## Módulos de formação

### Academia Suzy — Nível 1

Arquivo: `academia.html`

Seis aulas sobre mentalidade, mercados, candles, gestão de risco, playbook e validação. As aulas são sequenciais, possuem exercícios, verificação obrigatória e avaliação final com nota mínima de 70%.

### Academia Suzy — Nível 2

Arquivo: `academia-nivel2.html`

Oito aulas de análise técnica aplicada, cinco exercícios práticos e avaliação final com nota mínima de 75%. Abrange estrutura, zonas, tendência, pullbacks, candles, indicadores, confluência, invalidação, risco-retorno, checklist e playbook.

### Calendário Econômico Educacional

Arquivo: `calendario.html`

- importação local de eventos CSV ou JSON obtidos de fonte autorizada;
- exigência de data e hora ISO 8601 com fuso explícito;
- validação de moeda, impacto, fonte e URL;
- filtros por período, moeda, impacto e situação;
- resumo das próximas 24 horas;
- remoção de duplicatas e ordenação cronológica;
- cenário artificial identificado como demonstração;
- protocolo educacional para risco antes, durante e depois de eventos.

O formato de importação e as limitações estão documentados em `docs/calendario-economico-autorizado.md`.

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
- edição de registros com preservação automática da versão anterior;
- até 20 versões anteriores por operação;
- restauração de versões anteriores sem perder a versão atual;
- lixeira com restauração e exclusão definitiva;
- exportação CSV e backup JSON completo com registros, versões e lixeira;
- detecção automática do backend local;
- envio e restauração direta dos registros ativos no SQLite;
- confirmação explícita quando as cópias divergem;
- sincronização automática após o alinhamento inicial.

A metodologia e o ciclo de vida dos registros estão documentados em `docs/diario-profissional.md`. A persistência direta está documentada em `docs/sincronizacao-direta-diario.md`.

### Conta local protegida

Arquivo: `login.html`

No modo local seguro, essa página oferece:

- criação da primeira conta;
- login e logout;
- alteração de senha mediante confirmação da senha atual;
- recuperação por chave aleatória mostrada uma única vez;
- rotação manual da chave de recuperação;
- encerramento de sessões antigas após troca ou recuperação;
- sessão com cookie HttpOnly;
- importação manual de backup JSON como recurso adicional;
- exportação do histórico persistido;
- remoção confirmada do histórico remoto;
- indicador da quantidade de registros no SQLite.

## Segurança do backend local

- servidor vinculado somente a `127.0.0.1`;
- senha derivada com PBKDF2-HMAC-SHA256 e salt aleatório;
- chave de recuperação armazenada somente como hash SHA-256;
- token de sessão armazenado apenas como hash;
- cookie `HttpOnly` e `SameSite=Strict`;
- proteção CSRF para alterações;
- limitação de tentativas de login, recuperação e ações sensíveis;
- invalidação de todas as sessões após troca ou recuperação de senha;
- validação de payload e limites de tamanho;
- cabeçalhos CSP, antiframe e `nosniff`;
- proteção contra leitura de arquivos fora da raiz do projeto;
- conflitos entre navegador e SQLite não são sobrescritos silenciosamente.

## Recursos atuais

- Academia Suzy — Níveis 1 e 2;
- calendário econômico educacional com importação autorizada;
- replay com dados artificiais ou históricos importados;
- simulador de ordens com custos operacionais;
- diário profissional com estatísticas avançadas, versões e lixeira;
- autenticação individual no modo local;
- alteração e recuperação segura da senha local;
- sincronização direta dos registros ativos do diário com SQLite;
- restauração direta e resolução explícita de divergências;
- catálogo estruturado em JSON com fallback local;
- scanner demonstrativo e gráfico de velas artificiais;
- registro manual de WIN e LOSS;
- gestão de risco com entrada máxima, stop diário e limites operacionais;
- relatórios e exportação CSV protegida contra fórmulas;
- voz da Suzy pelo navegador;
- layout responsivo para computador e celular;
- testes unitários, testes da API e testes de integração em Chromium, Firefox e WebKit;
- auditoria automatizada de acessibilidade WCAG com axe-core;
- validação contínua pelo GitHub Actions.

## Estrutura

```text
suzy-command-center/
├── .github/workflows/quality.yml
├── academia.html
├── academia-nivel2.html
├── calendario.html
├── diario.html
├── index.html
├── login.html
├── replay.html
├── simulador.html
├── playwright.config.js
├── assets/
├── css/
│   ├── calendario.css
│   ├── diario.css
│   ├── diario-sync.css
│   └── login.css
├── dados/
├── docs/
│   ├── backend-local-seguro.md
│   ├── calendario-economico-autorizado.md
│   ├── diario-profissional.md
│   ├── importacao-historico-replay.md
│   ├── recuperacao-senha-local.md
│   ├── simulador-custos-operacionais.md
│   ├── sincronizacao-direta-diario.md
│   └── testes-multinavegador-acessibilidade.md
├── js/
│   ├── calendario.js
│   ├── calendar-core.js
│   ├── diario.js
│   ├── diario-sync.js
│   ├── journal-core.js
│   ├── journal-lifecycle-core.js
│   ├── journal-sync-core.js
│   └── login.js
├── server/
│   ├── database.js
│   ├── security.js
│   ├── server.js
│   └── validation.js
├── test/
│   ├── e2e/
│   │   ├── accessibility.spec.js
│   │   └── critical-flows.spec.js
│   ├── calendar.test.js
│   ├── journal-lifecycle.test.js
│   ├── journal-sync.test.js
│   ├── server-api.test.js
│   ├── server-security.test.js
│   └── demais testes unitários
├── package.json
└── README.md
```

## Testes

Instale as dependências e os três motores de navegador:

```bash
npm install
npx playwright install chromium firefox webkit
```

Verificação de sintaxe:

```bash
npm run check
```

Testes unitários, segurança e API local:

```bash
npm run test:unit
```

Testes de integração em Chromium desktop e celular, Firefox desktop e WebKit desktop:

```bash
npm run test:e2e
```

Auditoria de acessibilidade isolada:

```bash
npm run test:e2e:accessibility
```

Abrir o relatório HTML:

```bash
npm run test:e2e:report
```

A estratégia está documentada em `docs/testes-multinavegador-acessibilidade.md`.

## Limitações atuais

- o GitHub Pages não executa o backend local;
- o servidor local precisa permanecer ligado para usar o SQLite;
- não existe sincronização pela internet ou entre computadores;
- versões e lixeira do diário permanecem somente no navegador e no backup JSON;
- sem a senha e sem uma chave de recuperação válida, não existe recuperação automática;
- o banco local não é criptografado em repouso;
- não há feed real de preços ou calendário econômico oficial;
- não há conexão com corretora;
- não executa ordens reais ou automáticas;
- a origem e a licença dos históricos e calendários importados são responsabilidade do usuário;
- o simulador não reproduz livro de ofertas, liquidez parcial, latência, swap, margem ou impostos;
- testes automatizados de acessibilidade não substituem revisão manual com teclado, leitor de tela e usuários reais.

## Próximas etapas recomendadas

1. Sincronizar histórico de versões e lixeira com o SQLite.
2. Criar trilha de psicologia, disciplina e avaliação comportamental.
3. Avaliar criptografia em repouso para o banco local.
4. Ampliar testes manuais com leitores de tela.

## Aviso

Este software é educacional e demonstrativo. Ele não promete lucro, não fornece garantia de resultado e não substitui formação, supervisão ou avaliação financeira independente. Mercados alavancados e operações de curto prazo envolvem risco elevado de perda.
