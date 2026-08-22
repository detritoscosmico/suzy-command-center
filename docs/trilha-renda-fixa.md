# Trilha E3 — Renda Fixa

Data de implementação: 22 de agosto de 2026.

## Objetivo

Adicionar ao Ciclo 8 do Programa Profissional uma trilha educacional de renda fixa que ensine mecanismos de apreçamento, sensibilidade a juros, risco de crédito, inflação, liquidez e marcação a mercado sem converter conteúdo educacional em recomendação de investimento.

A trilha é classificada como **E3 interno** somente quando a pessoa conclui uma sessão reproduzível de seis variantes com média mínima de 80/100 e nenhuma violação dura.

E3 neste projeto significa capacidade interna de aplicar conceitos em casos estruturados. Não representa registro profissional, certificação, suitability, autorização para operar capital real ou validação de desempenho financeiro.

## Escopo técnico

A implementação cobre:

- relação inversa entre preço e yield para fluxos fixos;
- curva de juros e estrutura a termo;
- diferença entre curva observada e previsão determinística;
- duration Macaulay e duration modificada;
- convexidade e limite da aproximação linear;
- risco de crédito e spread de dívida corporativa;
- liquidez no mercado secundário;
- indexação à inflação e separação entre componentes real e nominal;
- marcação a mercado e efeito do horizonte de carregamento;
- instrumentos relevantes ao contexto brasileiro: LTN, NTN-F, LFT, NTN-B e debêntures;
- diferenças de fluxo entre títulos sem cupom, com cupom, pós-fixados e indexados à inflação.

## Prática guiada

A página `renda-fixa.html` contém um laboratório matemático simplificado de título com cupom fixo.

Entradas: valor de face, taxa de cupom anual, yield anual, prazo, frequência de pagamentos, choque de yield em pontos-base e três pontos de curva (curto, intermediário e longo).

Saídas:

- preço calculado pelo valor presente dos fluxos;
- duration Macaulay;
- duration modificada;
- convexidade;
- variação percentual aproximada por duration + convexidade;
- variação percentual obtida pela reprecificação exata no yield chocado;
- classificação simples da curva;
- spread entre taxa longa e curta.

### Limites do laboratório

O modelo deliberadamente simplifica a realidade. Ele não inclui impostos, custos e spreads de execução, calendário real e convenções específicas de dias, default ou recuperação, opções embutidas, amortizações não regulares, indexadores acumulados, regras específicas de cada emissão, mudanças de curva não paralelas, risco de reinvestimento ou suitability.

A saída serve para treinar mecanismo. Não é preço justo operacional, taxa-alvo ou recomendação.

## Banco de variantes

`js/fixed-income-core.js` contém 13 casos estruturados:

1. relação preço × yield;
2. curva de juros sem previsão determinística;
3. duration e sensibilidade;
4. convexidade em choques maiores;
5. spread de crédito;
6. risco de crédito em renda fixa;
7. indexação ao IPCA;
8. confusão entre taxa real e retorno nominal;
9. venda antecipada e marcação a mercado;
10. erro de tratar renda fixa como preço fixo;
11. título pós-fixado e identificação do indexador;
12. liquidez no mercado secundário;
13. estrutura temporal de cupons e principal.

A mesma semente produz a mesma ordem de casos. Cada sessão seleciona seis variantes.

## Rubrica pública

Cada caso vale 100 pontos:

| Critério | Pontos |
| --- | ---: |
| Leitura do mecanismo ou limite de inferência | 30 |
| Fator dominante | 25 |
| Próxima verificação | 20 |
| Fonte primária/institucional | 15 |
| Justificativa auditável | 10 |

Aprovação do caso: **80/100**.

Aprovação da sessão E3: seis casos únicos concluídos, média mínima de 80 e zero violações duras.

### Violações duras

Alguns erros recebem limite adicional de nota:

