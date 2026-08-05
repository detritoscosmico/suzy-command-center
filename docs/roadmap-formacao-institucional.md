# Roadmap de Formação Institucional da Suzy

Este roadmap orienta a evolução do Suzy Command Center de uma coleção de laboratórios educacionais para um sistema integrado de formação por competências. A referência é a qualidade de processo encontrada em ambientes profissionais — não a reprodução ou alegação de equivalência com uma bolsa, banco, corretora, universidade ou certificação específica.

## Princípios de decisão

Uma funcionalidade só entra no roadmap quando melhora pelo menos um destes pontos:

- qualidade e rastreabilidade da decisão;
- compreensão e limitação de risco;
- fidelidade da simulação;
- capacidade de revisar erros;
- validade da avaliação educacional;
- segurança, privacidade ou acessibilidade.

Indicadores, padrões ou ativos adicionais sem objetivo pedagógico claro não elevam o padrão da formação.

## Ciclo 1 — Passaporte de competências

Status: implementado na primeira versão do `programa.html`.

- cinco gates sequenciais;
- evidências derivadas dos módulos existentes;
- progressão independente de lucro e taxa de acerto;
- playbook com limites conservadores;
- relatório JSON resumido;
- testes unitários, integração e acessibilidade.

## Ciclo 2 — Laboratório de risco e dimensionamento

Objetivo: ensinar como a mesma hipótese muda de perfil conforme tamanho, correlação e sequência de perdas.

- risco fixo e percentual;
- cálculo de posição por distância de stop;
- exposição simultânea e correlação por cenário;
- limites por operação, sessão e semana;
- testes de estresse determinísticos;
- risco de ruína apresentado com premissas explícitas;
- avaliação que penaliza excesso de exposição, mesmo quando o cenário termina positivo.

## Ciclo 3 — Microestrutura e qualidade de execução

Objetivo: separar análise correta de execução ruim.

- spread variável;
- slippage dependente de volatilidade artificial;
- gap e baixa liquidez;
- ordens a mercado, limite e stop;
- preenchimento parcial simulado;
- comparação entre preço pretendido, preço executado e custo total;
- relatório de implementação, sem feed ou promessa de realismo absoluto.

## Ciclo 4 — Capstone baseado em casos

Objetivo: avaliar decisão sob incerteza, não memorização.

- cenários com informação incompleta;
- eventos macroeconômicos e bloqueadores;
- justificativa escrita antes do desfecho;
- escolha válida de não operar;
- rubrica pública e reproduzível;
- penalidade por quebra de processo;
- múltiplas variantes para reduzir memorização.

## Ciclo 5 — Governança e revisão

Objetivo: transformar o playbook em documento vivo e auditável.

- versionamento do plano;
- motivo obrigatório para mudanças;
- comparação entre períodos;
- relatórios por aderência, erro e contexto;
- exportação portátil;
- revisão opcional por mentor, sem acesso automático a respostas comportamentais brutas;
- separação explícita entre correlação observada e sinal operacional.

## Ciclo 6 — Dados autorizados e proveniência

Objetivo: permitir estudos mais realistas sem violar licença, privacidade ou segurança.

- importação local de fontes autorizadas;
- metadados de origem, período e fuso;
- validação de integridade;
- identificação permanente de dados artificiais;
- adaptadores opcionais, nunca chaves expostas no front-end;
- nenhuma conexão com corretora na versão educacional pública.

## Critério de conclusão

Nenhum ciclo é considerado concluído apenas porque a interface existe. Cada entrega precisa de:

- objetivo pedagógico documentado;
- critérios mensuráveis;
- limites e hipóteses declarados;
- testes automatizados relevantes;
- acessibilidade sem violações críticas ou sérias no escopo configurado;
- revisão de segurança e privacidade compatível com os dados usados;
- PR aprovada e checks verdes.
