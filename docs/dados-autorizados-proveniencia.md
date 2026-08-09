# Dados autorizados e proveniência

O Ciclo 6 cria uma porta de entrada controlada para dados OHLC no Suzy Command Center. O objetivo é permitir estudos locais sem transformar arquivos de origem desconhecida em material confiável por acidente.

## Entrada aceita

O laboratório recebe CSV local de até 2 MB com `timestamp`, `open`, `high`, `low` e `close`. Também reconhece equivalentes em português. O arquivo precisa passar por:

- parsing consistente do delimitador;
- timestamps válidos e não duplicados;
- preços numéricos;
- máxima maior ou igual aos demais preços da vela;
- mínima menor ou igual aos demais preços da vela;
- derivação do início e fim do período observado.

O arquivo bruto não é gravado em `localStorage` nem enviado pela interface.

## Manifesto

Para criar um manifesto, o usuário registra nome, fonte, instrumento, timeframe e fuso. Dados classificados como autorizados também exigem licença/base de autorização e confirmação explícita de uso permitido.

O navegador calcula SHA-256 do conteúdo original com Web Crypto. O manifesto guarda o digest, contagem de linhas, período detectado e resultado da validação estrutural. Uma revalidação posterior compara o SHA-256 do arquivo selecionado com o manifesto salvo.

## Dado artificial

Quando a origem é artificial, o manifesto recebe `ARTIFICIAL_PERMANENT` e a etiqueta `DADO ARTIFICIAL — ETIQUETA PERMANENTE`. Normalização e reimportação do manifesto preservam essa classificação; ela não pode ser promovida para dado autorizado apenas por edição do rótulo externo.

## Credenciais e conectividade

A versão pública opera em `LOCAL_FILE_ONLY`:

- não solicita nem salva API keys, tokens ou senhas;
- não conecta diretamente com corretoras;
- não baixa feeds automaticamente;
- adaptadores futuros precisam manter segredos no servidor e documentar licença/proveniência antes de entregar dados ao front-end.

## Validação automatizada

- testes unitários de CSV, OHLC, duplicatas, autorização, classificação e digest;
- fluxos E2E de manifesto autorizado, dado artificial e revalidação de arquivo alterado;
- auditoria de acessibilidade junto às demais páginas públicas;
- verificação de sintaxe no gate padrão do projeto.
