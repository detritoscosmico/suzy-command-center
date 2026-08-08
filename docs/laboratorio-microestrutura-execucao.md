# Laboratório de Microestrutura e Qualidade de Execução

O arquivo `microestrutura.html` implementa o terceiro ciclo do Programa Profissional Suzy. Ele complementa o simulador de ordens existente: em vez de repetir o treino de stop, alvo e resultado líquido, isola os mecanismos que fazem o preço pretendido divergir do preço executado.

## Ambiente artificial

O aluno define:

- preço médio e tamanho do ponto;
- spread-base;
- slippage-base;
- regime de volatilidade;
- regime de liquidez;
- quantidade disponível;
- valor por ponto e comissão por ordem.

Os regimes usam multiplicadores didáticos explícitos. Eles não foram calibrados para representar uma bolsa, corretora, ativo ou período real.

## Spread e slippage variáveis

O spread efetivo é o spread-base multiplicado pelos fatores de volatilidade e liquidez. O slippage-base recebe os mesmos fatores e um adicional determinístico de participação conforme a quantidade desejada consome a quantidade disponível no cenário.

Esse mecanismo serve para demonstrar relação causal dentro do exercício. Não estima slippage futuro.

## Tipos de ordem

O motor suporta `MARKET`, `LIMIT` e `STOP`:

- MARKET usa o preço médio da decisão como benchmark e aplica meio spread mais slippage adverso;
- LIMIT exige preço compatível com a direção e nunca preenche pior que o limite definido;
- STOP precisa ser tocada pelo candle, incorpora gap adverso quando a abertura ultrapassa o gatilho e depois aplica spread e slippage.

Uma ordem não tocada permanece como `NOT_TRIGGERED`. Quantidade disponível igual a zero produz `NO_LIQUIDITY`, sem fabricar fill.

## Preenchimento parcial

Quando a quantidade pedida excede a quantidade disponível, o motor preenche apenas a parcela disponível e registra:

- quantidade pedida;
- quantidade preenchida;
- quantidade não preenchida;
- percentual de fill.

O exercício não presume que o restante seria executado depois pelo mesmo preço.

## Decomposição do desvio

Para cada execução são exibidos separadamente:

- componente de spread;
- componente de slippage;
- componente de gap;
- desvio adverso total contra o benchmark;
- custo de implementação estimado, incluindo comissão configurada.

MARKET usa o mid como benchmark. LIMIT e STOP usam o preço de disparo. O histórico permite comparar cenários sem introduzir P/L.

## Rubrica de qualidade

Antes da execução, o aluno define:

- slippage máximo em pontos;
- fill mínimo em percentual;
- gap adverso máximo em pontos.

A proteção de preço da ordem LIMIT é uma quarta regra automática. A nota é a proporção de regras respeitadas. Lucro, taxa de acerto e direção futura não fazem parte da avaliação.

## Privacidade e limites

Até 30 execuções ficam no `localStorage` do navegador, na chave `suzy-microstructure-lab-v1`. A exportação JSON inclui as condições, ordem, execução, rubrica e limitações do modelo.

Não existe feed, livro de ofertas real, corretora, ordem real ou recomendação financeira. O laboratório ensina mecanismo e processo, não fidelidade de mercado.

## Validação

`test/microstructure.test.js` cobre spread variável, slippage, fill parcial, falta de liquidez, LIMIT, STOP com gap, custo e rubrica. `test/e2e/microstructure.spec.js` valida os fluxos principais. A página também entra na auditoria WCAG automatizada.
