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

Abra `login.html` pelo endereço local, crie a primeira conta e guarde a chave de recuperação exibida.

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
- chave de recuperação aleatória armazenada somente como hash SHA-256;
- tokens de sessão aleatórios armazenados apenas como hash no banco;
- cookie `HttpOnly` e `SameSite=Strict`;
- sessão com expiração automática em sete dias;
- token CSRF obrigatório em alterações persistentes;
- limite de cinco tentativas por janela de 15 minutos para login, recuperação e ações sensíveis;
- invalidação de todas as sessões depois de troca ou recuperação de senha;
- limite de 2 MB por corpo JSON;
- máximo de 10.000 registros no diário;
- validação e normalização de todos os campos antes da gravação;
- cabeçalhos CSP, antiframe, `nosniff` e política de permissões;
- servidor de arquivos impedido de sair da raiz do repositório.

## Conta e recuperação

A página `login.html` permite:

1. criar a conta local;
2. entrar e sair da sessão;
3. gerar ou rotacionar uma chave de recuperação mediante senha atual;
4. alterar a senha mediante senha atual e CSRF;
5. recuperar a conta com usuário, chave vigente e nova senha;
6. importar ou exportar backups do diário;
7. apagar o histórico persistido após confirmação.

A chave em texto é entregue somente no momento de criação ou rotação. O banco armazena apenas seu hash. O fluxo completo está em `docs/recuperacao-senha-local.md`.

## Diário persistente

O `diario.html` detecta o backend e a sessão autenticada. Depois do alinhamento inicial entre navegador e SQLite, novos registros, exclusões e limpezas são sincronizados automaticamente. Divergências exigem escolha explícita do usuário.

A transferência manual por backup JSON permanece disponível como recurso adicional.

## API local

Rotas disponíveis:

- `GET /api/health`;
- `GET /api/auth/status`;
- `POST /api/auth/setup`;
- `POST /api/auth/login`;
- `POST /api/auth/logout`;
- `POST /api/auth/recovery-key`;
- `POST /api/auth/change-password`;
- `POST /api/auth/recover`;
- `GET /api/journal`;
- `PUT /api/journal`.

As rotas do diário exigem sessão válida. Alterações autenticadas exigem também o cabeçalho `X-CSRF-Token`.

## Migração

Bancos criados por versões anteriores recebem automaticamente as colunas de chave de recuperação e data de atualização da senha. A senha e o histórico existentes são preservados. O usuário deve entrar com a senha atual e gerar a primeira chave.

## Limitações

- o backend não funciona no GitHub Pages;
- sem a senha e sem uma chave válida, não existe recuperação automática;
- o banco não é criptografado em repouso;
- a autenticação foi projetada para uso individual e local, não para exposição pública na internet;
- o módulo `node:sqlite` usado pelo Node.js 22 pode emitir aviso de recurso experimental;
- não existe sincronização pela internet ou entre computadores.
