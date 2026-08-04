# Criptografia em repouso do SQLite

O modo local do Suzy Command Center protege o conteúdo do Diário Profissional com criptografia autenticada na camada da aplicação.

## Escopo

Os campos operacionais do diário são serializados em JSON e gravados em um envelope **AES-256-GCM** antes de chegar ao SQLite. Isso inclui:

- data e hora da operação;
- ativo, mercado, sessão e timeframe;
- direção, setup e resultado em `R`;
- aderência ao plano e qualidade da execução;
- emoções, erro de processo, contexto e lição;
- registros internos usados para versões anteriores e lixeira.

O identificador interno, o usuário proprietário, as datas técnicas de criação/atualização e a quantidade de linhas continuam visíveis no banco. As tabelas de autenticação armazenam hashes e metadados, não senhas em texto puro.

Esta implementação não usa SQLCipher e não criptografa cada página física do arquivo SQLite. A proteção é aplicada ao conteúdo sensível do diário antes da persistência.

## Chave padrão

Sem configuração adicional, o servidor cria automaticamente uma chave aleatória de 32 bytes em:

```text
data/suzy-local.sqlite3.key
```

O arquivo recebe permissão `0600` em sistemas compatíveis com permissões POSIX. O banco e a chave são ignorados pelo Git.

Para restaurar um backup criptografado, preserve também a chave correspondente. Guarde o banco e a chave em locais separados sempre que possível.

## Usar chave fornecida pelo ambiente

Gere uma chave Base64URL de 32 bytes:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Linux ou macOS:

```bash
SUZY_DATA_KEY="COLE_A_CHAVE_AQUI" npm run serve:secure
```

PowerShell:

```powershell
$env:SUZY_DATA_KEY="COLE_A_CHAVE_AQUI"
npm run serve:secure
```

A chave deve possuir exatamente 43 caracteres Base64URL, correspondentes a 32 bytes. Ela não é gravada no SQLite.

## Usar arquivo de chave em outro local

Linux ou macOS:

```bash
SUZY_KEY_PATH="$HOME/.suzy-command-center/master.key" npm run serve:secure
```

PowerShell:

```powershell
$env:SUZY_KEY_PATH="$HOME\.suzy-command-center\master.key"
npm run serve:secure
```

Quando o arquivo ainda não existe, ele é criado automaticamente.

## Migração automática

Ao abrir um banco criado por versões anteriores, o servidor:

1. adiciona as colunas de envelope criptografado;
2. lê cada registro legado dentro de uma transação;
3. criptografa o conteúdo com AES-256-GCM;
4. substitui os campos antigos por marcadores sem conteúdo sensível;
5. mantém o identificador e o vínculo com o usuário;
6. confirma a transação somente após processar todas as linhas.

Se ocorrer erro, a transação é revertida e os dados legados permanecem disponíveis para nova tentativa com a chave correta.

## Integridade e chave incorreta

Cada envelope possui:

- versão do formato;
- vetor de inicialização aleatório de 96 bits;
- tag de autenticação GCM de 128 bits;
- dados associados ao usuário, identificador e versão do registro.

Alterações no conteúdo, troca do identificador ou uso de outra chave fazem a autenticação falhar. O banco também mantém um marcador criptografado de verificação. Quando a chave não corresponde, o servidor interrompe a abertura em vez de devolver dados corrompidos.

## Backups

Um backup funcional do modo local criptografado precisa incluir:

```text
data/suzy-local.sqlite3
data/suzy-local.sqlite3-wal   # somente se existir durante a cópia
data/suzy-local.sqlite3-shm   # somente se existir durante a cópia
data/suzy-local.sqlite3.key   # quando a chave padrão é usada
```

A forma mais segura é encerrar o servidor antes de copiar o banco. A chave deve ser armazenada separadamente do arquivo SQLite.

Backups JSON e CSV exportados pela interface não recebem automaticamente esta criptografia. Proteja esses arquivos com o mecanismo de criptografia do sistema operacional ou de um cofre confiável.

## Limites do modelo de ameaça

A proteção reduz a exposição quando alguém obtém apenas uma cópia do SQLite. Ela não protege contra:

- malware ou usuário com acesso simultâneo ao banco e à chave;
- computador desbloqueado com o servidor em execução;
- leitura dos dados já descriptografados pela sessão autenticada;
- dados salvos no `localStorage` da versão estática;
- backups JSON ou CSV exportados sem proteção externa;
- perda definitiva da chave.

A chave de recuperação da conta e a chave de criptografia do banco têm funções diferentes. A chave de recuperação redefine a senha; ela não substitui a chave AES do SQLite.
