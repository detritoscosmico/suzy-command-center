# Trilha de Estatística, Probabilidade e Leitura Crítica de Amostras

## Objetivo

Esta é a segunda entrega do Ciclo 8. Ela desenvolve a capacidade de distinguir:

1. descrição dos dados observados;
2. evidência interna sustentada com limites explícitos;
3. evidência insuficiente para a alegação proposta;
4. método inválido para a conclusão apresentada.

A trilha não valida estratégias, não estima retorno futuro e não prescreve um número universal de operações. O tamanho de amostra depende da pergunta, precisão desejada, variabilidade, dependência e desenho da coleta.

## Conteúdo

- população, amostra e estimativa;
- taxa de acerto, magnitude média e expectativa amostral;
- intervalo de Wilson para uma proporção observada;
- incerteza e interpretação de intervalo de confiança;
- viés de seleção e descarte pós-resultado;
- múltiplos testes e seleção da melhor configuração;
- separação entre desenvolvimento e teste fora da amostra;
- vazamento de dados no pré-processamento;
- dependência e validação temporal;
- não estacionariedade e mudança de regime;
- relevância econômica, custos e uso inadequado de métricas.

## Fontes metodológicas

- [NIST — tamanho de amostra](https://www.itl.nist.gov/div898/handbook/prc/section2/prc222.htm);
- [NIST — técnicas quantitativas, população e amostra](https://www.itl.nist.gov/div898/handbook/eda/section3/eda35.htm);
- [NIST — limites de confiança para a média](https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm);
- [scikit-learn — vazamento de dados](https://scikit-learn.org/stable/common_pitfalls.html#data-leakage);
- [scikit-learn — validação e séries temporais](https://scikit-learn.org/stable/modules/cross_validation.html);
- [American Statistical Association — Ethical Guidelines for Statistical Practice](https://www.amstat.org/your-career/ethical-guidelines-for-statistical-practice);
- [Bailey et al. — The Probability of Backtest Overfitting](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2326253).

As fontes definem conceitos e riscos metodológicos. Elas não aprovam a plataforma, não validam seus casos e não substituem revisão estatística independente.

## Prática guiada

O resumo amostral recebe:

- quantidade de vitórias e perdas;
- ganho médio em `R`;
- perda média em `R`.

Ele calcula:

- total de observações;
- taxa de acerto;
- intervalo de Wilson de 95% para a proporção de vitórias;
- expectativa amostral em `R`;
- taxa de acerto de equilíbrio para as magnitudes informadas.

A fórmula da expectativa é:

```text
E[R] = P(vitória) × ganho médio − P(perda) × perda média
```

O resultado descreve a amostra informada. Ele não incorpora automaticamente dependência, mudança de regime, erros de medição, custos ausentes ou seleção de regras.

## Banco de variantes

O núcleo contém 12 cenários. Cada sessão seleciona seis casos únicos por embaralhamento determinístico. A mesma semente reproduz a mesma ordem.

Os casos cobrem:

- sequência curta tratada como validação;
- protocolo congelado e teste cronológico fora da amostra;
- seleção posterior do melhor horário;
- escolha da melhor entre cem configurações;
- normalização com informação do teste;
- embaralhamento inadequado de série temporal;
- taxa de acerto alta com expectativa negativa;
- expectativa positiva relatada com incerteza;
- sinais sobrepostos tratados como independentes;
- generalização de um único regime;
- interpretação errada de intervalo de confiança;
- efeito bruto pequeno com custos omitidos.

## Rubrica E3

| Critério | Pontos |
| --- | ---: |
| Força correta da conclusão | 35 |
| Risco estatístico principal | 25 |
| Próxima validação necessária | 20 |
| Fonte metodológica aplicável | 10 |
| Justificativa auditável com pelo menos 60 caracteres | 10 |

Gate da sessão:

- seis casos únicos concluídos;
- média mínima de 80 pontos;
- nenhuma violação dura.

Tratar um método inválido como evidência favorável limita a nota do caso a 49. Tratar uma amostra insuficiente como validação limita a nota a 69. Lucro, saldo e direção de mercado não fazem parte da rubrica.

## Persistência e privacidade

Respostas e resumos ficam em `localStorage` sob a chave `suzy-statistics-probability-v1`, limitados às 60 tentativas mais recentes. A aprovação e a melhor média são recalculadas a partir das respostas. Campos `score`, `passed` ou `bestAverage` manipulados no armazenamento não são aceitos como evidência.

Quando a poda é necessária, o núcleo preserva a melhor sessão completa e a aprovação mais recente. Nenhuma resposta é enviada para servidor, corretora ou terceiro.

## Nível de evidência

Esta entrega sustenta E3 interno em métodos quantitativos e estatística para a trilha Quant/Dados. Para Analista, Execução, Risco e Portfólio, ela oferece prática guiada E2, mas não substitui avaliações específicas de cada função.

O nível não valida estratégias, não comprova retenção E4 e não representa validação externa E5.
