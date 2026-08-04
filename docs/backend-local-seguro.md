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

A chave AES padrão é criada separadamente em:

```text
data/suzy-local.sqlite3.key
```

A pasta `data/` é ignorada pelo Git. Arquivos auxiliares do SQLite, como WAL e SHM, também permanecem somente no computador.

Para usar outro caminho para o banco:

```bash
SUZY_DB_PATH="C:/Suzy/dados.sqlite3" npm run serve:secure
```

No PowerShell:

```powershell
$env:SUZY_DB_PATH="C:\Suzy\dados.sqlite3"
npm run serve:secure
```

O arquivo de chave padrão acompanha o caminho do banco com o sufixo `.key`. Também é possível informar `SUZY_DATA_KEY` ou `SUZY_KEY_PATH`, conforme `docs/criptografia-repouso-sqlite.md`.

## Segurança implementada

- servidor restrito a `127.0.0.1`;
- conteúdo operacional do diário criptografado com AES-256-GCM antes da gravação no SQLite;
- vetor de inicialização aleatório e tag de autenticação por registro;
- dados associados ao usuário, identificador e versão do envelope;
- marcador criptografado que bloqueia a abertura com chave incorreta;
- migração transacional dos registros legados em texto aberto;
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

A chave de recuperação da conta não substitui a chave AES do banco. Para restaurar um SQLite criptografado, preserve também o arquivo `.key` ou a chave definida em `SUZY_DATA_KEY`.

## Diário persistente

O `diario.html` detecta o backend e a sessão autenticada. Depois do alinhamento inicial entre navegador e SQLite, novos registros, exclusões e limpezas são sincronizados automaticamente. Divergências exigem escolha explícita do usuário.

A transferência manual por backup JSON permanece disponível como recurso adicional. Esses arquivos exportados não recebem automaticamente a criptografia AES do SQLite.

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

Bancos criados por versões anteriores recebem automaticamente:

- as colunas de chave de recuperação e data de atualização da senha;
- as colunas do envelope criptografado;
- um marcador de verificação da chave AES;
- a migração transacional do conteúdo legado do diário.

Depois da migração, os campos operacionais antigos são substituídos por marcadores sem informação sensível. O conteúdo completo permanece acessível somente após autenticação criptográfica do envelope.

## Limitações

- o backend não funciona no GitHub Pages;
- sem a senha e sem uma chave de recuperação válida, não existe recuperação automática da conta;
- sem a chave AES correspondente, não é possível recuperar o conteúdo criptografado do diário;
- identificadores, vínculo com usuário, datas técnicas e quantidade de registros permanecem visíveis no SQLite;
- o arquivo de chave padrão fica próximo ao banco por conveniência; separá-lo com `SUZY_KEY_PATH` ou usar `SUZY_DATA_KEY` melhora o isolamento;
- a autenticação foi projetada para uso individual e local, não para exposição pública na internet;
- o módulo `node:sqlite` usado pelo Node.js 22 pode emitir aviso de recurso experimental;
- não existe sincronização pela internet ou entre computadores.
