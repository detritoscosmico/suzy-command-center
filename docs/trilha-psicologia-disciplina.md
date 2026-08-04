# Trilha de Psicologia, Disciplina e Avaliação Comportamental

O arquivo `psicologia.html` adiciona uma trilha educacional para observar padrões de comportamento relacionados ao processo de decisão. O módulo não é diagnóstico psicológico, não substitui atendimento profissional e não autoriza operações reais.

## Objetivos

- reduzir decisões impulsivas;
- reconhecer ativação emocional antes que ela altere o processo;
- identificar vontade de recuperar perdas;
- fortalecer aderência ao plano;
- treinar paciência seletiva;
- aceitar previamente limites de risco e encerramento;
- criar evidência diária por meio de check-ins.

## Trilha de cinco aulas

1. **Identidade de processo:** separa qualidade da execução de resultado isolado.
2. **Ativação emocional:** trata pressa, euforia, tensão e irritação como sinais de risco decisório.
3. **Reação a perdas:** transforma a vontade de recuperar em gatilho de pausa e revisão.
4. **Pré-compromisso:** define cenários permitidos, limites e condição de encerramento antes da sessão.
5. **Revisão deliberada:** avalia regras, decisões evitadas, contexto e emoção.

O progresso é salvo no `localStorage` do navegador.

## Check-in diário de prontidão

O protocolo utiliza seis componentes:

- qualidade do sono;
- ativação emocional;
- vontade de recuperar perdas;
- clareza do plano;
- aceitação do limite de encerramento;
- quebra relevante de regra na sessão anterior.

Cada componente é convertido para uma escala de risco de 1 a 5. A média é normalizada de 0 a 100.

### Faixas de prontidão

- **0 a 30:** estudo e simulação liberados;
- **acima de 30 até 55:** somente simulação reduzida;
- **acima de 55 até 75:** pausa técnica e revisão;
- **acima de 75:** encerrar a sessão de treinamento.

Essas faixas são regras educacionais conservadoras. Elas não medem condição clínica nem garantem qualidade futura de decisão.

Um novo check-in no mesmo dia substitui o anterior. O histórico mantém até 90 dias e calcula a sequência de dias consecutivos concluídos.

## Mapa de risco comportamental

A avaliação possui 18 afirmações em escala de frequência de 1 a 5. As respostas são agrupadas em seis dimensões:

- impulsividade;
- reatividade a perdas;
- aderência ao plano;
- regulação emocional;
- paciência seletiva;
- aceitação do risco.

Aderência ao plano, regulação emocional, paciência e aceitação do risco são fatores protetivos. Por isso, suas pontuações são invertidas antes da normalização: quanto menor a proteção relatada, maior o risco apresentado.

### Faixas do mapa

- **0 a 25:** risco comportamental baixo;
- **acima de 25 até 50:** risco comportamental moderado;
- **acima de 50 até 75:** risco comportamental alto;
- **acima de 75:** risco comportamental muito alto.

O plano de ação seleciona as três dimensões com maior pontuação. A classificação representa apenas autorrelato educacional das últimas semanas.

## Armazenamento e exportação

O estado é salvo na chave local:

```text
suzy_psychology_v1
```

São armazenados:

- aulas concluídas;
- até 24 avaliações;
- até 90 check-ins diários.

O botão **Exportar JSON** cria uma cópia local com data de exportação. Nesta etapa, os dados comportamentais não são enviados ao SQLite e não são sincronizados entre computadores.

## Privacidade e limites

- nenhum dado é enviado automaticamente para serviços externos;
- o GitHub Pages mantém tudo no navegador;
- limpar dados do navegador remove o histórico local;
- a exportação JSON deve ser guardada pelo usuário quando necessária;
- o módulo não analisa transtornos, saúde mental ou aptidão clínica;
- situações de sofrimento persistente ou perda de controle exigem avaliação humana qualificada.

## Testes

O arquivo `test/psychology.test.js` cobre:

- pontuação direta e reversa;
- faixas de risco;
- cálculo do mapa e plano prioritário;
- obrigatoriedade das respostas;
- quatro estados de prontidão;
- substituição do check-in diário;
- cálculo de sequência;
- normalização segura do estado salvo.

O Playwright valida carregamento, fluxo de check-in, compatibilidade de navegador e acessibilidade automatizada no escopo configurado.