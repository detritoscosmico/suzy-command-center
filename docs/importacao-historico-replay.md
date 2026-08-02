# Importação de históricos no replay

O laboratório aceita arquivos CSV obtidos de fontes que o usuário tenha autorização para utilizar.

## Limites

- tamanho máximo: 2 MB;
- até 5.000 linhas processadas;
- mínimo de 30 candles válidos;
- apenas um arquivo por importação;
- processamento totalmente local no navegador.

## Colunas obrigatórias

```text
time,open,high,low,close
```

Também são reconhecidos cabeçalhos em português:

```text
data,abertura,máxima,mínima,fechamento
```

## Formatos de data aceitos

- ISO 8601: `2026-08-02T14:30:00Z`;
- timestamp Unix em segundos;
- timestamp Unix em milissegundos;
- formato brasileiro: `02/08/2026 14:30:00`.

## Separadores aceitos

- vírgula;
- ponto e vírgula;
- tabulação.

Números com vírgula decimal são aceitos quando o arquivo usa ponto e vírgula como separador.

## Validações

Antes de iniciar a sessão, o sistema verifica:

- presença de todas as colunas obrigatórias;
- timestamp válido;
- preços numéricos e positivos;
- máxima maior ou igual a abertura e fechamento;
- mínima menor ou igual a abertura e fechamento;
- remoção de timestamps duplicados;
- ordenação cronológica dos candles;
- quantidade mínima de dados.

Linhas inválidas são descartadas. Se a amostra restante tiver menos de 30 candles, a importação é bloqueada.

## Modelo

Dentro de `replay.html`, use o botão **Baixar modelo CSV**.

## Aviso

A importação não torna o projeto uma plataforma de execução, não conecta com corretoras e não valida direitos de uso sobre o arquivo. O usuário é responsável por utilizar apenas dados obtidos de fonte autorizada.
