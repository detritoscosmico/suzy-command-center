# SUZY COMMAND CENTER

Central educacional para treinamento, registro de operações, gestão de risco e formação estruturada de traders. O projeto possui dois modos:

- **GitHub Pages:** demonstração estática, com dados salvos no navegador;
- **modo local seguro:** servidor restrito ao computador, autenticação e histórico persistente criptografado em SQLite.

## Demonstração pública

A versão publicada no GitHub Pages continua funcionando sem backend. Ela não conecta com corretora, não executa ordens e não utiliza cotações reais.

O painel de velas inclui um laboratório gráfico artificial com períodos de 5 segundos a 1 mês, EMA 9/21, SMA 50, Bandas de Bollinger, RSI 14, reconhecimento heurístico de padrões de velas e bandeiras, além de linhas manuais de tendência, suporte e resistência. Esses recursos servem apenas para estudo e não produzem sinais operacionais.

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
npm ci
npm run serve:secure
```

O terminal informa um endereço semelhante a:

```text
http://127.0.0.1:8787
```

Abra `http://127.0.0.1:8787/login.html`, crie a primeira conta e guarde a chave de recuperação exibida. Depois use `http://127.0.0.1:8787/diario.html` para sincronizar registros ativos, versões anteriores e lixeira diretamente com o SQLite.

O banco e a chave AES padrão ficam em:

```text
data/suzy-local.sqlite3
data/suzy-local.sqlite3.key
```

O conteúdo operacional do diário é protegido com AES-256-GCM antes da gravação. Preserve a chave junto do plano de backup, preferencialmente em local separado do banco.

A implementação e as limitações estão documentadas em `docs/backend-local-seguro.md`, `docs/criptografia-repouso-sqlite.md`, `docs/recuperacao-senha-local.md` e `docs/sincronizacao-direta-diario.md`.

## Módulos de formação

### Academia Suzy — Nível 1

Arquivo: `academia.html`

Seis aulas sobre mentalidade, mercados, candles, gestão de risco, playbook e validação. As aulas são sequenciais, possuem exercícios, verificação obrigatória e avaliação final com nota mínima de 70%.

### Academia Suzy — Nível 2

Arquivo: `academia-nivel2.html`

Oito aulas de análise técnica aplicada, cinco exercícios práticos e avaliação final com nota mínima de 75%. Abrange estrutura, zonas, tendência, pullbacks, candles, indicadores, confluência, invalidação, risco-retorno, checklist e playbook.

### Programa de Formação por Competências

Arquivos: `programa.html`, `risco.html`, `microestrutura.html`, `capstone.html`, `governanca.html` e `dados.html`.

Seis ciclos conectam evidências do estudo a gates de processo: passaporte de competências, dimensionamento de risco, qualidade de execução, decisão sob incerteza, governança do playbook e proveniência de dados autorizados. A versão 1.23 acrescenta uma matriz institucional que separa conteúdo, prática, avaliação, retenção e validação externa, mantendo visíveis as competências ainda não cobertas.

Consulte `docs/roadmap-formacao-institucional.md`, `docs/matriz-competencias-institucionais.md` e `docs/roadmap-prontidao-institucional.md`. O programa não concede licença, certificação ou equivalência com uma instituição financeira.

### Psicologia, Disciplina e Avaliação Comportamental

Arquivo: `psicologia.html`

- trilha educacional de cinco aulas sobre processo, ativação emocional, reação a perdas, pré-compromisso e revisão;
- check-in diário de prontidão com seis fatores;
- classificação conservadora para estudo, simulação reduzida, pausa ou encerramento da sessão de treinamento;
- avaliação de 18 afirmações em seis dimensões comportamentais;
- pontuação de impulsividade, reação a perdas, aderência ao plano, regulação emocional, paciência e aceitação do risco;
- plano de ação gerado pelas três maiores prioridades;
- sequência diária e histórico de até 90 check-ins;
- até 24 avaliações salvas no navegador;
- integração opcional e consentida com o diário, limitada a data, pontuação, classificação e orientação do check-in;
- exportação JSON local;
- aviso explícito de que o módulo não é diagnóstico psicológico ou médico.

A metodologia, as fórmulas e os limites estão documentados em `docs/trilha-psicologia-disciplina.md`.

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
- resumo opcional do check-in de prontidão do mesmo dia, mediante consentimento explícito;
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
- envio e restauração direta do estado completo no SQLite;
- criptografia autenticada do conteúdo antes da persistência;
- migração automática e segura de bancos antigos que continham somente registros ativos;
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
- importação manual de backup JSON completo;
- exportação de registros ativos, versões e lixeira persistidos;
- remoção confirmada do estado completo remoto;
- indicador da quantidade de registros ativos no SQLite.

## Persistência do ciclo de vida

O backend mantém compatibilidade com o esquema existente de `journal_entries`. Versões e lixeira são serializadas em JSON, codificadas em Base64 UTF-8, divididas em registros internos reservados e gravadas na mesma transação dos registros ativos.

Esses registros internos:

- não aparecem no Diário Profissional;
- não entram nas estatísticas;
- não são contados como operações pela tela de conta;
- são validados pelo servidor como qualquer outro registro;
- possuem sequência verificada antes da restauração;
- bloqueiam a restauração quando o envelope está incompleto ou corrompido.

