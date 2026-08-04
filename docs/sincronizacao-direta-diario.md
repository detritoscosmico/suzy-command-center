# Sincronização direta do Diário Profissional

O Diário Profissional continua funcionando no GitHub Pages e quando aberto como página estática. Nesse modo, registros ativos, versões anteriores e lixeira permanecem somente no `localStorage` do navegador.

Quando o projeto é iniciado pelo backend local seguro, o diário detecta a API, verifica a sessão autenticada e oferece persistência completa no SQLite.

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

## Conteúdo sincronizado

A sincronização inclui:

- registros ativos;
- histórico de até 20 versões por operação;
- itens enviados para a lixeira;
- datas de exclusão;
- motivos e datas das revisões.

As estatísticas continuam utilizando somente os registros ativos.

## Compatibilidade com o banco existente

O esquema atual de `journal_entries` é preservado. O ciclo de vida é serializado em JSON, codificado em Base64 UTF-8 e dividido em registros internos reservados. Esses registros são gravados na mesma substituição transacional dos registros ativos.

O identificador reservado começa com:

```text
__suzy_lifecycle_v1__
```

O Diário e a página da conta removem esses registros internos antes de mostrar contagens, métricas ou backups para o usuário.

A sequência dos fragmentos é verificada antes da leitura. Se faltar uma parte ou o conteúdo não puder ser decodificado, a restauração e a sincronização automática são bloqueadas. Os registros ativos encontrados continuam preservados.

## Migração de bancos antigos

Bancos criados antes desta etapa possuem somente registros ativos.

A migração é automática apenas quando:

1. a sessão local está autenticada;
2. os registros ativos do navegador e do SQLite são idênticos;
3. não existe envelope de ciclo de vida no banco.

Nesse caso, versões e lixeira do navegador são acrescentadas sem apagar operações existentes.

Quando os registros ativos são diferentes, a interface exige que o usuário escolha explicitamente qual cópia deve prevalecer.

## Estados possíveis

### Somente navegador

O backend não está disponível. O diário continua funcional e salva no navegador.

### Login necessário

O servidor local está ativo, mas a sessão não foi autenticada.

### Dados aguardando envio

O navegador possui dados e o SQLite está vazio. O botão **Salvar no SQLite** cria a cópia persistente completa.

### Backup completo disponível

O SQLite possui dados e o navegador está vazio. O botão **Restaurar do SQLite** recupera registros ativos, versões e lixeira.

### Versões diferentes

As duas cópias são diferentes. Nenhuma delas é substituída automaticamente. O usuário escolhe explicitamente:

- **Salvar no SQLite:** o estado completo do navegador prevalece;
- **Restaurar do SQLite:** o estado completo persistido prevalece.

A interface exige confirmação quando a operação substituir dados existentes.

### Sincronização completa ativa

Depois que as cópias ficam iguais, novos registros, edições, revisões, exclusões, restaurações e limpezas são enviados automaticamente ao SQLite. A cópia no navegador continua sendo mantida para permitir uso local e recuperação imediata da interface.

### Metadados inconsistentes

O envelope está incompleto, fora de ordem ou não pode ser decodificado. A restauração automática fica bloqueada e a interface informa o problema. Nenhum dado é substituído silenciosamente.

## Backup pela página de conta

`login.html` importa e exporta backups JSON completos no formato:

```json
{
  "version": 2,
  "exportedAt": "2026-08-04T12:00:00.000Z",
  "entries": [],
  "trash": [],
  "history": {}
}
```

Backups antigos contendo apenas uma lista ou o campo `entries` continuam aceitos. Nesse caso, versões e lixeira são consideradas vazias.

## Segurança

- o cookie de sessão permanece `HttpOnly` e não é lido pelo JavaScript;
- o token CSRF é mantido apenas em memória durante a página aberta;
- as chamadas usam mesma origem e não habilitam CORS externo;
- o servidor continua restrito a `127.0.0.1`;
- conflitos não são resolvidos silenciosamente;
- o payload permanece limitado a 2 MB e 10.000 registros;
- o envelope possui limite conservador de 350.000 caracteres codificados;
- todos os registros, inclusive os fragmentos internos, passam pela validação do servidor antes da gravação;
- a codificação Base64 evita perda de espaços e caracteres Unicode durante a normalização textual;
- o teste de integração reinicia o servidor e confirma a recuperação do ciclo de vida pelo SQLite.

## Limitações

- não existe sincronização entre computadores pela internet;
- o servidor local precisa estar ligado;
- o banco não é criptografado em repouso;
- o envelope interno aumenta a quantidade física de linhas no SQLite, embora essas linhas não sejam operações;
- backups muito grandes podem atingir o limite da API;
- o GitHub Pages não possui acesso ao SQLite local.
