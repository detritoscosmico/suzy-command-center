# Testes multinavegador e acessibilidade

## Objetivo

Validar os fluxos críticos do Suzy Command Center em motores de navegador diferentes e detectar automaticamente problemas graves de acessibilidade antes da integração na branch `main`.

## Navegadores cobertos

O Playwright executa a suíte nos seguintes projetos:

- `chromium-desktop` — Desktop Chrome;
- `firefox-desktop` — Desktop Firefox;
- `webkit-desktop` — Desktop Safari;
- `chromium-mobile` — Pixel 7 em Chromium.

Os fluxos funcionais completos são executados nos três projetos desktop. O projeto móvel valida carregamento, responsividade e os fluxos explicitamente preparados para telas menores.

## Auditoria automatizada

O arquivo `test/e2e/accessibility.spec.js` usa `@axe-core/playwright` para analisar as páginas públicas segundo regras WCAG 2.0 e 2.1, níveis A e AA.

A integração é bloqueada quando o axe-core encontra violações classificadas como:

- `critical`;
- `serious`.

A auditoria é executada uma vez em `chromium-desktop` para evitar repetir a mesma análise semântica em todos os motores. A compatibilidade de interface continua sendo validada em Firefox e WebKit.

Também existe um teste de navegação por teclado no Command Center, confirmando foco em elemento interativo e ativação de uma seção por `Enter`.

## Páginas auditadas

- `index.html`;
- `alunos.html`;
- `academia.html`;
- `academia-nivel2.html`;
- `replay.html`;
- `simulador.html`;
- `diario.html`;
- `calendario.html`;
- `psicologia.html`;
- `programa.html`;
- `risco.html`;
- `microestrutura.html`;
- `capstone.html`;
- `governanca.html`;
- `dados.html`;
- `etica.html`;
- `login.html`.

## Execução local

```bash
npm ci
npx playwright install chromium firefox webkit
npm run check
npm run test:unit
npm run test:e2e
```

Para executar apenas a auditoria de acessibilidade:

```bash
npm run test:e2e:accessibility
```

Para abrir o relatório HTML:

```bash
npm run test:e2e:report
```

## GitHub Actions

O workflow `.github/workflows/quality.yml`:

1. instala Node.js 22;
2. instala as dependências do projeto;
3. instala Chromium, Firefox e WebKit com as dependências do sistema;
4. verifica a sintaxe;
5. executa testes unitários, de segurança e API;
6. executa a suíte Playwright multinavegador e a auditoria axe-core;
7. publica o relatório HTML por sete dias, inclusive quando existe falha.

O limite do job foi ampliado para 30 minutos devido à instalação e execução dos três motores.

## Interpretação de falhas

Uma falha deve ser tratada conforme a origem:

- **somente Firefox:** possível incompatibilidade Gecko;
- **somente WebKit:** possível incompatibilidade Safari/iOS;
- **todos os navegadores:** regressão funcional ou problema compartilhado;
- **axe-core:** falha semântica, de nome acessível, contraste, estrutura ou interação;
- **somente celular:** sobreposição, dimensão insuficiente, rolagem ou evento de ponteiro interceptado.

Não use `force: true` em cliques para esconder problemas reais de layout. Corrija a sobreposição ou a estrutura da interface.

## Limitações

A automação não substitui:

- avaliação manual com teclado completo;
- testes com leitores de tela como NVDA, JAWS ou VoiceOver;
- revisão de linguagem e compreensão;
- teste com ampliação de tela;
- avaliação por pessoas com deficiência;
- validação de contraste em todos os estados visuais dinâmicos.

A ausência de violações automatizadas não equivale a conformidade integral com WCAG.
