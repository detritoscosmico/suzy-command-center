# Alteração e recuperação segura da senha local

O Suzy Command Center usa uma conta individual no backend restrito a `127.0.0.1`. Como não existe serviço de e-mail ou servidor externo, a recuperação é feita por uma chave aleatória entregue ao usuário.

## Primeiro acesso

Ao criar a conta, o servidor:

1. valida o usuário e a senha;
2. deriva a senha com PBKDF2-HMAC-SHA256, salt aleatório e 310.000 iterações;
3. gera uma chave aleatória com prefixo `SUZY-`;
4. salva somente o hash SHA-256 da chave;
5. mostra a chave em texto uma única vez.

A chave deve ser copiada ou baixada e guardada fora da pasta do projeto.

## Gerar ou trocar a chave

Na página `login.html`, com sessão autenticada:

1. informe a senha atual;
2. selecione **Gerar ou trocar chave de recuperação**;
3. salve a nova chave exibida.

A chave anterior é invalidada imediatamente.

## Alterar a senha

A alteração exige:

- sessão autenticada;
- token CSRF válido;
- senha atual correta;
- nova senha entre 12 e 128 caracteres, contendo letra e número;
- nova senha diferente da atual.

Depois da alteração:

- todas as sessões anteriores são excluídas;
- uma nova sessão é criada;
- a chave de recuperação é rotacionada;
- a nova chave é exibida uma única vez.

## Recuperar uma conta

Na tela de login, selecione **Recuperar com chave** e informe:

- usuário;
- chave de recuperação vigente;
- nova senha.

Uma recuperação bem-sucedida invalida todas as sessões e a chave utilizada. O sistema entrega uma nova chave.

## Proteções

- chave gerada com 24 bytes aleatórios;
- somente o hash da chave fica no SQLite;
- comparação de hashes em tempo constante;
- limite de cinco tentativas por janela de 15 minutos;
- mensagens de erro não confirmam se o usuário ou a chave existem;
- troca autenticada exige senha atual e CSRF;
- troca ou recuperação invalida todas as sessões anteriores;
- cookie de sessão permanece `HttpOnly` e `SameSite=Strict`.

## Migração de contas existentes

Contas criadas antes deste recurso continuam válidas. Depois de entrar com a senha atual, gere uma chave na seção **Segurança da conta**.

## Limites

- não há recuperação por e-mail, SMS ou suporte remoto;
- sem a senha e sem uma chave válida, não existe recuperação automática;
- a chave não deve ser armazenada junto do arquivo SQLite;
- o banco local ainda não é criptografado em repouso;
- o recurso não funciona no GitHub Pages, pois a versão pública não executa backend.
