# Matriz de Competências Institucionais

## Finalidade

Esta matriz organiza o que o Suzy Command Center ensina, pratica e consegue comprovar. Ela não representa licença profissional, certificação, credenciamento ou equivalência com uma bolsa, corretora, banco ou programa universitário.

Os referenciais externos servem para identificar amplitude e rigor:

- [FINRA — Qualification Exams](https://www.finra.org/registration-exams-ce/qualification-exams);
- [CFA Institute — CFA Program Curriculum](https://www.cfainstitute.org/programs/cfa-program/curriculum);
- [SEC — U.S. Equity Market Structure](https://www.sec.gov/newsroom/speeches-statements/us-equity-market-structure);
- [NIST — Secure Software Development Framework](https://csrc.nist.gov/pubs/sp/800/218/final).

Somente as organizações responsáveis podem definir seus currículos, requisitos e credenciais. A Suzy usa esses materiais como referências públicas de escopo, não como selo de aprovação.

## Escala de evidência

| Nível | Significado | Evidência mínima |
| --- | --- | --- |
| E0 | Não coberto | Lacuna declarada e incluída no roadmap |
| E1 | Conteúdo | Objetivo, conceitos, limites e fonte documentados |
| E2 | Prática guiada | Exercício reproduzível com feedback |
| E3 | Avaliação | Rubrica e critério mensurável, independentes de lucro |
| E4 | Retenção | Nova variante após intervalo, com comparação longitudinal |
| E5 | Validação externa | Avaliação independente, amostra definida e resultados publicáveis |

Uma interface pronta não eleva sozinha a competência acima de E1.

## Matriz atual por função

| Competência | Analista | Execução | Risco | Quant/Dados | Portfólio | Evidência atual |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Estrutura, candles e confluência | E3 | E2 | E1 | E1 | E1 | Academias, replay e avaliações |
| Plano, disciplina e revisão | E3 | E3 | E2 | E1 | E2 | Programa, psicologia, diário e governança |
| Dimensionamento e limites | E2 | E3 | E3 | E2 | E2 | Laboratório de risco |
| Custos e qualidade de execução | E1 | E3 | E2 | E2 | E1 | Simulador e microestrutura artificial |
| Decisão sob incerteza | E3 | E3 | E3 | E1 | E2 | Capstone com desfecho oculto |
| Proveniência e integridade de dados | E2 | E1 | E1 | E3 | E1 | Manifesto, validação OHLC e SHA-256 |
| Ética e conduta profissional | E1 | E3 | E1 | E1 | E1 | Trilha Brasil com fontes oficiais, 12 variantes e rubrica publicada |
| Regulação e estrutura institucional | E0 | E3 | E0 | E0 | E0 | Limites da função-alvo avaliados em `etica.html`; demais funções permanecem abertas |
| Métodos quantitativos e estatística | E2 | E2 | E2 | E3 | E2 | Trilha com resumo amostral, 12 variantes e rubrica em `estatistica.html` |
| Economia e análise macro | E3 | E2 | E2 | E1 | E2 | Trilha E3 com snapshot macro, 12 variantes, fontes primárias e rubrica em `economia.html` |
| Demonstrações financeiras | E3 | E1 | E2 | E2 | E2 | Trilha E3 com DRE, balanço, DFC, reconciliação, 12 variantes e rubrica em `financials.html` |
| Valuation | E3 | E1 | E2 | E2 | E3 | Trilha E3 com DCF simplificado, EV→equity, múltiplos, sensibilidade e 12 variantes em `valuation.html` |
| Renda fixa | E3 | E1 | E2 | E2 | E2 | Trilha E3 com preço × yield, curva, duration, convexidade, crédito, inflação, marcação a mercado, 13 variantes e rubrica em `renda-fixa.html` |
| Derivativos | E0 | E0 | E1 | E0 | E0 | Trilha E3 integrada na `main` via PR #62, com 18 variantes, rubrica publicada e gates pós-merge verdes; os níveis funcionais permanecem conservadores até existir decisão explícita de mapeamento por função |
| Investimentos alternativos | E0 | E0 | E1 | E0 | E0 | Não implementados como trilha |
| Construção e atribuição de portfólio | E0 | E0 | E1 | E0 | E0 | Não implementado |
| Livro de ofertas e roteamento multi-venue | E0 | E1 | E1 | E1 | E0 | Simulação agregada, sem fila ou venues reais |
| Segurança e privacidade da plataforma | E1 | E1 | E1 | E2 | E1 | Backend local, testes, política e automação de segurança |

## Leitura correta

- E3 comprova desempenho dentro das regras da própria plataforma, não competência em mercado real.
- Dados artificiais permitem repetição, mas não validam fidelidade empírica.
- Retorno, taxa de acerto ou resultado de um cenário não substituem aderência ao processo.
- Nenhuma nota autoriza operação financeira, recomendação, gestão de recursos ou representação profissional.
- A implementação de Derivativos na PR #62 concluiu Qualidade, CodeQL, revisão e merge; a promoção dos níveis por função continua dependente de critério explícito e evidência correspondente, não ocorrendo automaticamente pelo merge.

## Bloqueadores para uma alegação forte de padrão profissional

1. Concluir investimentos alternativos e construção/atribuição de portfólio do Ciclo 8; manter o mapeamento funcional de Derivativos conservador até decisão explícita baseada em evidência.
2. Ampliar ética e regulação para as demais funções somente quando seus escopos forem aprovados.
3. Calibrar simuladores com dados licenciados e documentar erro de modelo.
4. Medir retenção, generalização e consistência entre avaliadores.
5. Conduzir piloto externo com participantes e revisores independentes.
6. Hospedar um backend seguro com backup, recuperação, observabilidade e resposta a incidentes.

## Regra de atualização

Toda mudança de nível exige um link para conteúdo, exercício, teste ou relatório. A matriz deve ser revista a cada ciclo e não pode ser elevada com base apenas em percepção ou marketing.