- tratar dívida corporativa como sem risco de crédito;
- negar marcação a mercado antes do vencimento;
- confundir taxa real com retorno nominal garantido;
- tratar inclinação da curva como previsão certa de taxa futura;
- tratar a aproximação linear de duration como preço exato após choque grande.

As três primeiras podem limitar a nota do caso a 49. As duas últimas podem limitar a 69.

## Fontes primárias e institucionais

### Banco Central do Brasil — Taxa Selic
https://www.bcb.gov.br/controleinflacao/taxaselic

Uso: referência institucional para taxa básica e política monetária.

### Tesouro Nacional — Títulos da Dívida Interna
https://www.gov.br/tesouronacional/pt-br/divida-publica-federal/mercado-interno/titulos-da-divida-interna

Uso: características de LTN, NTN-B, NTN-F e LFT.

### Tesouro Nacional — Mercado Secundário
https://www.gov.br/tesouronacional/pt-br/divida-publica-federal/mercado-interno/mercado-secundario

Uso: formação de preços, taxas de desconto, indexadores e liquidez.

### Tesouro Direto — Regras e Regulamento
https://tesourodireto.com.br/sobre-o-tesouro/regras-e-regulamento

Uso: marcação a mercado, oscilação de preço e venda/resgate antes do vencimento.

### IBGE — IPCA
https://www.ibge.gov.br/estatisticas/economicas/precos-e-custos/9256-indice-nacional-de-precos-ao-consumidor-amplo.html

Uso: referência oficial para o índice de preços utilizado nos casos de indexação à inflação.

### Portal do Investidor / CVM — Riscos dos investimentos
https://www.gov.br/investidor/pt-br/investir/antes-de-investir/entenda-as-caracteristicas-dos-investimentos/risco-e-a-relacao-risco-x-retorno

Uso: risco de crédito, mercado e liquidez.

### Portal do Investidor / CVM — Debêntures
https://www.gov.br/investidor/pt-br/investir/tipos-de-investimentos/debentures

Uso: natureza de dívida corporativa, garantias e risco do emissor.

## Arquitetura

Arquivos novos:

- `renda-fixa.html`;
- `js/fixed-income-core.js`;
- `js/fixed-income.js`;
- `docs/trilha-renda-fixa.md`;
- `test/fixed-income.test.js`;
- `test/e2e/fixed-income.spec.js`.

Integrações desta PR:

- trilha no menu e roadmap visual de `programa.html`;
- novos JavaScript e testes no `npm run check`;
- `renda-fixa.html` na auditoria automatizada de acessibilidade;
- versão de código alinhada para `1.31.0` em `package.json` e `package-lock.json`; tag/release permanecem gates separados e não são criados nesta PR.

## Persistência e privacidade

O histórico E3 fica somente no `localStorage` do navegador usando a chave `suzy-fixed-income-v1`.

A trilha não coleta nome, e-mail, documento, conta de corretora, posição, ordens, patrimônio ou resultado financeiro real.

## Limites de interpretação

A trilha não recomenda Tesouro, debênture ou qualquer outro ativo; não produz ranking de títulos; não calcula suitability; não prevê Selic, IPCA ou curva futura; não promete proteção contra inflação; não garante retorno; não mede performance real; não substitui prospecto, escritura, regulamento, lâmina, documentação da emissão, análise de crédito ou orientação profissional aplicável.

## Critério para considerar a entrega concluída

A existência dos arquivos não basta. A Entrega 6 só deve ser classificada como concluída após:

1. código e documentação revisados;
2. testes unitários aprovados;
3. E2E aprovados nos navegadores configurados;
4. auditoria de acessibilidade sem violações críticas/sérias;
5. CodeQL concluído com sucesso;
6. PR sem threads pendentes;
7. branch sincronizada com `main`;
8. merge efetivamente concluído;
9. verificação pós-merge separada, quando aplicável.

Até o merge, o status correto é **implementado na branch / em validação**, não “entregue na main”.
