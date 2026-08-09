# Trilha de Ética e Limites Regulatórios — Brasil

## Objetivo

Esta é a primeira entrega do Ciclo 8. Ela desenvolve a capacidade de reconhecer conflitos de interesse e separar três decisões:

1. atividade dentro do escopo educacional e de conta própria aprovado;
2. atividade fora do escopo do Sistema Suzy Titânio™;
3. situação incerta que deve ser interrompida até verificação competente.

A trilha não fornece parecer jurídico, registro profissional, licença ou autorização para prestar serviços no mercado de capitais.

## Função-alvo usada na avaliação

- operador de execução discricionária intradiária em conta própria, em formação;
- jurisdição de referência: Brasil;
- escopo: educação, simulação, gestão de risco, registro e avaliação de processo;
- fora do escopo: consultoria, análise profissional, administração de carteiras de terceiros, assessoria, intermediação, conexão com corretora e execução automática.

A decisão completa e os gatilhos de revisão estão em `docs/decisao-funcao-jurisdicao.md`.

## Fontes primárias

- [Resolução CVM 19 — consultoria de valores mobiliários](https://conteudo.cvm.gov.br/legislacao/resolucoes/resol019.html);
- [Resolução CVM 20 — analista de valores mobiliários](https://conteudo.cvm.gov.br/legislacao/resolucoes/resol020.html);
- [Resolução CVM 21 — administração profissional de carteiras](https://conteudo.cvm.gov.br/legislacao/resolucoes/resol021.html);
- [Resolução CVM 178 — assessor de investimento](https://conteudo.cvm.gov.br/legislacao/resolucoes/resol178.html).

Os links apontam para as páginas oficiais que disponibilizam a versão consolidada e registram alterações. A data ou a existência desta trilha não congela a legislação: mudanças normativas exigem revisão do banco de casos.

## Banco de variantes

O núcleo contém 12 cenários. Cada sessão seleciona seis casos únicos por embaralhamento determinístico. A mesma semente reproduz a mesma ordem, permitindo revisão e comparação sem depender de seleção manual favorável.

Os casos cobrem:

- estudo, replay e registro da própria conta;
- orientação personalizada remunerada;
- relatório público recorrente com recomendação;
- gestão ou acesso à conta de terceiros;
- recepção e transmissão de ordens;
- conflito por remuneração de emissor;
- ativo ou enquadramento incerto;
- promessa de lucro;
- conteúdo geral de gestão de risco.

## Rubrica E3

| Critério | Pontos |
| --- | ---: |
| Classificação correta do escopo | 50 |
| Identificação do conflito | 15 |
| Fonte primária mais diretamente aplicável | 15 |
| Justificativa documentada com pelo menos 40 caracteres | 20 |

Gate da sessão:

- seis casos únicos concluídos;
- média mínima de 80 pontos;
- nenhuma violação dura.

Autorizar uma atividade claramente fora do escopo limita a nota do caso a 49. Avançar quando o enquadramento deveria ser verificado limita a nota a 69. Resultado financeiro, direção de mercado e taxa de acerto não fazem parte da rubrica.

## Persistência e privacidade

Respostas e resumos ficam em `localStorage` sob a chave `suzy-ethics-regulation-v1`, limitados às 60 tentativas mais recentes. O estado de aprovação é recalculado a partir das respostas; campos `score` ou `passed` manipulados no armazenamento não são aceitos como evidência.

Nenhuma resposta é enviada para servidor, corretora, CVM ou terceiro.

## Nível de evidência

Para a função-alvo de execução, esta entrega sustenta E3 em:

- ética e conduta profissional;
- regulação e estrutura institucional.

O nível vale apenas para a avaliação interna publicada. Não eleva automaticamente as trilhas de analista, risco, quant/dados ou portfólio e não representa validação externa E5.
