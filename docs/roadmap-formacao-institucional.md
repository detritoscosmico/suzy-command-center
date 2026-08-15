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

Status: implementado em `risco.html` com cálculos puros testáveis, cenários reproduzíveis e exportação local das premissas.

- risco fixo e percentual;
- cálculo de posição por distância de stop;
- exposição simultânea e agrupamento conservador de correlação por cenário;
- limites por operação, sessão e semana;
- testes de estresse determinísticos;
- risco de ruína apresentado com premissas explícitas;
- avaliação que penaliza excesso de exposição, mesmo quando o cenário termina positivo.

## Ciclo 3 — Microestrutura e qualidade de execução

Objetivo: separar análise correta de execução ruim.

Status: implementado em `microestrutura.html` com cenário artificial reproduzível, decomposição do custo e rubrica independente de P/L.

- spread variável;
- slippage dependente de volatilidade, liquidez e participação artificial;
- gap e baixa liquidez;
- ordens a mercado, limite e stop;
- preenchimento parcial por quantidade disponível;
- comparação entre preço pretendido, preço executado e custo total;
- relatório de implementação, sem feed ou promessa de realismo absoluto.

## Ciclo 4 — Capstone baseado em casos

Objetivo: avaliar decisão sob incerteza, não memorização.

Status: implementado em `capstone.html` com quatro casos reproduzíveis por sessão, desfecho artificial oculto até a decisão e avaliação independente do resultado.

- cenários com informação incompleta;
- eventos macroeconômicos e bloqueadores;
- justificativa escrita antes do desfecho;
- escolha válida de não operar;
- rubrica pública e reproduzível;
- penalidade por quebra de processo;
- múltiplas variantes para reduzir memorização.

## Ciclo 5 — Governança e revisão

Objetivo: transformar o playbook em documento vivo e auditável.

Status: implementado em `governanca.html` com snapshots imutáveis do playbook, fingerprint reproduzível, motivo obrigatório para mudanças e revisão periódica de processo.

- versionamento do plano;
- motivo obrigatório para mudanças;
- comparação entre períodos;
- relatórios por aderência, erro e contexto;
- exportação portátil;
- revisão opcional por mentor, sem acesso automático a respostas comportamentais brutas;
- separação explícita entre correlação observada e sinal operacional.

## Ciclo 6 — Dados autorizados e proveniência

Objetivo: permitir estudos mais realistas sem violar licença, privacidade ou segurança.

Status: implementado em `dados.html` com importação OHLC estritamente local, manifesto de origem, autorização, fuso, período detectado, validação estrutural e SHA-256.

- importação local de fontes autorizadas;
- metadados de origem, período e fuso;
- validação de integridade;
- identificação permanente de dados artificiais;
- adaptadores opcionais, nunca chaves expostas no front-end;
- nenhuma conexão com corretora na versão educacional pública.

## Ciclo 7 — Prontidão institucional

Objetivo: tornar a evolução do projeto verificável por competências, evidências e controles de engenharia, sem alegar certificação ou equivalência institucional.

Status: primeira entrega implementada na versão 1.23.0.

- matriz de competências por função e por nível de evidência;
- lacunas explícitas entre conteúdo, simulação, avaliação e operação real;
- critérios de avanço para os próximos ciclos;
- política pública de reporte de vulnerabilidades;
- instalação reprodutível com lockfile e `npm ci`;
- atualização assistida de dependências com Dependabot;
- análise estática de JavaScript com CodeQL;
- decisão de licença registrada como pendência do mantenedor, sem presumir autorização.

Os critérios, os bloqueadores e a ordem de evolução estão documentados em `docs/matriz-competencias-institucionais.md` e `docs/roadmap-prontidao-institucional.md`.

## Ciclo 8 — Fundamentos profissionais

Objetivo: construir fundamentos que permitam avaliar conduta, evidência e instrumentos sem confundir conteúdo interno com habilitação ou validação de mercado.

Status: em execução. Cinco entregas alcançaram E3 interno em competências selecionadas:

- ética e limites regulatórios no Brasil para a função-alvo de execução;
- estatística, probabilidade e leitura crítica de amostras para Quant/Dados;
- economia e macroeconomia aplicada, com leitura de inflação, juros, atividade, trabalho, fiscal, câmbio, expectativas e curva;
- demonstrações financeiras, com reconciliação de DRE, balanço, fluxo de caixa, capital de giro, alavancagem, recorrência e notas explicativas;
- valuation, com DCF simplificado, valor terminal, reconciliação entre enterprise value e equity value, múltiplos, diluição e sensibilidade.

A quinta entrega inclui snapshot guiado, 12 variantes, sessões reproduzíveis, fontes institucionais e uma rubrica que penaliza falsa precisão, confusão entre unidades de valor e conclusões determinísticas quando a evidência é insuficiente.

Renda fixa, derivativos, alternativos e construção/atribuição de portfólio permanecem pendentes.

## Critério de conclusão

Nenhum ciclo é considerado concluído apenas porque a interface existe. Cada entrega precisa de:

- objetivo pedagógico documentado;
- critérios mensuráveis;
- limites e hipóteses declarados;
- testes automatizados relevantes;
- acessibilidade sem violações críticas ou sérias no escopo configurado;
- revisão de segurança e privacidade compatível com os dados usados;
- PR aprovada e checks verdes.
