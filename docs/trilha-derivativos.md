# Trilha E3 — Derivativos

## Objetivo

Construir competência educacional interna para reconhecer mecanismos, riscos e limitações de contratos futuros, opções e swaps, com foco em estrutura econômica e fontes institucionais. A trilha não gera recomendação de investimento, sinal operacional, suitability, promessa de retorno ou autorização para operar capital real.

## Escopo

- derivativos como contratos cujo valor depende de ativo, índice, taxa ou variável subjacente;
- futuros: payoff linear, ajuste diário, margem, alavancagem, basis, vencimento e rolagem;
- contexto B3: Futuro de DI, Futuro de Ibovespa e Futuro de Dólar Comercial;
- DI: relação educacional simplificada entre taxa negociada, prazo em dias úteis e PU;
- opções: call, put, titular, lançador, prêmio, strike, payoff no vencimento, valor intrínseco e valor temporal;
- volatilidade como parâmetro de dispersão/incerteza, sem inferência direcional automática;
- Greeks: delta, gamma, theta e vega como sensibilidades locais condicionadas a modelo e estado;
- exercício e expiração conforme especificação do produto;
- swaps: duas pontas, indexadores, notional, prazo, garantia e forma de liquidação;
- risco não linear e limites de modelos simplificados.

## Fontes primárias e institucionais

A aplicação aponta diretamente para fontes institucionais brasileiras:

1. B3 — Futuro de DI / especificações técnicas;
2. B3 — Futuro de Ibovespa;
3. B3 — Futuro de Dólar Comercial;
4. B3 — Opções sobre Ações;
5. B3 — Opções sobre Futuro de DI;
6. B3 — Swap;
7. Portal do Investidor/CVM — Derivativos;
8. Portal do Investidor/CVM — Mercado Futuro;
9. Portal do Investidor/CVM — Mercado de Opções;
10. Portal do Investidor/CVM — Riscos em Derivativos.

Essas fontes sustentam conceitos e especificações. A inclusão de um link não implica parceria, aprovação ou certificação da B3, CVM ou de qualquer outra instituição.

## Prática guiada

O laboratório oferece quatro blocos simplificados:

### Futuros

Calcula a variação financeira linear a partir de preço de entrada, preço de saída/ajuste, multiplicador, número de contratos e direção. O multiplicador é parâmetro explícito e não é inferido como especificação universal.

### Basis e Futuro de DI

- basis = preço futuro − preço spot;
- basis percentual = basis / spot;
- PU de DI simplificado = 100.000 / (1 + taxa anual)^(dias úteis/252).

A fórmula de PU é usada para ensinar a relação inversa entre taxa e valor presente. Ela não substitui a especificação integral, critérios de ajuste, calendário, arredondamentos ou procedimentos de negociação da B3.

### Opções e Greeks

O payoff no vencimento usa call/put, strike, prêmio e lado long/short. O snapshot de preço e Greeks utiliza uma aproximação Black–Scholes europeia sem dividendos.

Limitações explícitas do snapshot:

- não incorpora exercício antecipado;
- não modela dividendos;
- não usa superfície/sorriso de volatilidade;
- não representa bid/ask, liquidez, custos ou imposto;
- não calibra parâmetros a dados de mercado;
- não reproduz todas as convenções de produtos B3;
- Greeks são sensibilidades locais e mudam com o estado;
- a saída não é preço justo garantido nem recomendação.

### Swap

O laboratório calcula somente um diferencial simples entre duas taxas sobre um notional e prazo constantes. Não é um motor de precificação de swaps. Não incorpora curvas de desconto, capitalização específica, calendários, reset, amortização, collateral, risco de crédito ou convenções contratuais completas.

## Banco de variantes

O core contém 18 casos. A sessão escolhe 6 casos únicos por semente determinística.

Coberturas do banco:

- ajuste diário;
- margem e alavancagem;
- basis;
- vencimento e rolagem;
- DI: taxa × PU;
- payoff linear de futuros;
- futuro de dólar × spot;
- direito do titular de call;
- risco de call vendida descoberta;
- intrínseco × temporal;
- volatilidade × direção;
- delta;
- gamma;
- theta;
- vega;
- exercício/expiração;
- swaps;
- limites de modelo.

## Rubrica E3

Cada caso vale 100 pontos:

- 30 — mecanismo / limite de inferência;
- 25 — fator dominante;
- 20 — próxima verificação;
- 15 — fonte institucional;
- 10 — justificativa auditável com pelo menos 60 caracteres úteis.

Aprovação de caso: nota >= 80 e nenhuma violação dura.

Aprovação da sessão E3:

- 6 casos únicos concluídos;
- média >= 80;
- zero violações duras.

## Violações duras

A trilha aplica caps conservadores quando a resposta aceita premissas materialmente perigosas ou modelos como certeza, incluindo:

- tratar margem de garantia como perda máxima;
- afirmar que a perda de call vendida descoberta está limitada ao prêmio recebido;
- ignorar o direito do titular de opção;
- ignorar ajuste diário de futuros;
- afirmar que taxa DI e PU necessariamente sobem juntos;
- transformar volatilidade em direção garantida;
- apresentar delta como probabilidade garantida e fixa;
- tratar uma sensibilidade/modelo local como trajetória exata ou preço verdadeiro garantido.

## Persistência

Chave local: `suzy-derivatives-v1`.

O estado guarda até 60 tentativas. A normalização preserva, quando necessário:

- a sessão que sustenta a maior média histórica;
- uma sessão E3 aprovada;
- tentativas recentes até completar o limite.

O estado é local ao navegador e não constitui registro institucional externo.

## Integração

Após validação da arquitetura existente, a trilha é integrada a:

- `programa.html` como módulo 19;
- `alunos.html` / `js/alunos.js` / `js/student-core.js` como evidência E3 local;
- testes da Área do Aluno com total de 19 módulos;
- auditoria automatizada de acessibilidade.

## Critério de conclusão da Entrega 7

A Entrega 7 só pode ser considerada concluída após:

1. implementação em branch própria;
2. testes unitários;
3. E2E multinavegador;
4. acessibilidade no escopo configurado;
5. CodeQL;
6. revisão de findings;
7. PR mesclada na `main`;
8. validação pós-merge aplicável.

Código existente na branch ou PR aberta não equivale a entrega concluída, release publicada ou funcionamento em produção.
