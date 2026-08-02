# Calendário econômico educacional

Arquivo principal: `calendario.html`.

O módulo foi criado para estudo de risco de evento. Ele não consulta feeds externos, não fornece sinais e não garante atualização ou exatidão dos dados importados.

## Fontes e autorização

O sistema não determina se um arquivo pode ser reutilizado. Antes da importação, o usuário precisa:

1. identificar a fonte;
2. informar uma URL de referência quando existir;
3. confirmar que possui autorização, licença ou direito de uso;
4. conferir horários e valores no provedor original.

Essa confirmação é uma declaração do usuário, não uma validação jurídica automática.

## Formatos aceitos

- CSV;
- JSON como lista de eventos;
- JSON com a propriedade `events`.

Limites:

- até 2 MB por arquivo;
- até 5.000 eventos;
- processamento somente no navegador;
- nenhum arquivo é enviado a servidor externo.

## Colunas

Obrigatórias:

- `datetime`: data e hora ISO 8601 com fuso explícito, por exemplo `2026-08-03T13:30:00-03:00`;
- `currency`: moeda, país ou código curto;
- `event`: nome do evento;
- `impact`: `HIGH`, `MEDIUM` ou `LOW`;
- `source`: nome da fonte, salvo quando não for preenchido no formulário.

Opcionais:

- `previous`;
- `forecast`;
- `actual`;
- `source_url`.

Cabeçalhos equivalentes em português também são aceitos, incluindo `data_hora`, `moeda`, `evento`, `impacto`, `anterior`, `previsao`, `resultado`, `fonte` e `fonte_url`.

## Validações

- datas sem `Z` ou deslocamento UTC são rejeitadas;
- URLs aceitam apenas `http` e `https`;
- impactos desconhecidos são rejeitados;
- eventos sem moeda, nome ou fonte são rejeitados;
- duplicatas são removidas pela combinação de horário, moeda, evento e fonte;
- eventos válidos são ordenados cronologicamente;
- conteúdo é inserido na interface com `textContent`, reduzindo risco de injeção de HTML.

## Estados temporais

- **Agora:** evento dentro da janela de cinco minutos antes ou depois do horário;
- **Próximo:** até 60 minutos à frente;
- **Hoje:** ainda no mesmo dia local;
- **Futuro:** após o dia atual;
- **Encerrado:** mais de cinco minutos no passado.

## Exemplo artificial

O botão **Carregar exemplo artificial** cria três eventos relativos ao relógio atual. Eles são claramente identificados como artificiais e não representam divulgações reais.

## Persistência e exportação

Os eventos ficam no `localStorage` do navegador. A exportação JSON inclui:

- versão do formato;
- data da exportação;
- identificação declarada da fonte;
- indicador de autorização;
- modo artificial ou importado;
- eventos normalizados.

## Limitações

- não existe atualização automática;
- não há integração com banco central, agência estatística ou provedor comercial;
- o sistema não verifica licenças ou termos de uso;
- mudanças e revisões publicadas depois da importação não são incorporadas;
- horários podem mudar na fonte original;
- não há conversão manual de fuso: o arquivo precisa trazer o deslocamento UTC;
- não existe conexão com corretora ou execução de ordens.
