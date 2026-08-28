# Auditoria pré-release 1.32.0

## Objetivo

Registrar o estado pós-merge da PR #62 e preparar os gates para eventual criação de tag e GitHub Release 1.32.0, sem confundir versão de código, deployment estático e publicação formal.

Esta auditoria não declara funcionamento em produção, recomendação financeira, conexão com corretora, execução real, backend hospedado ou certificação profissional.

## Baseline candidata

- repositório: `detritoscosmico/suzy-command-center`;
- branch de referência: `main`;
- SHA candidato final: `dc8e2acfd987d833922986d09eeb0efcc8c0e5ef`;
- PR #62: mesclada, merge commit `afcdbc95c6dc82f1163f9243e49959c564466fd1`;
- PR #64: mesclada, merge commit `0dd9c833e5e5b1df95257c392f29d6be90e11298`;
- PR #65: mesclada, merge commit `dc8e2acfd987d833922986d09eeb0efcc8c0e5ef`;
- versão de código: `1.32.0`;
- Entrega 7 do Ciclo 8: Derivativos E3;
- data da auditoria final: 28 de agosto de 2026, America/Sao_Paulo.

## Evidência confirmada

No SHA final candidato `dc8e2acfd987d833922986d09eeb0efcc8c0e5ef`:

- `main`: aponta exatamente para esse SHA e o commit está verificado pelo GitHub;
- PR #62: fechada e mesclada;
- PR #64: fechada e mesclada;
- PR #65: fechada e mesclada;
- `package.json`: versão `1.32.0`;
- Qualidade #216, evento `push` na `main`: `SUCCESS`;
- CodeQL #134, evento `push` na `main`: `SUCCESS`;
- Pages build and deployment #59: `SUCCESS`;
- build, deploy e report-build-status do Pages: `SUCCESS`;
- a trilha de Derivativos está integrada à `main`;
- os findings conhecidos da PR #62 foram corrigidos, cobertos por regressões e resolvidos;
- a inconsistência documental sobre a publicação da versão 1.31.0 foi corrigida pela PR #65.

## Estado de tag e GitHub Release

As consultas atuais não encontraram:

- ref/tag `1.32.0`;
- ref/tag `v1.32.0`;
- GitHub Release associada a `1.32.0`;
- GitHub Release associada a `v1.32.0`.

Também não foi encontrada tag `1.31.0`/`v1.31.0` nem uma GitHub Release publicada como `latest` no endpoint público consultado. Por isso, referências históricas a “Release 1.31.0 publicada” devem ser interpretadas com cautela até evidência formal de tag/Release.

## Reconciliação documental

A reconciliação pós-merge foi concluída pelas PRs #64 e #65:

- README: Derivativos está registrado como integrado na `main`;
- roadmap de prontidão: Entrega 7 está registrada como implementada, mesclada e validada pós-merge;
- roadmap de formação: Ciclo 8 registra 7 entregas integradas na `main`;
- matriz de competências: Derivativos está integrado sem promoção automática de níveis por função;
- versão 1.31.0 é tratada como baseline técnica anterior, sem alegação de tag/GitHub Release inexistente.

Esta PR documental apenas atualiza o gate final da candidata 1.32.0 para o estado real após as PRs #64 e #65.

## Proteção da `main` — gate de governança

A leitura atual do GitHub em 28 de agosto de 2026 reporta:

- `main protected: false`;
- proteção clássica desabilitada;
- zero rulesets ativos no repositório.

Isso **não invalida** Qualidade #216, CodeQL #134 ou Pages #59, mas reduz a garantia de que a `main` permanecerá imutável entre o GO e a criação da tag.

O conector GitHub disponível nesta auditoria permite leitura de rulesets, mas não expõe operação para criar ou editar rulesets. Portanto, a restauração de `main-professional-protection-v1` é **ação manual do mantenedor**.

Configuração exigida para restaurar o ruleset:

1. ruleset de branch chamado `main-professional-protection-v1`;
2. enforcement: `Active`;
3. alvo: branch `main` (ou default branch, desde que resolva somente para a `main` neste repositório);
4. exigir pull request antes do merge;
5. approvals mínimos: 0, preservando o gate automatizado atual;
6. exigir resolução de todas as conversas antes do merge;
7. exigir status checks:
   - `test`;
   - `Analisar JavaScript`;
8. habilitar `Require branches to be up to date before merging`;
9. exigir histórico linear;
10. bloquear force pushes;
11. restringir exclusões da branch;
12. bypass administrativo, se mantido, apenas `For pull requests only`, para preservar trilha auditável.

Após a restauração, o ruleset deve ser relido pela API/conector e confirmado como ativo antes da autorização de publicação da Release 1.32.0.

## Gate final da candidata

O SHA `dc8e2acfd987d833922986d09eeb0efcc8c0e5ef` é a **baseline pré-PR #66** e possui evidência verde:

1. Qualidade #216 no evento `push` = `SUCCESS`;
2. CodeQL #134 no evento `push` = `SUCCESS`;
3. Pages #59 = `SUCCESS`;
4. versão `1.32.0` preservada em `package.json`;
5. PRs #62, #64 e #65 mescladas;
6. tag `1.32.0`/`v1.32.0` inexistente;
7. GitHub Release 1.32.0 inexistente;
8. release notes candidatas e limitações preservadas.

A própria PR #66, ao ser mesclada, produzirá um **novo SHA da `main`**. Portanto, o gate final obrigatório é:

1. restaurar e validar o ruleset `main-professional-protection-v1`;
2. mesclar a PR #66 somente após seus checks e review estarem verdes;
3. capturar o novo SHA resultante da `main`;
4. validar **nesse novo SHA**:
   - Qualidade no evento `push` = `SUCCESS`;
   - CodeQL no evento `push` = `SUCCESS`;
   - Pages build/deployment = `SUCCESS`;
   - `package.json` continua em `1.32.0`;
5. reconfirmar que `main-professional-protection-v1` continua ativo e que a `main` não avançou depois desses gates;
6. obter autorização explícita antes da criação da tag `v1.32.0` e da GitHub Release.

A tag/Release **não deve** apontar para `dc8e2ac...` se a PR #66 tiver sido mesclada; deve apontar para o SHA pós-merge efetivamente revalidado.

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

**CANDIDATA TÉCNICA PRONTA PARA O GATE FINAL — ainda não publicar.**

O código, os gates históricos da baseline pré-PR #66, o versionamento e a reconciliação documental estão coerentes com a candidata 1.32.0. A publicação permanece bloqueada pelo gate final:

- restaurar e validar o ruleset `main-professional-protection-v1`;
- mesclar a PR #66 somente após seus gates verdes;
- identificar o novo SHA pós-merge da `main`;
- revalidar Qualidade, CodeQL e Pages exatamente nesse novo SHA;
- reconfirmar versão 1.32.0, ruleset ativo e ausência de avanço posterior da `main`;
- obter autorização explícita para criar `v1.32.0` e publicar `Suzy Command Center 1.32.0`.

Até esse gate ser fechado, não criar tag nem GitHub Release.
