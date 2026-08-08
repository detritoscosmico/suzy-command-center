# Capstone profissional baseado em casos

O Capstone do Suzy Command Center avalia decisão e documentação sob incerteza. Ele não tenta prever mercado, premiar direção acertada nem declarar aptidão para capital real.

## Desenho da sessão

- cada sessão apresenta quatro de oito casos artificiais;
- uma semente inteira torna a seleção e a ordem reproduzíveis;
- fatos e política do caso aparecem antes da decisão;
- o desfecho artificial fica oculto até a decisão ser travada;
- `NÃO OPERAR` é uma resposta válida tanto com quanto sem bloqueio, quando o processo está corretamente registrado;
- o desfecho revelado não participa da pontuação.

Os casos cobrem janela de evento macro, spread acima do teto, liquidez rasa, gatilho ainda ausente, volatilidade extrema e cenários sem bloqueio em AAPL, BTC e VALE3. Todos os valores são didáticos.

## Rubrica pública

| Critério | Pontos |
| --- | ---: |
| Respeitar bloqueios obrigatórios | 25 |
| Identificar bloqueadores pelos fatos | 15 |
| Respeitar teto de risco | 15 |
| Documentar gatilho antes de operar | 10 |
| Documentar invalidação antes de operar | 10 |
| Registrar justificativa suficiente | 15 |
| Reconhecer a incerteza | 10 |

A nota mínima de processo é 80. Operar apesar de um bloqueio obrigatório limita a nota do caso a 49. Planejar risco acima do teto limita a nota a 69. Uma sessão só conclui o ciclo quando os quatro casos são aprovados, sem violação dura e com média mínima 80.

## Isolamento entre processo e resultado

`js/capstone-core.js` recebe cenário e resposta e calcula a nota antes de expor `outcome`. Testes unitários trocam explicitamente um desfecho favorável por desfavorável e verificam que a pontuação permanece idêntica. Assim, sorte retrospectiva não reescreve disciplina prévia.

## Persistência, privacidade e limites

O histórico resumido fica somente em `localStorage` no navegador e pode ser apagado ou exportado em JSON. Não há chave de corretora, ordem real, feed de mercado, telemetria externa ou sincronização automática. O histórico não é credencial, certificado ou prova de competência para investimento real.

## Validação

- testes unitários do motor determinístico e das penalidades;
- fluxo E2E do bloqueio do desfecho, reprodutibilidade da semente e violação dura;
- auditoria de acessibilidade automatizada junto às páginas públicas;
- validação de sintaxe JavaScript no comando `npm run check`.
