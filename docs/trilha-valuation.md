# Trilha E3 — Valuation

## Objetivo

Treinar valuation como processo de premissas, reconciliação e sensibilidade, sem tratar um modelo como preço futuro, recomendação de investimento ou garantia de retorno.

A trilha é educacional e permanece no escopo aprovado do Suzy Command Center: formação, simulação, gestão de risco, registro e avaliação de processo. Ela não oferece consultoria, análise profissional, gestão de terceiros, intermediação, conexão com corretora ou execução automática.

## Escopo E3

A entrega trabalha:

- valor presente de fluxos de caixa;
- FCFF simplificado (fluxo de caixa livre para a firma) como base do DCF guiado que estima enterprise value;
- taxa de desconto como premissa de risco e tempo;
- valor terminal por crescimento de Gordon em formato simplificado;
- enterprise value e reconciliação até equity value;
- dívida líquida e ações diluídas;
- valor por ação como resultado matemático do cenário, não previsão;
- sensibilidade ao crescimento terminal e à taxa de desconto;
- qualidade de premissas de margem;
- normalização de lucros cíclicos e itens não recorrentes;
- múltiplos relativos e comparabilidade econômica;
- risco de falsa precisão quando o valor terminal domina o DCF.

## Prática guiada

O snapshot local recebe:

- FCFF simplificado dos anos 1, 2 e 3;
- taxa de desconto;
- crescimento terminal;
- dívida líquida;
- número de ações diluídas.

A partir dessas premissas, calcula:

- valor presente dos três FCFFs simplificados;
- valor terminal simplificado;
- valor presente do terminal;
- enterprise value;
- equity value após dívida líquida;
- valor por ação;
- peso percentual do valor terminal no enterprise value.

O uso de FCFF é explícito porque o modelo estima primeiro o valor da firma. Um fluxo destinado diretamente ao acionista exigiria outra reconciliação e não deve ser confundido com este exercício.

O motor rejeita crescimento terminal maior ou igual à taxa de desconto. Essa validação evita produzir um valor terminal matematicamente inválido no modelo de Gordon.

## Banco de casos

A avaliação possui 12 casos únicos e gera uma sessão reproduzível de 6 variantes a partir de uma semente.

Os casos cobrem:

1. taxa de desconto excessivamente baixa;
2. crescimento terminal agressivo;
3. margem projetada sem evidência operacional suficiente;
4. confusão entre enterprise value e equity value;
5. múltiplo aparentemente barato no pico de um ciclo;
6. conjunto de comparáveis economicamente incompatível;
7. EBITDA inflado por item não recorrente;
8. FCF negativo durante expansão;
9. valor terminal dominando o DCF;
10. múltiplo de enterprise value convertido incorretamente em preço por ação;
11. diluição ignorada;
12. comunicação correta por faixa de cenários.

## Rubrica E3

Cada caso vale 100 pontos:

- 30 — leitura da faixa de valor;
- 25 — premissa dominante;
- 20 — próxima verificação;
- 15 — fonte primária;
- 10 — justificativa auditável.

A aprovação exige:

- 6 casos únicos concluídos;
- média mínima de 80;
- zero violação dura.

Violações duras:

- confundir enterprise value com equity value sem reconciliação limita a nota a 49;
- aceitar premissa materialmente agressiva como faixa razoável sem ajuste ou sensibilidade limita a 49;
- transformar evidência insuficiente em conclusão determinística limita a 69.

O estado salvo no navegador não confia em `score` ou `passed` persistidos: notas e aprovação são recalculadas a partir das respostas normalizadas.

## Fontes institucionais

- Comissão de Valores Mobiliários — informações periódicas e eventuais de companhias;
- Comitê de Pronunciamentos Contábeis — pronunciamentos emitidos;
- IFRS Foundation — lista de normas emitidas;
- Banco Central do Brasil — Taxa Selic, como referência macroeconômica para discussão de taxa livre de risco no contexto brasileiro.

Essas fontes fornecem dados, normas e contexto. Elas não validam automaticamente uma taxa de desconto, múltiplo, valor intrínseco ou conclusão de investimento produzida pela Suzy.

## Privacidade e persistência

O histórico é salvo somente em `localStorage`, na chave `suzy-valuation-v1`. A Área do Aluno importa somente a evidência de aprovação recalculada pelo núcleo.

## Limites explícitos

Esta entrega não inclui:

- cotação em tempo real;
- recomendação de compra ou venda;
- preço-alvo automático;
- beta estimado automaticamente;
- WACC completo com dados de mercado;
- ingestão automática de DFP/ITR;
- parser XBRL;
- scraping de balanços;
- previsão de lucro, preço ou retorno;
- backtest de valuation;
- integração com corretora;
- certificação externa E5.

O DCF de três anos é uma prática guiada propositalmente simplificada. Ele usa FCFF simplificado para ensinar a relação entre fluxo para a firma, taxa, terminal, dívida e diluição; não pretende substituir um modelo completo de valuation profissional.
