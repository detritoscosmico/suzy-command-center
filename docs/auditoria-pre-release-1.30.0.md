# Auditoria pré-release 1.30.0

Data: 21 de agosto de 2026 (America/Sao_Paulo).

## Objetivo

Registrar o gate final de governança antes da publicação formal da versão 1.30.0, sem tratar merge, tag, GitHub Release ou GitHub Pages isoladamente como prova de funcionamento integral em produção.

## Baseline antes desta PR

- branch: `main`;
- SHA: `ca868b4c1c2e33af1734787dbe26370a1a94d245`;
- versão em `package.json`: `1.30.0`;
- versão raiz do `package-lock.json`: `1.30.0`;
- `@playwright/test`: `1.62.0`;
- `@axe-core/playwright`: `4.13.0`.

## CI e proteção

A PR #56, documental, concluiu com sucesso os gates `Qualidade` e `CodeQL` antes do merge. O mantenedor também confirmou manualmente na interface do GitHub que o ruleset `main-professional-protection-v1` está ativo e aplicado à `main`, exigindo PR, resolução de conversas, os checks `test` e `Analisar JavaScript`, branch atualizada, histórico linear e bloqueio de force push e exclusão.

A leitura simplificada de branch disponível no conector continuou retornando `protected: false`; essa divergência é tratada como limitação de observabilidade da integração e permanece registrada na auditoria anterior.

## GitHub Pages

O mantenedor confirmou manualmente que o deployment do GitHub Pages associado ao SHA `ca868b4c1c2e33af1734787dbe26370a1a94d245` estava `SUCCESS/ACTIVE`, originado da `main`, e que a demonstração pública abriu normalmente.

Esta PR de governança alterará o SHA final da `main` se for mesclada. Portanto, antes de publicar a Release 1.30.0, o deployment do Pages deve ser novamente conferido contra o **novo SHA pós-merge desta PR**, mesmo que as alterações sejam apenas documentação/licenciamento.

## Tags e Releases

O mantenedor confirmou manualmente que não existe tag nem GitHub Release conflitante com `v1.30.0` ou `1.30.0` no momento desta decisão.

Essa informação é classificada como **verificação manual do mantenedor**, pois o conector utilizado nesta sessão não expõe listagem conclusiva de tags e releases.

## Licenciamento

Foi aprovada a política de **software proprietário / todos os direitos reservados** para os materiais originais do Suzy Command Center nesta fase.

Esta PR adiciona:

- `LICENSE` com aviso proprietário;
- `docs/licenciamento-proprietario.md` com escopo, terceiros, contribuições externas, uso comercial e limites da política.

A visibilidade pública do repositório não é tratada como licença open source. Dependências e componentes de terceiros permanecem sujeitos às próprias licenças e termos.

## Riscos remanescentes

1. O GitHub pode classificar um aviso proprietário como licença customizada ou continuar sem identificador SPDX; isso não deve ser confundido com ausência da decisão de copyright registrada no repositório.
2. Contribuições externas exigem política adicional de direitos; uma pull request de terceiro não deve ser presumida como cessão automática de copyright.
3. O GitHub Pages valida somente a demonstração estática; não comprova backend local, SQLite, integrações futuras, feed próprio, corretora ou execução real.
4. Não existe workflow de release versionado; criação de tag e GitHub Release permanece um gate administrativo separado.
5. A release deve apontar para o SHA exato da `main` resultante após o merge desta PR e após a validação pós-merge aplicável.

## Gate desta PR

Esta PR é exclusivamente de governança. Antes de ser considerada pronta para merge, deve concluir com sucesso:

- `Qualidade` / job `test`;
- `CodeQL` / job `Analisar JavaScript`;
- nenhuma thread de revisão pendente;
- branch sincronizada com `main` no momento da decisão.

## Decisão após merge

O merge desta PR **não cria automaticamente a Release 1.30.0**. Após o merge, devem ser confirmados o novo SHA da `main`, os checks aplicáveis e o deployment do GitHub Pages sobre esse SHA. Somente então deve ser tomada a decisão final de criar a tag `v1.30.0` e o GitHub Release correspondente.
