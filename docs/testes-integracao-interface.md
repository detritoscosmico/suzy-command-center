# Testes de integração da interface

O projeto utiliza Playwright para validar os principais fluxos diretamente em um navegador Chromium.

## Cobertura atual

Os testes verificam:

- carregamento das seis páginas públicas sem erros de execução;
- visualização em desktop e celular;
- registro de uma operação demonstrativa no Command Center;
- conclusão da primeira aula e liberação sequencial da Academia;
- avanço candle a candle e abertura de posição no replay;
- envio de ordem a mercado no simulador;
- criação de um registro e atualização das métricas do diário.

## Executar localmente

Instale as dependências:

```bash
npm install
npx playwright install chromium
```

Execute os testes unitários:

```bash
npm run test:unit
```

Execute os testes de navegador:

```bash
npm run test:e2e
```

Abra o último relatório HTML:

```bash
npm run test:e2e:report
```

## Servidor de testes

O arquivo `test/e2e/server.js` inicia um servidor HTTP local em `127.0.0.1:4173`. Ele serve somente arquivos localizados dentro do repositório e rejeita tentativas de navegação para fora da raiz.

## GitHub Actions

A automação de qualidade:

1. instala as dependências;
2. instala o Chromium do Playwright;
3. verifica a sintaxe dos arquivos JavaScript;
4. executa os testes unitários;
5. executa os testes de integração;
6. publica o relatório HTML como artefato por sete dias.

## Limitações

- a suíte usa Chromium, não cobrindo ainda Firefox e WebKit;
- os fluxos funcionais completos são executados no perfil desktop;
- o perfil móvel valida carregamento, responsividade básica e ausência de erros de execução;
- os testes não substituem revisão manual de acessibilidade, usabilidade ou conteúdo educacional.
