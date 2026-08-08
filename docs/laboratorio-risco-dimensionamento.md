# Laboratório de Risco e Dimensionamento

O arquivo `risco.html` implementa o segundo ciclo do Programa Profissional Suzy. O objetivo é treinar decisões de risco antes do resultado financeiro, com premissas visíveis e resultados reproduzíveis.

## Dimensionamento por stop

O aluno informa capital, orçamento de risco, entrada, stop, multiplicador por unidade e passo mínimo de quantidade. O motor calcula:

- distância absoluta e percentual do stop;
- orçamento solicitado;
- quantidade bruta e quantidade arredondada para baixo;
- risco efetivo depois do arredondamento;
- exposição nominal estimada e razão exposição/capital.

O arredondamento sempre reduz a quantidade para o passo permitido, evitando que o arredondamento sozinho faça o risco ultrapassar o orçamento.

O multiplicador padrão é `1`. Instrumentos reais podem usar lotes, pontos, moedas de cotação, valores por tick e regras de margem diferentes. O aluno deve conhecer a especificação do instrumento antes de transportar o raciocínio para outro contexto.

## Exposição simultânea e grupos

As posições do cenário guardam ativo, direção, grupo e perda máxima planejada. O laboratório soma o risco absoluto, não compensa automaticamente LONG e SHORT.

O campo de grupo representa uma hipótese conservadora declarada pelo aluno, como `Tecnologia EUA` ou `Mineração`. Ele não calcula correlação estatística nem afirma que dois ativos continuarão correlacionados. Posições no mesmo grupo têm o risco somado e comparado a um limite próprio de concentração.

Os dados dessa lista ficam apenas no `localStorage` do navegador, na chave `suzy-risk-lab-v1`.

## Stress determinístico

A sequência é escrita em múltiplos de `R`, por exemplo `-1, -1, -1, +1.5`. A cada operação o orçamento percentual é recalculado sobre o capital corrente. Quando a perda acumulada da sessão atinge o stop configurado, as operações restantes são ignoradas.

O bloqueio ocorre depois do resultado simulado. Por isso um gap de `-2R`, por exemplo, pode ultrapassar o limite antes de o sistema interromper a sequência. Essa diferença é deliberada e impede que o treino trate stop como garantia de preço.

## Política de risco

A rubrica verifica cinco limites independentes:

1. risco por operação;
2. risco aberto agregado;
3. risco no maior grupo correlacionado;
4. perda da sessão;
5. perda da semana.

Nenhuma métrica de lucro ou taxa de acerto entra nessa aprovação. Uma quebra de exposição continua sendo quebra mesmo quando o cenário termina positivo.

## Simulação de risco de ruína

O laboratório executa Monte Carlo com gerador pseudoaleatório determinístico e semente informada pelo aluno. O mesmo conjunto de premissas e a mesma semente produzem o mesmo resultado, permitindo revisão e teste.

Premissas explícitas:

- taxa de acerto fixa;
- ganho e perda médios fixos em `R`;
- risco percentual recalculado sobre o capital corrente;
- resultados tratados como independentes;
- parâmetros tratados como estacionários durante a trajetória;
- ruína definida como atingir um drawdown escolhido sobre o capital inicial.

Essas premissas são simplificações fortes. O modelo não captura adequadamente mudança de regime, correlação serial, caudas extremas, liquidez, gaps, impostos, erros operacionais ou todos os custos. A porcentagem simulada não é previsão do risco real.

## Privacidade e exportação

Não existe feed de mercado, conexão com corretora ou upload automático. O relatório JSON exportado contém os cenários e as premissas calculadas para permitir auditoria do estudo.

## Validação automatizada

`test/risk-lab.test.js` cobre o motor matemático, limites, concentração, stress e reprodutibilidade do Monte Carlo. `test/e2e/risk-lab.spec.js` cobre os fluxos principais da interface. `test/e2e/accessibility.spec.js` inclui a página na auditoria WCAG automatizada.

## Limite de uso

Este módulo é educacional. Não fornece sinal, recomendação, garantia de preservação de capital, aptidão profissional ou autorização para operar dinheiro real.
