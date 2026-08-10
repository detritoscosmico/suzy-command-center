# Trilha E3 — Economia e Macroeconomia

## Objetivo

Treinar leitura macroeconômica auditável para a função-alvo aprovada do Suzy Command Center: operador de execução discricionária intradiária em conta própria, em formação. A trilha ensina mecanismos e limites; não fornece recomendação, previsão de preço, parecer econômico profissional ou autorização para operar capital real.

## Escopo

A entrega cobre:

- inflação, composição e expectativas;
- política monetária e defasagens de transmissão;
- taxa nominal e taxa real ex ante por aproximação simples;
- atividade, PIB e mercado de trabalho;
- política fiscal, prêmio de prazo e condições financeiras;
- câmbio e choques externos;
- choques de oferta e efeitos de segunda ordem;
- curva de juros, precificação e surpresa versus consenso;
- revisões estatísticas e necessidade de confirmação cruzada.

## Evidência E3 interna

A avaliação usa um banco de 12 casos. Cada sessão seleciona 6 variantes de forma reproduzível por semente. Cada caso vale 100 pontos:

- leitura macro: 35;
- motor dominante: 25;
- próxima verificação: 20;
- fonte primária: 10;
- justificativa auditável: 10.

A aprovação exige média mínima de 80, seis casos únicos e zero violação dura. Inverter o sinal macro central limita a nota do caso a 49. Transformar um cenário explicitamente condicional em chamada determinística limita a nota a 69.

O estado salvo no navegador é normalizado e as notas são recalculadas a partir das respostas. Flags de aprovação ou pontuação fornecidas pelo navegador não são confiadas como fonte de verdade.

## Prática guiada

O snapshot macro calcula:

- taxa real aproximada = taxa nominal − inflação esperada;
- surpresa de inflação = realizado − consenso;
- surpresa de crescimento = realizado − consenso.

A aproximação não substitui modelagem de taxa real, decomposição de curva, análise de prêmio de prazo ou um modelo macroeconômico completo. O resultado não é um sinal operacional.

## Fontes primárias

A interface referencia páginas institucionais do Banco Central do Brasil, IBGE, Tesouro Transparente e Federal Reserve. A presença de links não representa endosso, certificação ou afiliação.

## Privacidade

Histórico, semente e aprovação permanecem em `localStorage` sob a chave `suzy-economics-macro-v1`. Nenhuma resposta é enviada pela versão pública.

## Limites

- não há feed em tempo real;
- não há previsão de decisão de banco central;
- não há previsão de câmbio, ações, índices, commodities ou cripto;
- não há modelo econométrico calibrado;
- não há validação externa E5;
- a aprovação é evidência educacional interna E3 e não certificação profissional.
