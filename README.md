# SUZY COMMAND CENTER

Central demonstrativa para treinamento, registro de operações e gestão de risco. O projeto funciona no navegador e salva os dados localmente.

## Executar no VS Code

1. Clone ou baixe o repositório.
2. Abra a pasta no VS Code.
3. Instale a extensão **Live Server**.
4. Clique com o botão direito em `index.html`.
5. Selecione **Open with Live Server**.

Também é possível abrir `index.html` diretamente no navegador. Nesse modo, o sistema usa o catálogo local de segurança; pelo Live Server, carrega e valida `dados/ativos.json`.

## Recursos atuais

- Catálogo estruturado em JSON com fallback para abertura direta.
- Validação e normalização dos ativos antes da exibição.
- Catálogo com OTC, Forex, índices, criptomoedas e ouro.
- EUR/USD, GBP/USD, USD/JPY, BTC, ETH, XLM, SOL e outros ativos.
- Busca, categorias, favoritos e ordenação.
- Cotações demonstrativas com pequenas variações simuladas.
- Scanner demo com ranking de força, popularidade e variação simulada.
- Gráfico responsivo de velas japonesas com cenários artificiais, M1/M5/M15 e EMA 9/21.
- Registro manual de WIN e LOSS.
- Banca e resultado atualizados automaticamente.
- Risco máximo por entrada.
- Stop loss e stop gain diários.
- Limite de operações e de perdas consecutivas.
- Relatório completo e exportação CSV protegida contra fórmulas.
- Configuração da missão diária.
- Voz da Suzy pelo recurso de fala do navegador.
- Persistência via `localStorage`.
- Layout responsivo para computador e celular.
- Fechamento diário baseado na data local do dispositivo.
- Testes automatizados das datas, catálogo, exportação e travas de risco.
- Validação contínua pelo GitHub Actions.

## Estrutura

```text
suzy-command-center/
├── .github/
│   └── workflows/
│       └── quality.yml
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   └── core.js
├── dados/
│   └── ativos.json
├── test/
│   └── core.test.js
├── package.json
└── README.md
```

## Funcionamento do catálogo

Quando o projeto é servido pelo Live Server ou outro servidor HTTP, o frontend busca `dados/ativos.json`. Cada entrada passa por validação de ticker, nome, preço, casas decimais, categoria, popularidade e força.

Se o arquivo estiver indisponível, inválido ou o projeto for aberto diretamente por `file://`, o painel continua funcionando com um catálogo local de segurança. O fallback não transforma os valores em cotações reais; todo o conteúdo permanece demonstrativo.

## Limitações atuais

- Não existe autenticação.
- Os dados ficam somente no navegador usado.
- Não há feed real de preços ou calendário econômico.
- Não há conexão com IQ Option ou qualquer corretora.
- Não executa ordens reais ou automáticas.

## Próximas etapas recomendadas

1. Adicionar testes de integração da interface no navegador.
2. Criar backend Flask com SQLite para histórico persistente.
3. Implementar calendário econômico por fonte autorizada.
4. Criar alertas via Telegram sem execução de ordens.
5. Empacotar uma versão desktop após estabilizar o sistema.

## Aviso

Este software é educacional e demonstrativo. Ele não promete lucro, não fornece garantia de resultado e não substitui avaliação financeira independente. Mercados alavancados e operações de curto prazo envolvem risco elevado de perda.
