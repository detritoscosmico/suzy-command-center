# Governança e revisão do processo

O Ciclo 5 transforma o playbook do Programa Profissional em um documento versionado. A finalidade é preservar contexto de decisão e impedir alterações silenciosas ou justificadas apenas pelo resultado mais recente.

## Regra de versionamento

- a primeira revisão válida cria a linha de base `v1`;
- toda versão exige um motivo com pelo menos 20 caracteres;
- versão nova só existe quando ao menos um campo do playbook muda;
- o snapshot recebe um fingerprint FNV-1a reproduzível do conteúdo normalizado;
- o histórico mantém até 50 snapshots locais e não oferece edição retroativa;
- depois da linha de base, o formulário do Programa Profissional bloqueia sobrescritas e direciona mudanças para a Governança.

Os limites conservadores do playbook permanecem os mesmos: risco por operação entre 0,10% e 2%, stop diário entre 0,50R e 5R, uma a dez operações e reconhecimento explícito de incerteza.

## Comparação entre versões

O diff exibe somente os campos que mudaram, com valor anterior e posterior. Não existe classificação baseada em lucro, taxa de acerto ou comportamento futuro do mercado. Uma mudança documentada não é automaticamente uma melhoria.

## Revisão periódica

A mesa lê os registros locais do Diário Profissional e resume apenas:

- tamanho da amostra;
- aderência ao plano;
- qualidade média de execução;
- tipos de erro mais frequentes;
- contexto de mercado e sessão.

Resultado em R, P/L, winrate e direção são deliberadamente excluídos do comparador. Variações entre períodos são descritivas: não demonstram causalidade e não devem ser convertidas em sinal operacional.

## Privacidade e exportação

Versões e motivos ficam em `localStorage` sob `suzy-governance-v1`. O usuário pode exportar a trilha em JSON. Não há envio automático a mentor, corretora, servidor externo ou serviço de análise.

## Validação

- testes unitários de fingerprint, versionamento, motivo obrigatório e comparação;
- teste que prova que P/L não altera o resumo de processo;
- fluxos E2E de linha de base, segunda versão e revisão periódica;
- auditoria de acessibilidade da página pública.
