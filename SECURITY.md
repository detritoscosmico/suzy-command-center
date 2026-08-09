# Política de Segurança

## Versões cobertas

O Suzy Command Center está em evolução ativa. Correções de segurança são destinadas à versão mais recente disponível no branch `main`; não existe suporte de longo prazo para versões anteriores.

## Como relatar uma vulnerabilidade

Não publique detalhes de exploração, chaves, dados pessoais ou provas de conceito sensíveis em uma issue pública.

1. Na página do repositório, abra **Security** > **Advisories** > **Report a vulnerability**, quando o reporte privado estiver disponível.
2. Se o recurso não estiver habilitado, contate o mantenedor pelo perfil do GitHub e solicite um canal privado antes de enviar os detalhes.
3. Informe a versão ou commit afetado, impacto observado, passos mínimos para reprodução e uma proposta de correção, se houver.

O objetivo de atendimento é confirmar o recebimento em até 7 dias e apresentar uma avaliação inicial em até 14 dias. Esses prazos são metas de manutenção, não um SLA contratual.

## Escopo prioritário

- autenticação, sessão, CSRF e limitação de tentativas do backend local;
- criptografia, chave AES, recuperação de conta e migração do SQLite;
- travessia de diretórios, exposição de arquivos e validação de payloads;
- importação e exportação de CSV ou JSON;
- dependências e workflows do GitHub Actions;
- vazamento de dados operacionais ou respostas comportamentais.

O GitHub Pages é uma demonstração estática: não recebe ordens reais, não mantém conta de corretora e não oferece feed oficial. Resultados financeiros, heurísticas educacionais e limitações já documentadas não são vulnerabilidades por si só.

## Pesquisa responsável

Faça testes apenas em dados e ambientes sob seu controle. Não acesse informações de terceiros, não interrompa serviços e não use engenharia social. Uma pesquisa de boa-fé, limitada e comunicada de forma privada será tratada de maneira colaborativa.

## Divulgação

Após a correção, o projeto poderá publicar um resumo do impacto e da mitigação sem revelar dados sensíveis. A data de divulgação será coordenada com quem reportou sempre que possível.
