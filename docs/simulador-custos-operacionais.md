# Simulador de ordens e custos operacionais

O arquivo `simulador.html` é um laboratório educacional para estudar execução e custos sem conexão com corretora.

## Tipos de ordem

### Mercado

A ordem é executada imediatamente:

- compra no `ask`;
- venda no `bid`;
- slippage adverso é acrescentado ao preço de execução.

### Limite

A ordem aguarda o preço definido:

- compra limite abaixo do preço médio;
- venda limite acima do preço médio;
- o simulador não executa uma ordem limite em preço pior que o limite;
- uma abertura com preço melhor pode gerar melhoria de execução.

### Stop de entrada

A ordem aguarda o rompimento:

- compra stop acima do preço médio;
- venda stop abaixo do preço médio;
- gaps e slippage adverso podem piorar o preço de execução.

## Custos modelados

- **Spread:** diferença entre bid e ask.
- **Slippage:** diferença adicional e adversa aplicada em ordens a mercado, stops e saídas por stop.
- **Comissão:** valor fixo cobrado na entrada e novamente na saída.
- **Valor por ponto:** converte a variação do preço em valor monetário demonstrativo.

## Resultado

O simulador registra:

- pontos brutos;
- resultado bruto;
- comissões totais;
- resultado líquido;
- classificação WIN, LOSS ou BREAKEVEN;
- taxa de acerto e média líquida da sessão.

O spread e o slippage aparecem no preço de entrada ou saída. A comissão aparece separadamente nos custos.

## Critérios conservadores

Quando stop e alvo são tocados no mesmo candle artificial, o simulador considera o stop como ocorrido primeiro. Isso evita assumir uma sequência intrabar favorável que não pode ser comprovada.

Uma ordem acionada em determinado candle só terá stop e alvo avaliados a partir do candle seguinte. Essa regra evita inventar a ordem dos movimentos dentro do candle que realizou a entrada.

## Limitações

- Os candles são artificiais.
- Não há livro de ofertas, latência real, liquidez parcial ou rejeição de ordens.
- Não há margem, swap, financiamento, impostos ou conversão cambial.
- Os valores não representam condições de uma corretora específica.
- O laboratório não executa ordens reais e não fornece sinais.
