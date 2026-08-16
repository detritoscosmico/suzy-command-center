# Base de Candlesticks para Estudos

## Objetivo

Esta base organiza, para consulta educacional, os registros de padrões de candlestick fornecidos pelo mantenedor em uma captura importada em 16/08/2026.

Ela não é um feed de mercado, não consulta corretoras e não atualiza automaticamente os padrões. Qualquer rótulo temporal como `Atual`, datas de vela ou número de ocorrência descreve apenas o estado da captura recebida.

## Escopo importado

Foram incorporadas somente as duas seções de padrões da captura:

- `Padrões Emergentes`;
- `Padrões Completos`.

Inventário preservado:

- 69 ocorrências;
- 9 ocorrências marcadas como emergentes na captura;
- 60 ocorrências classificadas como completas;
- 35 nomes de padrões distintos;
- 13 ativos distintos;
- 7 rótulos de período distintos.

Os registros preservam, quando presentes:

- ativo;
- URL de referência;
- período;
- nome do padrão;
- tipo de ocorrência;
- indicação;
- confiabilidade;
- referência temporal da captura;
- existência ou não de uma descrição extensa na fonte;
- linha correspondente do material importado.

## Decisões de normalização

A importação evita transformar ambiguidades do material em fatos novos.

Por isso:

- nomes, grafia e traduções foram mantidos sempre que possível;
- os rótulos `15` e `30` permanecem sem unidade adicionada automaticamente;
- referências temporais concatenadas no material original foram preservadas como texto de referência;
- classificações de confiabilidade são tratadas como informação da fonte, não como validação científica do projeto;
- descrições extensas não foram republicadas na aplicação; a interface indica quando uma descrição existia e mantém o link para a referência original.

## Exclusão das cotações finais

A captura também continha uma seção final com índices, preços e cotações recentes. Esses valores não foram adicionados à biblioteca porque são snapshots temporais e poderiam ser confundidos com dados atuais.

A biblioteca de estudos contém somente metadados dos padrões de candlestick.

## Uso na Área do Aluno

A base fica disponível em `candlesticks.html` e é acessada pela seção **Biblioteca de Estudos** de `alunos.html`.

Filtros disponíveis:

- busca textual;
- emergente/completo;
- ativo;
- período;
- indicação;
- confiabilidade.

Consultar a biblioteca não altera progresso, presença, gates ou conquistas. Ela é material de referência e não uma evidência avaliativa.

## Limites educacionais

Esta base:

- não produz sinal de compra ou venda;
- não estima probabilidade futura de acerto;
- não valida uma estratégia;
- não substitui contexto, risco, liquidez ou regime de mercado;
- não atualiza as ocorrências após a data da captura;
- não transforma a classificação da fonte em recomendação do Suzy Command Center.
