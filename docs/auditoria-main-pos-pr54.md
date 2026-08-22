# Auditoria da `main` após a PR #54

Data da auditoria: 21 de agosto de 2026.

## Escopo

Esta auditoria verifica o estado do repositório após o merge da PR #54 sem tratar merge como prova automática de release ou funcionamento em produção.

Baseline auditada:

- repositório: `detritoscosmico/suzy-command-center`;
- branch padrão: `main`;
- commit inicial auditado: `bb49e95ee62037194b3d8220e3a32ff301297c59`;
- PR associada ao commit: #54 — Mercado ao Vivo / widget externo do Investing.com.

## Resultado

| Área | Evidência | Estado |
| --- | --- | --- |
| `main` | HEAD auditado corresponde ao merge da PR #54 | confirmado |
| GitHub Pages | metadado do repositório informa `has_pages: true` | habilitado; disponibilidade funcional não inferida |
| Qualidade | `.github/workflows/quality.yml` executa em `push` para `main` e em `pull_request` | configurado |
| CodeQL | `.github/workflows/codeql.yml` está versionado no repositório | configurado |
| CI pós-merge #54 | o conector disponível não retorna de forma conclusiva os runs de `push` do HEAD auditado | não confirmado nesta auditoria |
| Versão | `package.json` e `package-lock.json` estavam em 1.29.0 após mudanças posteriores à PR #48 | inconsistente; corrigido para 1.30.0 nesta PR |
| Branch protection | API da branch informa `protected: false` | pendente; risco alto de governança |
| Tags/Releases | não há ação de leitura de tags/releases exposta pelo conector usado nesta auditoria | não confirmado |
| Automação de release | diretório `.github/workflows` contém apenas `quality.yml` e `codeql.yml` | não existe workflow de release versionado |

## Correções desta PR

1. Alinhar `package.json` e `package-lock.json` em `1.30.0`.
2. Atualizar o roadmap para registrar a auditoria pós-PR #54 e separar versão de código, tag/release e produção.
3. Registrar este relatório como evidência auditável de estado e limitações.

## Gates antes do merge

A PR só deve ser considerada pronta quando:

- `Qualidade` concluir com sucesso no HEAD da PR;
- `CodeQL` concluir com sucesso no HEAD da PR;
- não houver threads de revisão não resolvidas;
- a branch permanecer sincronizada com `main` no momento da decisão.

## Gates administrativos após o merge

Estes itens não são resolvidos por alterações de arquivos nesta PR:

1. habilitar proteção ou ruleset para `main` exigindo os checks definidos pela política do projeto;
2. confirmar o deployment do GitHub Pages contra o SHA efetivamente publicado;
3. decidir e publicar tag/release formal da versão 1.30.0 somente após os gates de merge e deployment;
4. escolher explicitamente a licença de software antes de tratar o repositório como pacote distribuível maduro.

## Evidência manual pós-merge da PR #55

Em 21 de agosto de 2026, o mantenedor confirmou manualmente na interface do GitHub que:

- a branch `main` exibe o indicador visual de ruleset/proteção;
- o ruleset `main-professional-protection-v1` está com enforcement `Active` e aplicado à `main`;
- pull request é obrigatória antes de merge;
- o número de aprovações obrigatórias está configurado em `0` nesta fase;
- resolução de conversas é obrigatória;
- os checks `test` e `Analisar JavaScript` são obrigatórios;
- a branch da PR precisa estar atualizada antes do merge;
- histórico linear é obrigatório;
- force push está bloqueado;
- exclusão da branch está bloqueada.

Essa evidência é classificada como **verificação manual do mantenedor**. Ela não substitui leitura automatizada do endpoint de rulesets, que não está exposto pelo conector disponível nesta sessão. A leitura automatizada do endpoint de branch continuou retornando `protected: false`, portanto a divergência entre essa resposta da API da branch e a interface do ruleset permanece registrada como limitação de observabilidade da integração usada nesta auditoria.

## Limites

- `has_pages: true` comprova que GitHub Pages está habilitado, não que cada funcionalidade está operacional no ambiente publicado;
- CI verde em uma pull request comprova os testes executados sobre aquele HEAD, não disponibilidade do serviço;
- `version: 1.30.0` é metadado de código e não cria tag, GitHub Release ou garantia de produção;
- o widget do Investing.com é conteúdo externo e não transforma o Suzy Command Center em provedor próprio de dados de mercado.
