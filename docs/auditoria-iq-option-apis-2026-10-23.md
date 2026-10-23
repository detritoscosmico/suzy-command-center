# Auditoria técnica — APIs comunitárias relacionadas à IQ Option

**ID:** AUD-IQO-2026-10-23-01  
**Data:** 23/10/2026 (America/Sao_Paulo)  
**Escopo:** inspeção estática de código, README, árvore de arquivos, dependências, testes e governança.  
**Classificação:** PESQUISA / AVALIAÇÃO DOCUMENTAL — nenhum SDK incorporado.  
**Issue de acompanhamento:** [#69](https://github.com/detritoscosmico/suzy-command-center/issues/69).

## 1. Decisão executiva

**GO** apenas para documentação, modelagem de contrato de dados, fixtures sintéticas e testes locais offline de parsing, validação e proveniência.  
**NO-GO** para autenticar com a IQ Option, coletar dados pela rede, ativar WebSocket, transmitir ordens, compartilhar credenciais, construir bot operacional ou incorporar bibliotecas sem licenciamento e auditoria.

Esta decisão **não altera** [a governança aprovada](decisao-funcao-jurisdicao.md), que explicitamente proíbe conexão com corretora ou execução automática sem revisão formal. O produto já dispõe de uma [porta de entrada local controlada](dados-autorizados-proveniencia.md); a fase inicial deve **reutilizá-la**, em vez de criar um segundo ingest externo.

Não foram executados login, autenticação, download de feeds, testes com corretora nem operações reais ou demo. Nenhuma alegação de funcionamento em tempo real foi verificada.

## 2. Baseline e amostras auditadas

| Projeto | SHA inspecionado | Arquivos / evidência | Observação |
| --- | --- | --- | --- |
| Suzy Command Center | [dc8e2ac](https://github.com/detritoscosmico/suzy-command-center/commit/dc8e2acfd987d833922986d09eeb0efcc8c0e5ef) | `README.md`, `package.json`, `docs/decisao-funcao-jurisdicao.md`, `docs/dados-autorizados-proveniencia.md`, `docs/licenciamento-proprietario.md` | Versão declarada 1.32.0, app predominantemente JS/HTML, modo estático e backend local Node/SQLite; sem conector de corretora aprovado |
| Lu-Yi-Hsun/iqoptionapi | [7dd95a8](https://github.com/Lu-Yi-Hsun/iqoptionapi/commit/7dd95a81c079e8af7a3728aa2aa194154f29ba3f) | `requirements.txt`, `setup.py`, `iqoptionapi/api.py`, `iqoptionapi/stable_api.py`, `iqoptionapi/http/login.py`, `iqoptionapi/ws/client.py`, `tests/test_Login.py`, `tests/test_Candle.py`; [issue #369](https://github.com/Lu-Yi-Hsun/iqoptionapi/issues/369) | API Python não oficial; sem confirmação de funcionamento atual |
| Sudip-T/iqoptionapi-sync | [0d513af](https://github.com/Sudip-T/iqoptionapi-sync/commit/0d513af55295da485ca34c215f2685f64b33b474) | `README.md`, `LICENSE`, `requirements.txt`, `iqoptionapi/iqapi.py`, `iqoptionapi/http/auth.py`, `iqoptionapi/wsmanager/iqwebsocket.py`, `iqoptionapi/accounts.py`, árvore de diretórios | Framework Python não oficial e mais recente, mas recursos declarados não foram validados por execução |

SHA é ponto de referência para a inspeção, não selo de aprovação. Popularidade, data de push e autodeclaração de “production-ready” não comprovam segurança nem disponibilidade da API.

## 3. Achados por projeto

### 3.1 Lu-Yi-Hsun/iqoptionapi — referência histórica, NÃO aprovada para integração

- **Integração e arquitetura:** cliente Python utiliza chamadas HTTP de login e WebSocket; há funções de candles, streaming e negociação. A presença de funções não demonstra que o protocolo ainda funciona.
- **Dependências:** `websocket-client==0.56`, além de `requests` sem versão fixa no `requirements.txt`. A versão de WebSocket é antiga; requer avaliação de vulnerabilidades, compatibilidade e suporte antes de qualquer instalação.
- **Testes:** exemplos em `tests/test_Login.py` e `tests/test_Candle.py` obtêm credenciais de variáveis de ambiente e contatam a corretora. O teste de login tenta restaurar saldo de prática. **Não são testes unitários offline adequados** para rodar automaticamente no CI da Suzy.
- **Conectividade:** a [issue pública #369](https://github.com/Lu-Yi-Hsun/iqoptionapi/issues/369), aberta em fevereiro de 2026, relata que a API não funciona. Isto é um relato de usuário, **não** prova conclusiva de falha geral.
- **Licenciamento:** não foi identificado arquivo `LICENSE` no inventário da raiz nem licença declarada nos metadados consultados. **Tratar permissão de reutilização de código como NÃO CONFIRMADA**; sem copiar trechos para software proprietário enquanto não houver licença/autorização verificável.

**Decisão:** usar apenas como referência conceitual e fonte de hipóteses para testes offline; copiar/incorporar código: BLOQUEADO.

### 3.2 Sudip-T/iqoptionapi-sync — arquitetura em avaliação, NÃO aprovada para integração

- **Atividade e licença:** push registrado em 02/10/2026; repositório apresenta licença **MIT**, que requer preservação do aviso de copyright e permissão nos materiais incorporados. A compatibilidade da licença não resolve risco operacional ou termos da plataforma.
- **Dependências:** `websocket-client==1.8.0`, `requests==2.32.4` e versões fixas em `requirements.txt`. Isso facilita inventário, mas requer verificação de CVEs e atualizações para qualquer uso.
- **Autenticação:** `iqoptionapi/http/auth.py` recebe credenciais, usa sessão HTTP e extrai `ssid` do cookie; em respostas HTTP 400 registra texto bruto da resposta. **Risco de exposição de conteúdo sensível nos logs** a avaliar antes de operação em ambiente com credenciais.
- **Bloqueio sem prazo:** `IQOptionClient.connect()` em `iqoptionapi/iqapi.py` espera `appstate.profile_msg` num loop sem timeout explícito. Há timeout de 10 segundos para abertura de WebSocket, mas ele **não** limita a espera posterior por perfil.
- **Estado compartilhado:** referência a `appstate` global entre módulos demanda isolamento de sessões, tratamento de concorrência e testes de reconnect.
- **Testes:** a árvore de diretórios inspecionada não mostrou diretório de testes nem configuração de CI de validação equivalente. Isto **não prova ausência completa** de quaisquer testes; a cobertura e o resultado são desconhecidos.
- **Documentação:** o README descreve streaming, trading binário/digital, auto-reconexão e modelo “production-ready”; tais declarações são **não verificadas** aqui.

**Decisão:** pode informar desenho modular e interfaces, sem importação de código e sem executar SDK com credenciais. Conectividade, segurança e confiabilidade: PENDENTES.

## 4. Matriz de risco e bloqueios

| ID | Risco | Severidade de projeto | Condição para destravar |
| --- | --- | --- | --- |
| IQO-01 | Conexão viola escopo de governança aprovado | BLOQUEADOR | Nova decisão explícita e análise de enquadramento jurídico/termos da corretora |
| IQO-02 | Licença de Lu-Yi-Hsun não confirmada | BLOQUEADOR para cópia | Arquivo de licença, autorização escrita ou outro fundamento verificável |
| IQO-03 | Credenciais, sessão e logs de autenticação | ALTO | Threat model, armazenamento seguro, mascaramento, testes e não exposição ao browser/CI |
| IQO-04 | Timeouts/reconexão e estado global do cliente Sudip | ALTO | Testes de falha, timeout, isolamento de sessão, retries limitados e teardown |
| IQO-05 | Incerteza de protocolo, quotas, termos e dados em tempo real | ALTO | Documentação autorizativa e teste isolado formalmente aprovado |
| IQO-06 | Misturar Forex spot/CFD, opção digital/binária e OTC | ALTO | Contrato tipado de instrumento e validação de proveniência |
| IQO-07 | Tratar candles provisórios como fechados ou feed atrasado como vivo | ALTO | Flags explícitos de integridade/finalização, timestamp e idade do dado |
| IQO-08 | Ausência de garantia estatística, payout/custos não verificados | ALTO | Nunca apresentar sinal operacional; cálculo de equilíbrio separado da previsão |
| IQO-09 | Reaproveitar código externo no núcleo proprietário | ALTO | Revisão de licença, atribuição, aviso de terceiro e compatibilidade de distribuição |

## 5. Contrato canônico proposto para dados OHLC (somente offline)

O contrato abaixo é **proposta**, não endpoint implementado nem feed conectado.

### Campos de identidade e rastreabilidade (obrigatórios)

- `dataset_id`: identificador local estável e não sensível.
- `origin`: `ARTIFICIAL` ou `AUTHORIZED_LOCAL_FILE`; nunca inferir autorização automaticamente.
- `source_name`, `source_reference`, `authorization_basis`: origem e licença/base de uso, quando autorizada.
- `instrument_id`, `instrument_label`, `instrument_type`: identificar sem ambiguidade, por exemplo `FOREX_SPOT`, `CFD`, `BINARY`, `DIGITAL`, `OTC_SYNTHETIC`; não assumir equivalência de preços entre instrumentos.
- `venue_or_provider`, `quote_currency`, `timeframe_seconds`, `timestamp_utc`: contexto de mercado.
- `open`, `high`, `low`, `close`: números finitos e positivos, com `low <= min(open,close)` e `high >= max(open,close)`.
- `candle_state`: `CLOSED` ou `PROVISIONAL`; processamento de replay/scanner só usa `CLOSED` por padrão.
- `manifest_sha256`: digest do arquivo original, calculado localmente.

### Campos opcionais e controle

- `volume` e `volume_type` (por exemplo tick/negociado/desconhecido; **não** transformar tick volume em volume negociado).
- `timezone_original`, `captured_at_utc`, `data_delay_seconds` (somente se conhecido), `quality_flags`.
- `payout`, `expiration_utc` e tarifas **não fazem parte do OHLC universal**; exigem modelo próprio de contrato/operabilidade e fonte verificável caso tratados futuramente.

### Regras de validação

1. Rejeitar dataset sem `origin` válido ou sem base de autorização quando `AUTHORIZED_LOCAL_FILE`.
2. Recusar OHLC com NaN/infinito/valores não positivos, máxima/mínima inconsistentes ou timestamps impossíveis/duplicados.
3. Guardar `timestamp_utc` com offset determinado; não depender de fuso local implícito. Exibir no horário de Brasília apenas na interface.
4. Rejeitar candles sem `instrument_type` específico ou com timeframe incompatível.
5. Separar `PROVISIONAL` de `CLOSED`; proibir converter dados artificiais em “autorizados” só por edição de manifesto.
6. Não gerar recomendação, entrada ou execução a partir de dados normalizados.

**Compatibilidade:** antes de codificar, mapear este contrato aos campos reais já suportados em `js/provenance-core.js` e à [documentação de proveniência](dados-autorizados-proveniencia.md); preservar os fluxos existentes. Evitar implementação paralela.

## 6. Plano incremental e definição de pronto

### Fase A — concluída nesta PR documental

- [x] Confirmar ramo `main`, versão e decisão de governança vigente.
- [x] Comparar estrutura, dependências, licenças, login, fluxo de candles e testes dos dois candidatos.
- [x] Registrar achados verificáveis, incertezas e decisão NO-GO para conexão.
- [x] Abrir a [issue #69](https://github.com/detritoscosmico/suzy-command-center/issues/69) para acompanhamento.

### Fase B — proposta (não implementada nesta PR)

- [ ] Inspecionar o contrato existente em `js/provenance-core.js` e os testes `test/provenance.test.js`; publicar mapa de compatibilidade campo a campo.
- [ ] Criar fixtures totalmente artificiais e testes unitários offline (sem importar bibliotecas de terceiros).
- [ ] Validar rejeição de instrumento ambíguo, duplicatas, candle provisório, OHLC inválido e origem não autorizada.
- [ ] Manter `dados.html` como porta de entrada CSV local, sem endpoint remoto novo.
- [ ] Passar gates `npm run check`, `npm run test:unit` e os fluxos E2E relevantes; anexar evidências à PR de implementação.

### Fase C — bloqueada por governança

Qualquer estudo de autenticação real, conta demo, streaming ou integração de corretora exige **nova decisão formal**, avaliação de termos e jurisdição, segurança de credenciais, licenças, dados e critérios explícitos de aprovação. Não faz parte desta entrega.

## 7. O que não foi feito

- Nenhuma instalação de SDK Python de terceiros.
- Nenhum login com credenciais, API key, sessão WebSocket ou teste ao vivo.
- Nenhum download de cotações, promessa de precisão de feed ou teste de payout.
- Nenhuma alteração de UI, backend, ordens, estratégia ou gerenciamento de banca.
- Nenhum benchmark ou teste automatizado executado nesta inspeção via conector GitHub.
- Nenhum merge na `main`, publicação GitHub Pages, tag ou release.

## 8. Status e próxima decisão

**AUDITORIA DOCUMENTAL:** concluída, sujeita a revisão do mantenedor.  
**INTEGRAÇÃO IQ OPTION:** NO-GO / não iniciada.  
**PRÓXIMA ETAPA SEGURA:** Fase B — especificação e testes do contrato offline com dados sintéticos, utilizando a trilha de proveniência já existente.  
**Proprietário:** mantenedor do Suzy Command Center.  
**Versão deste registro:** 1.0.
