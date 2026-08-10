# Trilha E3 — Demonstrações Financeiras

## Objetivo

Treinar leitura integrada de demonstração do resultado, balanço patrimonial, fluxo de caixa e notas explicativas, com foco em reconciliação, qualidade da informação, recorrência e limites de inferência.

A trilha é educacional. Ela não atribui valor intrínseco, não recomenda compra ou venda, não substitui auditoria, parecer contábil ou análise independente e não comprova desempenho em mercado real.

## Escopo E3

A entrega trabalha:

- receita, lucro bruto, lucro operacional e lucro líquido;
- margens bruta, operacional e líquida;
- fluxo de caixa operacional e aproximação simples de fluxo de caixa livre;
- capital de giro e divergências entre lucro e caixa;
- ativo e passivo circulantes;
- dívida bruta, caixa, dívida líquida e relação simples com patrimônio;
- itens não recorrentes e efeitos não caixa;
- capitalização de gastos, impairment, estoques, recompra financiada e reapresentações;
- efeitos cambiais e necessidade de leitura das notas explicativas.

## Prática guiada

O snapshot local calcula, a partir de valores fornecidos pelo aluno:

- margem bruta = lucro bruto / receita;
- margem operacional = lucro operacional / receita;
- margem líquida = lucro líquido / receita;
- FCF aproximado = caixa operacional - capex;
- liquidez corrente = ativo circulante / passivo circulante;
- dívida líquida = dívida total - caixa;
- dívida líquida / patrimônio;
- caixa operacional / lucro líquido, quando o denominador é válido.

Razões com denominador zero retornam `N/A`. O módulo não fabrica infinito nem converte o resultado em sinal operacional.

## Banco de casos

A avaliação possui pelo menos 12 casos únicos e gera uma sessão reproduzível de 6 variantes a partir de uma semente.

Os casos cobrem:

1. receita crescente com compressão de margem;
2. lucro crescente com caixa operacional em queda;
3. caixa operacional favorecido por aumento de fornecedores;
4. aquisição financiada por dívida;
5. impairment não caixa;
6. capitalização de gastos de desenvolvimento;
7. ganho não recorrente com venda de ativo;
8. liquidez corrente concentrada em estoques;
9. recompra de ações financiada por dívida;
10. reapresentação de comparativos;
11. FCF negativo por capex de expansão;
12. efeitos de conversão cambial.

## Rubrica E3

Cada caso vale 100 pontos:

- 35 — leitura da qualidade/consistência;
- 25 — motor contábil dominante;
- 20 — próxima verificação;
- 10 — fonte primária;
- 10 — justificativa auditável.

A aprovação exige:

- 6 casos únicos concluídos;
- média mínima de 80;
- zero violação dura.

Violações duras:

- inverter uma leitura central de fortalecimento/deterioração limita a nota a 49;
- transformar caso que depende de notas ou reconciliação em conclusão determinística limita a nota a 69.

O estado salvo no navegador não confia em `score` ou `passed` persistidos: notas e aprovação são recalculadas a partir das respostas normalizadas.

## Fontes institucionais

- Comissão de Valores Mobiliários — informações periódicas e eventuais de companhias;
- Comitê de Pronunciamentos Contábeis — pronunciamentos emitidos;
- CPC 03 — Demonstração dos Fluxos de Caixa;
- CPC 26 — Apresentação das Demonstrações Contábeis;
- IFRS Foundation — IAS 7 Statement of Cash Flows;
- IFRS Foundation — IFRS 18 Presentation and Disclosure in Financial Statements.

A IFRS 18 é tratada como referência de transição: sua vigência obrigatória internacional começa em períodos anuais iniciados em ou após 1º de janeiro de 2027. O módulo não a apresenta como obrigação já vigente para todos os relatórios de 2026.

## Privacidade e persistência

O histórico é salvo somente em `localStorage`, na chave `suzy-financial-statements-v1`. A Área do Aluno importa somente a evidência de aprovação recalculada pelo núcleo.

## Limites explícitos

Esta entrega não inclui:

- ingestão automática de DFP/ITR;
- parser XBRL ou integração Empresas.NET;
- auditoria independente;
- normalização setorial automática;
- valuation;
- previsão de lucro, preço ou retorno;
- recomendação de investimento;
- certificação externa E5.