Antes da persistência, tanto os registros ativos quanto os registros internos são incluídos em envelopes AES-256-GCM individuais. Os campos legados no SQLite recebem apenas marcadores sem conteúdo operacional.

Quando o SQLite antigo contém somente registros ativos e eles coincidem com o navegador, a interface acrescenta o envelope de ciclo de vida sem apagar operações. Quando existe divergência, nenhuma cópia é substituída sem confirmação.

## Segurança do backend local

- servidor vinculado somente a `127.0.0.1`;
- conteúdo do diário criptografado com AES-256-GCM antes da gravação;
- vetor de inicialização aleatório e tag de autenticação por registro;
- dados associados ao usuário, identificador e versão do envelope;
- marcador criptografado que detecta chave incorreta;
- migração transacional e remoção do texto sensível dos campos legados;
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
- conflitos entre navegador e SQLite não são sobrescritos silenciosamente;
- metadados incompletos de versões ou lixeira bloqueiam restauração automática.

## Recursos atuais

- Academia Suzy — Níveis 1 e 2;
- trilha de psicologia, disciplina e avaliação comportamental;
- calendário econômico educacional com importação autorizada;
- replay com dados artificiais ou históricos importados;
- simulador de ordens com custos operacionais;
- diário profissional com estatísticas avançadas, versões e lixeira;
- autenticação individual no modo local;
- alteração e recuperação segura da senha local;
- sincronização completa do diário com SQLite;
- criptografia autenticada em repouso para o conteúdo operacional do diário;
- migração compatível de bancos antigos com registros ativos;
- restauração direta e resolução explícita de divergências;
- catálogo estruturado em JSON com fallback local e 24 ações globais para estudo;
- scanner demonstrativo e gráfico de velas artificiais;
- registro manual de WIN e LOSS;
- gestão de risco com entrada máxima, stop diário e limites operacionais;
- relatórios e exportação CSV protegida contra fórmulas;
- voz da Suzy pelo navegador;
- layout responsivo para computador e celular;
- testes unitários, testes da API e testes de integração em Chromium, Firefox e WebKit;
- auditoria automatizada de acessibilidade WCAG com axe-core;
- validação contínua pelo GitHub Actions;
- matriz de competências E0–E5 e roadmap de prontidão institucional;
- instalação reprodutível com lockfile, análise CodeQL e atualizações assistidas pelo Dependabot.

## Estrutura

```text
suzy-command-center/
├── .github/
│   ├── dependabot.yml
│   └── workflows/
│       ├── codeql.yml
│       └── quality.yml
├── academia.html
├── academia-nivel2.html
├── calendario.html
├── capstone.html
├── dados.html
├── diario.html
├── governanca.html
├── index.html
├── login.html
├── microestrutura.html
├── programa.html
├── psicologia.html
├── replay.html
├── risco.html
├── simulador.html
├── assets/
├── css/
├── dados/
├── docs/
│   ├── matriz-competencias-institucionais.md
│   ├── roadmap-formacao-institucional.md
│   ├── roadmap-prontidao-institucional.md
│   └── documentação dos módulos
├── js/
├── server/
├── test/
├── package.json
├── package-lock.json
├── SECURITY.md
└── README.md
```

## Testes

Instale as dependências e os três motores de navegador:

```bash
npm ci
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
- o envelope de versões e lixeira possui limite conservador de 350.000 caracteres codificados, além do limite geral de 2 MB da API;
- respostas brutas e o estado completo da trilha comportamental permanecem somente no navegador e na exportação JSON; apenas o resumo consentido de um check-in pode acompanhar uma entrada do diário;
- sem a senha e sem uma chave de recuperação válida, não existe recuperação automática da conta;
- sem a chave AES correspondente, o conteúdo criptografado do diário não pode ser recuperado;
- identificadores, vínculo com usuário, datas técnicas e quantidade de registros permanecem visíveis no SQLite;
- a chave padrão fica próxima ao banco por conveniência; `SUZY_KEY_PATH` ou `SUZY_DATA_KEY` permitem separação maior;
- backups JSON e CSV exportados não recebem automaticamente a criptografia do SQLite;
- não há feed real de preços ou calendário econômico oficial;
- não há conexão com corretora;
- não executa ordens reais ou automáticas;
- a origem e a licença dos históricos e calendários importados são responsabilidade do usuário;
- o simulador não reproduz livro de ofertas, liquidez parcial, latência, swap, margem ou impostos;
- a matriz de competências é uma autoavaliação rastreável do projeto, não validação externa;
- o projeto ainda não possui uma licença de software escolhida pelo mantenedor;
- CodeQL, Dependabot e testes automatizados reduzem risco, mas não substituem revisão humana ou resposta a incidentes;
- testes automatizados de acessibilidade não substituem revisão manual com teclado, leitor de tela e usuários reais.

## Próximas etapas recomendadas

1. Escolher a função profissional e a jurisdição prioritárias.
2. Implementar o Ciclo 8 de fundamentos profissionais com avaliações E3.
3. Definir explicitamente a licença do repositório.
4. Planejar calibração de mercado, retenção e piloto externo conforme `docs/roadmap-prontidao-institucional.md`.

## Aviso

Este software é educacional e demonstrativo. Ele não promete lucro, não fornece garantia de resultado e não substitui formação, supervisão, atendimento psicológico ou avaliação financeira independente. Mercados alavancados e operações de curto prazo envolvem risco elevado de perda.
