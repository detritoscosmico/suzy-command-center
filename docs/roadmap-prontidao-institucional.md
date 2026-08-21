# Roadmap de Prontidão Institucional

## Objetivo

Transformar a ambição de “nível profissional” em gates auditáveis. O avanço é medido por evidência educacional, fidelidade declarada, segurança e revisão independente — nunca por aparência da interface ou promessa de retorno.

## Estado auditado após a PR #54

Auditoria iniciada em 21 de agosto de 2026 sobre a `main` no commit `bb49e95ee62037194b3d8220e3a32ff301297c59`.

- GitHub Pages está habilitado no repositório, mas habilitação e merge em `main` não são tratados isoladamente como prova de disponibilidade funcional da demonstração;
- os workflows versionados são `Qualidade` e `CodeQL`; `Qualidade` está configurado para `push` em `main` e para pull requests;
- o conector disponível para a auditoria não expõe de forma conclusiva os runs de `push` associados ao commit auditado, portanto o CI pós-merge específico da PR #54 permanece **não confirmado** nesta evidência;
- `main` está sem branch protection, portanto a exigência de checks antes de alterações diretas ainda não é tecnicamente imposta pelo GitHub;
- os metadados de versão permaneceram em `1.29.0` após mudanças posteriores à PR #48; esta auditoria prepara `1.30.0` para alinhar `package.json` e `package-lock.json` ao estado atual do código;
- tag e GitHub Release formais devem ser verificados e publicados separadamente; a versão declarada no pacote não é prova de release;
- a PR #54 introduziu a área **Mercado ao Vivo** com conteúdo externo do Investing.com. O widget permanece separado dos cenários simulados e não constitui feed próprio, conexão com corretora ou execução de ordens.

Gate desta auditoria: a PR de correção só deve ser mesclada após `Qualidade` e `CodeQL` concluírem sem falhas no HEAD da própria PR. Branch protection, tag/release e verificação operacional do deployment permanecem gates administrativos separados.

## Decisão-base do mantenedor

Status: aprovada em 9 de agosto de 2026.

- função-alvo: operador de execução discricionária intradiária em conta própria, em formação;
- jurisdição de referência: Brasil;
- mercados estudados: Forex, criptomoedas, commodities, índices e ações;
- períodos prioritários: M1 e M5;
- escopo: educação, simulação, gestão de risco, registro e avaliação de processo;
- fora do escopo: consultoria, análise profissional, gestão de terceiros, assessoria, intermediação, conexão com corretora e execução automática.

A justificativa, as referências oficiais e os gatilhos de revisão estão em `docs/decisao-funcao-jurisdicao.md`.

## Ciclo 7 — Linha de base e cadeia de desenvolvimento

Status: entregue na versão 1.23.0.

- matriz de competências com níveis E0–E5;
- política pública de segurança;
- lockfile e instalação reprodutível no CI;
- Dependabot para npm e GitHub Actions;
- CodeQL para JavaScript com consultas ampliadas;
- README e roadmap alinhados ao estado atual.

Gate: os workflows precisam concluir sem falhas e toda lacuna deve permanecer visível.

## Ciclo 8 — Fundamentos profissionais

Status: em execução. A versão 1.29.0 foi integrada à `main` pela PR #48 para a entrega de valuation. Mudanças posteriores exigiram nova sincronização de versão; esta auditoria prepara 1.30.0, sem considerar isso uma tag, release ou prova de produção.

- entrega 1 concluída: ética, conflitos de interesse e limites regulatórios da função-alvo no Brasil, com 12 variantes, fontes oficiais e avaliação E3;
- entrega 2 concluída: estatística, probabilidade e leitura crítica de amostras, com prática guiada, 12 variantes, fontes metodológicas e avaliação E3 para Quant/Dados;
- entrega 3 concluída: economia e macroeconomia aplicada, com snapshot guiado, 12 variantes, fontes primárias e avaliação E3 centrada em mecanismo, surpresa e incerteza;
- entrega 4 concluída: demonstrações financeiras, com snapshot guiado, 12 variantes, fontes CVM/CPC/IFRS e avaliação E3 centrada em reconciliação entre DRE, balanço, fluxo de caixa e notas;
- entrega 5 implementada, mesclada e validada pós-merge na `main` via PR #48: valuation, com DCF simplificado, valor terminal, reconciliação enterprise value → equity value, múltiplos, diluição, sensibilidade e avaliação E3 contra falsa precisão; release/tag e funcionamento em produção permanecem etapas separadas e não confirmadas;
- renda fixa, derivativos, alternativos e construção/atribuição de portfólio permanecem pendentes.

Fundamentos do ciclo:

- ética e conflitos de interesse;
- estrutura regulatória brasileira e limites da função-alvo aprovada;
- estatística, probabilidade e leitura crítica de amostras;
- economia e macroeconomia;
- demonstrações financeiras;
- valuation;
- renda fixa, derivativos, alternativos e portfólio.

Gate: cada trilha alcança E3 com fonte primária, banco de variantes e rubrica publicada.

## Ciclo 9 — Fidelidade de mercado

- livro de ofertas em níveis, prioridade de fila e preenchimento parcial;
- leilões, pausas, gaps, latência e falhas operacionais;
- margem, venda a descoberto, eventos corporativos e múltiplos venues;
- calibração com conjunto autorizado e relatório de erro do modelo.

Gate: as premissas são reproduzíveis, os dados têm licença registrada e as divergências do simulador são quantificadas.

## Ciclo 10 — Avaliação válida e retenção

- banco amplo de itens com variantes cegas;
- reavaliação espaçada;
- concordância entre avaliadores;
- defesa prática ou oral de casos;
- análise de dificuldade, discriminação e vieses.

Gate: protocolo congelado antes do estudo, amostra mínima declarada e resultados negativos preservados.

## Ciclo 11 — Plataforma operacional segura

- backend hospedado com autenticação forte e autorização;
- sincronização entre dispositivos com proteção ponta a ponta quando aplicável;
- backup, restauração testada e recuperação de desastre;
- logs mínimos, métricas, alertas e resposta a incidentes;
- revisão de privacidade e retenção de dados.

Gate: threat model revisado, restauração ensaiada e objetivos de disponibilidade publicados. Este ciclo não inclui conexão com corretora por padrão.

## Ciclo 12 — Piloto e validação externa

- aplicar a função-alvo aprovada aos critérios de entrada e aos casos do piloto;
- executar piloto com 20–50 participantes;
- incluir revisores independentes e declaração de conflitos;
- comparar retenção, processo e transferência para novos casos;
- publicar método, limitações e resultados agregados.

Gate: evidência E5 em competências selecionadas. Mesmo após o gate, certificações e licenças continuam dependentes das entidades competentes.

## Decisões do mantenedor

A função-alvo e a jurisdição prioritária foram aprovadas em 9 de agosto de 2026 e registradas em `docs/decisao-funcao-jurisdicao.md`.

As escolhas restantes não devem ser automatizadas sem aprovação explícita:

- licença de software;
- política de coleta e retenção para um futuro serviço hospedado;
- uso de provedores ou dados pagos;
- qualquer integração com corretora ou execução real;
- alteração da função-alvo ou da jurisdição de referência.

## Ordem recomendada

O Ciclo 8 vem antes de ampliar indicadores. O Ciclo 9 vem antes de alegar realismo. O Ciclo 10 vem antes de alegar eficácia. O Ciclo 11 vem antes de receber dados pela internet. O Ciclo 12 vem antes de qualquer comparação pública forte com formação institucional.
