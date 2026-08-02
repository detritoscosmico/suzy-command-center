# Backend local seguro

O Suzy Command Center mantém a versão pública do GitHub Pages como demonstração estática. O modo autenticado funciona separadamente no computador do usuário.

## Requisitos

- Node.js 22 ou superior;
- terminal aberto na raiz do projeto;
- dependências instaladas com `npm install`.

## Iniciar

```bash
npm run serve:secure
```

O servidor informa um endereço semelhante a:

```text
http://127.0.0.1:8787
```

Abra `login.html` pelo endereço local e crie a primeira conta.

## Armazenamento

O banco padrão é criado em:

```text
data/suzy-local.sqlite3
```

A pasta `data/` é ignorada pelo Git. Arquivos auxiliares do SQLite, como WAL e SHM, também permanecem somente no computador.

Para usar outro caminho:

```bash
SUZY_DB_PATH="C:/Suzy/dados.sqlite3" npm run serve:secure
```

No PowerShell:

```powershell
$env:SUZY_DB_PATH="C:\Suzy\dados.sqlite3"
npm run serve:secure
```

## Segurança implementada

- servidor restrito a `127.0.0.1`;
- senha derivada com PBKDF2-HMAC-SHA256, salt aleatório e 310.000 iterações;
- tokens de sessão aleatórios armazenados apenas como hash no banco;
- cookie `HttpOnly` e `SameSite=Strict`;
- sessão com expiração automática em sete dias;
- token CSRF obrigatório em alterações persistentes;
- limite de cinco tentativas de login por janela de 15 minutos;
- limite de 2 MB por corpo JSON;
- máximo de 10.000 registros no diário;
- validação e normalização de todos os campos antes da gravação;
- cabeçalhos CSP, antiframe, `nosniff` e política de permissões;
- servidor de arquivos impedido de sair da raiz do repositório.

## Histórico persistente

A página `login.html` permite:

1. criar a conta local;
2. entrar e sair da sessão;
3. importar o backup JSON gerado pelo Diário Profissional;
4. baixar do SQLite um backup compatível;
5. apagar o histórico persistido após confirmação.

Nesta etapa, a transferência entre `diario.html` e o banco é manual por arquivo JSON. A integração automática será desenvolvida separadamente para reduzir o risco de sobrescrever registros sem confirmação.

## API local

Rotas disponíveis:

- `GET /api/health`;
- `GET /api/auth/status`;
- `POST /api/auth/setup`;
- `POST /api/auth/login`;
- `POST /api/auth/logout`;
- `GET /api/journal`;
- `PUT /api/journal`.

As rotas do diário exigem sessão válida. Alterações exigem também o cabeçalho `X-CSRF-Token`.

## Limitações

- o backend não funciona no GitHub Pages;
- não existe recuperação de senha nesta fase;
- o banco não é criptografado em repouso;
- a autenticação foi projetada para uso individual e local, não para exposição pública na internet;
- o módulo `node:sqlite` usado pelo Node.js 22 pode emitir aviso de recurso experimental;
- ainda não existe sincronização automática entre navegadores ou dispositivos.
