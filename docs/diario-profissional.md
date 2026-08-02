# Diário Profissional da Academia Suzy

O arquivo `diario.html` oferece um diário educacional para registrar operações, processo decisório, emoções, aderência ao plano e desempenho em múltiplos de risco (`R`).

## Campos registrados

- data e hora;
- ativo e mercado;
- sessão e timeframe;
- direção;
- setup;
- resultado em `R`;
- cumprimento do plano;
- qualidade da execução de 1 a 5;
- emoção antes e depois;
- erro de processo;
- contexto da operação;
- lição e próxima correção.

## Estatísticas

O painel calcula:

- total de operações;
- taxa de acerto;
- resultado acumulado em `R`;
- expectativa por operação;
- profit factor;
- drawdown máximo em `R`;
- aderência ao plano;
- qualidade média da execução;
- curva acumulada;
- erros recorrentes;
- desempenho por setup, ativo, sessão e timeframe.

## Interpretação

A expectativa é calculada pela soma de todos os resultados em `R` dividida pela quantidade de operações. O profit factor divide a soma dos ganhos pela soma absoluta das perdas. O drawdown mede a maior queda da curva acumulada a partir de um pico anterior.

As métricas devem ser avaliadas em amostras relevantes. Uma sequência pequena não valida uma estratégia e desempenho passado não garante resultado futuro.

## Armazenamento e backup

Os dados são salvos no `localStorage` do navegador. Eles não são enviados para servidor. A remoção dos dados do navegador pode apagar o diário.

Use periodicamente:

- **Exportar CSV** para análise em planilhas;
- **Backup JSON** para preservar uma cópia completa dos registros.

A exportação CSV utiliza a proteção central do projeto contra fórmulas de planilha.

## Limitações

- não existe sincronização entre dispositivos;
- não existe autenticação;
- o backup JSON ainda não é reimportado automaticamente;
- não há upload de capturas de tela;
- o diário não fornece sinais, recomendações ou garantia de desempenho;
- a responsabilidade pela qualidade e veracidade dos registros é do usuário.
