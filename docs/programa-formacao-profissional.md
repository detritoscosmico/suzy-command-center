# Programa Profissional Suzy

O arquivo `programa.html` transforma os módulos educacionais existentes em uma jornada única de progressão por competências. A proposta não é imitar uma instituição específica nem prometer formação regulatória. O objetivo é aplicar princípios comuns a ambientes profissionais: risco primeiro, hipótese falsificável, prática deliberada, registro auditável, custos operacionais e revisão comportamental.

## Passaporte de competências

O passaporte possui cinco gates:

1. **Fundamentos e análise:** aprovação nas Academias Nível 1 e Nível 2.
2. **Prática deliberada:** pelo menos 20 operações encerradas no Replay e 10 no Simulador de Ordens e Custos.
3. **Processo auditável:** pelo menos 20 registros no Diário Profissional, 80% de aderência ao plano e qualidade média de execução igual ou superior a 4 de 5.
4. **Disciplina e autoconsciência:** cinco aulas comportamentais, uma autoavaliação educacional e sete check-ins.
5. **Playbook de mesa:** plano operacional completo com contexto, gatilho, invalidação, risco, stop diário, limite de operações e rotina de revisão.

Os gates são sequenciais para fins de progressão. É possível usar qualquer módulo a qualquer momento, mas a conclusão interna só avança quando a etapa anterior também foi comprovada.

## O que não é usado como critério

Lucro, taxa de acerto e saldo não aprovam o aluno. Exigir resultado positivo em cenários artificiais premiaria sorte, estimularia maquiagem do histórico e confundiria amostra de treino com vantagem validada.

A pontuação da autoavaliação comportamental também não autoriza nem bloqueia progressão. O gate exige participação na rotina, não uma suposta classificação clínica.

## Plano operacional auditável

O plano exige:

- mercado e universo de ativos;
- setup descrito em regras;
- contexto obrigatório;
- gatilho observável;
- invalidação técnica;
- risco por operação entre 0,10% e 2%;
- stop diário entre 0,50R e 5R;
- limite entre uma e dez operações por sessão;
- rotina de revisão;
- reconhecimento explícito da incerteza.

Esses intervalos são guardrails educacionais conservadores. Eles não constituem recomendação personalizada e não tornam uma operação adequada para uma pessoa específica.

## Privacidade

O programa lê somente dados já salvos no mesmo navegador:

- contagem de aulas e status das avaliações;
- quantidade de operações encerradas em replay e simulador;
- total, aderência e qualidade média do diário;
- contagem de aulas, avaliações e check-ins comportamentais;
- playbook preenchido pelo usuário.

Respostas individuais, textos do diário, operações completas e conteúdo das avaliações não são copiados para o passaporte. O relatório JSON exportado contém apenas o resumo das evidências, os critérios dos gates e o playbook.

## Limites

- a conclusão é um registro educacional interno, não diploma ou credenciamento;
- a jornada não habilita gestão de recursos de terceiros;
- nenhuma etapa substitui supervisão, formação regulatória ou avaliação financeira independente;
- a plataforma não fornece feed real, recomendação, promessa de lucro ou execução em corretora;
- dados em `localStorage` pertencem ao navegador e podem ser apagados pelo usuário ou pela limpeza de dados do site.

## Testes

O arquivo `test/professional.test.js` verifica:

- bloqueio sequencial dos gates;
- critérios mínimos de cada etapa;
- independência entre resultado financeiro e progressão;
- validação e normalização do playbook;
- conclusão somente com todas as evidências;
- independência entre faixa psicológica e participação comportamental.

O Playwright inclui `programa.html` na auditoria automatizada de acessibilidade WCAG.

A evolução planejada de risco, microestrutura, capstone, governança e dados autorizados está em `docs/roadmap-formacao-institucional.md`.
