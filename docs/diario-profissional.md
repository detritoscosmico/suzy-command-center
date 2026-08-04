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

## Edição e histórico de versões

Cada registro ativo pode ser editado. Antes de salvar uma alteração, o diário preserva automaticamente uma cópia da versão anterior.

- cada operação mantém até 20 versões anteriores;
- o histórico mostra data da preservação, motivo, ativo, setup e resultado em `R`;
- qualquer versão anterior pode ser restaurada;
- antes de uma restauração, a versão atual também é preservada;
- as versões não participam das estatísticas enquanto não forem restauradas.

## Lixeira

Excluir uma operação não remove o registro imediatamente. O item é movido para a lixeira e deixa de participar das métricas.

Na lixeira é possível:

- restaurar o registro ao histórico ativo;
- excluir somente um item de forma definitiva;
- esvaziar toda a lixeira mediante confirmação;
- mover todos os registros ativos para a lixeira em uma única ação.

A exclusão definitiva remove também o histórico de versões relacionado ao item.

## Interpretação

A expectativa é calculada pela soma de todos os resultados em `R` dividida pela quantidade de operações. O profit factor divide a soma dos ganhos pela soma absoluta das perdas. O drawdown mede a maior queda da curva acumulada a partir de um pico anterior.

As métricas devem ser avaliadas em amostras relevantes. Uma sequência pequena não valida uma estratégia e desempenho passado não garante resultado futuro.

## Armazenamento, sincronização e backup

No modo estático, registros ativos, versões e lixeira são salvos no `localStorage` do navegador.

No modo local seguro, após autenticação, o estado completo também pode ser sincronizado diretamente com o SQLite:

- registros ativos;
- histórico de versões;
- lixeira;
- datas de exclusão e revisão.

O backend utiliza um envelope interno codificado em Base64 UTF-8 para preservar o ciclo de vida sem alterar o esquema existente da tabela `journal_entries`. Fragmentos internos são removidos antes da apresentação dos dados e não entram nas estatísticas.

A sincronização automática só é ativada quando navegador e SQLite estão alinhados. Em caso de divergência, o usuário escolhe qual estado deve prevalecer. Bancos antigos contendo somente registros ativos são migrados automaticamente apenas quando esses registros coincidem com a cópia do navegador.

Use periodicamente:

- **Exportar CSV** para análise dos registros ativos filtrados;
- **Backup JSON completo** para preservar registros ativos, lixeira e histórico de versões;
- **Baixar do banco** na página da conta para obter a cópia completa persistida no SQLite.

A exportação CSV utiliza a proteção central do projeto contra fórmulas de planilha.

## Proteção contra corrupção parcial

Antes de restaurar versões e lixeira, o cliente verifica:

- presença da sequência completa de fragmentos;
- ordem dos identificadores internos;
- decodificação Base64 UTF-8;
- versão do formato;
- validade das datas e registros recuperados.

Quando a verificação falha, a restauração e a sincronização automática ficam bloqueadas. Os registros ativos continuam disponíveis para análise e recuperação manual.

## Limitações

- não existe sincronização entre computadores pela internet;
- o servidor local precisa estar ativo para acessar o SQLite;
- o envelope de ciclo de vida possui limite conservador de 350.000 caracteres codificados;
- o banco local não é criptografado em repouso;
- não há upload de capturas de tela;
- o diário não fornece sinais, recomendações ou garantia de desempenho;
- a responsabilidade pela qualidade e veracidade dos registros é do usuário.
