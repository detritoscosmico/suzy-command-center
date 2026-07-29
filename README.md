# SUZY COMMAND CENTER

Central demonstrativa para treinamento, registro de operações e gestão de risco. O projeto funciona no navegador e salva os dados localmente.

## Executar no VS Code

1. Clone ou baixe o repositório.
2. Abra a pasta no VS Code.
3. Instale a extensão **Live Server**.
4. Clique com o botão direito em `index.html`.
5. Selecione **Open with Live Server**.

Também é possível abrir `index.html` diretamente no navegador.

## Recursos atuais

- Catálogo com OTC, Forex, índices, criptomoedas e ouro.
- EUR/USD, GBP/USD, USD/JPY, BTC, ETH, XLM, SOL e outros ativos.
- Busca, categorias, favoritos e ordenação.
- Cotações demonstrativas com pequenas variações simuladas.
- Registro manual de WIN e LOSS.
- Banca e resultado atualizados automaticamente.
- Risco máximo por entrada.
- Stop loss e stop gain diários.
- Limite de operações e de perdas consecutivas.
- Relatório completo e exportação CSV.
- Configuração da missão diária.
- Voz da Suzy pelo recurso de fala do navegador.
- Persistência via `localStorage`.
- Layout responsivo para computador e celular.

## Estrutura

```text
suzy-command-center/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── dados/
│   └── ativos.json
└── README.md
```

## Limitações atuais

- Não existe autenticação.
- Os dados ficam somente no navegador usado.
- Não há feed real de preços ou calendário econômico.
- Não há conexão com IQ Option ou qualquer corretora.
- Não executa ordens reais ou automáticas.

## Próximas etapas recomendadas

1. Separar os ativos para um arquivo JSON consumido pelo frontend.
2. Adicionar testes automatizados das regras de risco.
3. Criar backend Flask com SQLite para histórico persistente.
4. Implementar calendário econômico por fonte autorizada.
5. Criar alertas via Telegram sem execução de ordens.
6. Empacotar uma versão desktop após estabilizar o sistema.

## Aviso

Este software é educacional e demonstrativo. Ele não promete lucro, não fornece garantia de resultado e não substitui avaliação financeira independente. Mercados alavancados e operações de curto prazo envolvem risco elevado de perda.