# Sincronização direta do Diário Profissional

O Diário Profissional continua funcionando no GitHub Pages e quando aberto como página estática. Nesse modo, os registros permanecem somente no `localStorage` do navegador.

Quando o projeto é iniciado pelo backend local seguro, o diário detecta a API, verifica a sessão autenticada e oferece persistência direta no SQLite.

## Ativar

```bash
npm install
npm run serve:secure
```

Abra:

```text
http://127.0.0.1:8787/login.html
```

Crie a conta ou faça login. Depois acesse:

```text
http://127.0.0.1:8787/diario.html
```

## Estados possíveis

### Somente navegador

O backend não está disponível. O diário continua funcional e salva no navegador.

### Login necessário

O servidor local está ativo, mas a sessão não foi autenticada.

### Dados aguardando envio

O navegador possui registros e o SQLite está vazio. O botão **Salvar no SQLite** cria a cópia persistente.

### Backup disponível no SQLite

O SQLite possui registros e o navegador está vazio. O botão **Restaurar do SQLite** recupera o histórico.

### Versões diferentes

As duas cópias são diferentes. Nenhuma delas é substituída automaticamente. O usuário escolhe explicitamente:

- **Salvar no SQLite:** a versão atual do navegador prevalece;
- **Restaurar do SQLite:** a versão persistida prevalece.

A interface exige confirmação quando a operação substituir dados existentes.

### Sincronização automática ativa

Depois que as cópias ficam iguais, novos registros, exclusões e limpezas são enviados automaticamente ao SQLite. A cópia no navegador continua sendo mantida para permitir uso local e recuperação imediata da interface.

## Segurança

- o cookie de sessão permanece `HttpOnly` e não é lido pelo JavaScript;
- o token CSRF é mantido apenas em memória durante a página aberta;
- as chamadas usam mesma origem e não habilitam CORS externo;
- o servidor continua restrito a `127.0.0.1`;
- conflitos não são resolvidos silenciosamente;
- o payload permanece limitado a 2 MB e 10.000 registros;
- todos os registros passam pela validação do servidor antes da gravação.

## Limitações

- não existe sincronização entre computadores pela internet;
- o servidor local precisa estar ligado;
- o banco não é criptografado em repouso;
- não há edição individual de registros nesta fase;
- não existe histórico de versões ou lixeira;
- o GitHub Pages não possui acesso ao SQLite local.
