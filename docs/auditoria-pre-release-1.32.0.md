# Auditoria pré-release 1.32.0

## Objetivo

Registrar o estado pós-merge da PR #62 e preparar os gates para eventual criação de tag e GitHub Release 1.32.0, sem confundir versão de código, deployment estático e publicação formal.

Esta auditoria não declara funcionamento em produção, recomendação financeira, conexão com corretora, execução real, backend hospedado ou certificação profissional.

## Baseline candidata

- repositório: `detritoscosmico/suzy-command-center`;
- branch de referência: `main`;
- merge commit da PR #62: `afcdbc95c6dc82f1163f9243e49959c564466fd1`;
- versão de código: `1.32.0`;
- Entrega 7 do Ciclo 8: Derivativos E3;
- data da auditoria: 26 de agosto de 2026, America/Sao_Paulo.

## Evidência confirmada

No SHA `afcdbc95c6dc82f1163f9243e49959c564466fd1`:

- PR #62: fechada e mesclada;
- merge commit: assinado/verificado pelo GitHub;
- `package.json`: versão `1.32.0`;
- Qualidade #210, evento `push` na `main`: `SUCCESS`;
- CodeQL #128, evento `push` na `main`: `SUCCESS`;
- Pages build and deployment #57: `SUCCESS`;
- a trilha de Derivativos está integrada à `main`;
- os quatro findings conhecidos da PR #62 foram corrigidos, cobertos por regressões e resolvidos antes do merge.

## Estado de tag e GitHub Release

As consultas atuais não encontraram:

- ref/tag `1.32.0`;
- ref/tag `v1.32.0`;
- GitHub Release associada a `1.32.0`;
- GitHub Release associada a `v1.32.0`.

Também não foi encontrada tag `1.31.0`/`v1.31.0` nem uma GitHub Release publicada como `latest` no endpoint público consultado. Por isso, referências históricas a “Release 1.31.0 publicada” devem ser interpretadas com cautela até evidência formal de tag/Release.

## Reconciliação documental necessária

O merge da PR #62 deixou documentação com estado pré-merge. Esta preparação corrige:

- README: Derivativos passa de branch/em validação para integrado na `main`;
- roadmap de prontidão: Entrega 7 passa para implementada, mesclada e validada pós-merge;
- roadmap de formação: Ciclo 8 passa de 6 para 7 entregas concluídas na `main`;
- matriz de competências: a evidência de Derivativos passa a integrada, sem promoção automática de níveis por função.

## Gate desta PR de preparação

O merge desta reconciliação produzirá um novo SHA da `main`. Portanto, a tag/Release 1.32.0 **não deve ser criada antes** de validar novamente no SHA resultante:

1. Qualidade no evento `push` = `SUCCESS`;
2. CodeQL no evento `push` = `SUCCESS`;
3. Pages build/deployment = `SUCCESS`;
4. versão `1.32.0` preservada em `package.json`;
5. ausência de regressão documental ou funcional;
6. decisão explícita de publicação da tag/Release.

## Release notes candidatas

### Suzy Command Center 1.32.0 — Derivativos E3

Principais mudanças:

- nova trilha educacional E3 de Derivativos;
- futuros, opções e swaps;
- payoff linear e não linear;
- ajuste diário, margem, basis, vencimento e rolagem;
- contexto B3 para DI, índice e dólar;
- Black–Scholes como snapshot educacional simplificado;
- valor intrínseco e componente temporal;
- volatilidade, delta, gamma, theta e vega;
- 18 variantes e sessão determinística de 6 casos;
- rubrica E3 independente de lucro;
- integração com Programa Profissional e Área do Aluno;
- regressões para taxa negativa, cancelamento numérico, validação nativa de inputs e anúncio acessível do resultado;
- atualização de `@playwright/test` para 1.62.1.

Limites:

- não é recomendação, sinal ou suitability;
- não é motor profissional de precificação;
- não usa feed próprio nem conecta com corretora;
- GitHub Pages comprova somente a demonstração estática quando o deployment correspondente está verde;
- versão de código não equivale a GitHub Release.

## Decisão atual

**NO-GO temporário para criação da tag/Release 1.32.0.**

Motivo: esta própria reconciliação documental precisa ser revisada e mesclada. Depois do merge, os três gates pós-merge devem ser reexecutados no novo SHA da `main`. Se permanecerem verdes, a candidata poderá receber GO administrativo para tag/Release mediante autorização explícita.
