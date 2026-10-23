# Contrato OHLC offline — Fase B (IQ Option: pesquisa, NÃO integração)

**ID:** DEV-IQO-2026-10-23-B  
**Data:** 23/10/2026 — America/Sao_Paulo  
**Issue:** [#69](https://github.com/detritoscosmico/suzy-command-center/issues/69)  
**Auditoria antecedente:** [PR documental #70](https://github.com/detritoscosmico/suzy-command-center/pull/70)  
**Status:** implementação candidata, sujeita a CI e revisão. Sem conexão com corretora.

## Objetivo e fronteira de governança

Implementar e testar, de forma offline, um contrato canônico para candles OHLC a partir de **bytes de CSV local**. A implementação reutiliza o validador existente `js/provenance-core.js`, não adiciona dependências e **não é importada por páginas HTML nem pelo servidor local**.

Conforme `docs/decisao-funcao-jurisdicao.md`, esta entrega **não** autentica contas reais ou demo, não solicita senhas, não conecta API/WS da IQ Option, não assina cotações, não fornece recomendações e não envia ordens. A IQ Option aparece apenas como objeto de pesquisa de APIs comunitárias, não como provedora de qualquer dado utilizado.

## Mapeamento de compatibilidade (antes → Fase B)

| Campo/recurso existente | Campo no contrato offline | Estratégia de compatibilidade |
| --- | --- | --- |
| `metadata.sourceType`: `ARTIFICIAL`/`AUTHORIZED_LOCAL` | `classification` (`ARTIFICIAL_PERMANENT`/`AUTHORIZED_LOCAL`) | Reutiliza `validateMetadata` + `createManifest`; **não** aceita origem desconhecida convertida automaticamente para autorizada |
| `metadata.sourceName`, `sourceUrl`, `license`, `authorizationConfirmed` | `manifest.metadata` | Preserva checks de base legal/autorização existentes |
| `metadata.instrument` | `instrument.symbol` + `instrument.instrumentType` | Símbolo deve corresponder ao manifesto e tipo é obrigatório. OTC sintético não equivale a Forex spot |
| `metadata.timeframe` | `instrument.timeframe` + `timeframeSeconds` | Correspondência exata; rejeita granularidade diferente e timestamps fora da grade |
| `metadata.timezone` | `candles[].timestampUtc` / `time` (epoch ms) | Usa conversão IANA do provenance-core; `OPEN_TIME_UTC` obrigatório |
| `inspectCsv()` | `inspectCsv({includeAllRows:true})` | **Mesmo validador**; adição opt-in ao retorno de todos os candles; prévia da UI continua em 10 linhas |
| `inspectCsv().validRows` / `periodStart` / `periodEnd` | `integrity` | Contagens e intervalo são herdados; até 5.000 candles |
| SHA-256 original / `verifyDigest` | `integrity.sha256` / `manifest.integrity` | Hash calculado a partir dos **bytes originais** com `node:crypto` |
| `adapterPolicy.LOCAL_FILE_ONLY` | `policy` | Sem rede, credenciais, execução ou conexão |
| `js/replay-core.js` / `replay.html` | Nenhuma integração direta nesta fase | Replay permanece intacto; não altera importador nem simulação existente |

## API offline (Node.js 22+)

`buildOfflineDataset({ bytes, metadata, descriptor, now })` é exportada por `js/offline-candle-contract.js`.

- `bytes`: `Uint8Array`/`Buffer` original, entre 1 byte e 2 MiB. UTF-8 estrito.
- `metadata`: mesmos campos usados pelo formulário de proveniência. `sourceType` deve ser informado explicitamente.
- `descriptor`: `symbol`, `instrumentType`, `venueOrProvider`, `quoteCurrency`, `timeframeSeconds`, `candleState: "CLOSED"`, `timestampSemantics: "OPEN_TIME_UTC"`.
- `now`: ISO8601 opcional para data determinística do manifesto em testes.
- Retorno: `classification`, `permanentLabel`, `policy`, `instrument`, `integrity`, `manifest`, `candles`.
- Lançamentos de erro são locais/síncronos. Não há `fetch`, `WebSocket`, `HTTP`, `login`, `buy`, `sell` ou chave/API associada ao contrato.

### Tipos de instrumento suportados (classificação; não conexão)

`FOREX_SPOT`, `FOREX_CFD`, `CRYPTO_SPOT`, `CRYPTO_PERPETUAL`, `INDEX_CFD`, `COMMODITY_CFD`, `BINARY`, `DIGITAL` e `OTC_SYNTHETIC`. Esses nomes identificam o **instrumento alegado na importação local**; não verificam a identidade do emissor, a autenticidade da corretora, o payout ou as condições de mercado.

O sufixo `-OTC` obriga `OTC_SYNTHETIC`, mas o tipo explícito também é obrigatório quando o ticker não contém sufixo.

### Timeframes

Grade fixa em segundos: `S5`, `S10`, `S15`, `S30`, `M1`, `M5`, `M15`, `M30`, `H1`, `H2`, `H4`, `H12`, `D1`. Sem suporte, nesta versão, a semana/mês de duração variável ou a horários de sessão específicos. Lacunas entre candles são permitidas (mercado fechado), mas o timestamp deve se alinhar ao começo do período em UTC.

**Premissa explícita:** timestamps de candles representam **abertura** do período em UTC após interpretação do fuso original. Fontes que usam fechamento da vela exigem conversão/autorização fora do contrato. A classificação não comprova sincronismo de relógio nem se uma vela realmente fechou; o `candleState` declarado precisa ser garantido pelo responsável pela fonte.

## Regras de segurança e falha

1. Falha fechada para origem não reconhecida, autorizada sem licença ou sem confirmação explícita.
2. Falha para instrumento/tipo ausente, inconsistência entre símbolo e manifesto e OTC confundido com Forex spot.
3. Falha para candle provisório, granularidade divergente e timestamp desalinhado.
4. Falha para linha OHLC impossível, inválida, repetida, preço não positivo, CSV com UTF-8 inválido ou mais de 5.000 candles.
5. SHA-256 calculado dos bytes originais, manifesto com classificação permanente para dados artificiais e `brokerConnection:false`.
6. É obrigatório distinguir **integridade estrutural** de **veracidade/origem confiável**. Hash e metadados não tornam um arquivo de terceiros autêntico.

**Observação:** o validador existente permite alguns preços não positivos em sua inspeção geral; **o novo contrato offline faz a rejeição adicional** sem mudar as regras atuais da UI. O contrato recusa qualquer linha inválida, ao contrário de fluxos exploratórios que descartam registros.

## Fixtures e testes

- `test/fixtures/ohlc-offline-artificial.csv`: 12 candles M5 sintéticos; nenhum preço atual.
- `test/offline-candle-contract.test.js`: regressões para 12 candles, preservação da prévia de 10, SHA-256, autorizado vs artificial, instrumento spot/OTC, granularidade, horário, estado CLOSED, número inválido, duplicatas, codificação, limites e fuso.
- `package.json`: integra os dois novos arquivos ao gate `npm run check`, mantendo `node --test test/*.test.js`.

Com Node 22+:

```sh
npm ci
npm run check
npm run test:unit
```

A inclusão dos arquivos em um pull request não equivale a testes aprovados: consultar a conclusão do GitHub Actions e revisar diffs. Os gates E2E existentes podem ser executados separadamente para assegurar a ausência de regressões.

## Próximos gates

**GO proposto:** revisão do código, todos os testes verdes no SHA candidato, convenção de timestamp documentada, proveniência não rebaixada e contrato estritamente offline.

**NO-GO contínuo:** SDK de terceiros, scraping, conexão/autenticação IQ Option (mesmo demo), ordens, sinais operacionais, martingale e implantação de feed remoto.

**Próximo passo após a PR:** revisão funcional e de segurança com o mantenedor; nenhuma mudança na governança, versão publicada ou branch `main` está implícita.
