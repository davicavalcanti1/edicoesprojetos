# Referência de Dados para Inserção Manual

Este documento serve como guia para preenchimento manual de campos no banco de dados, especialmente para migração ou seed.

## Ocorrências de Revisão de Laudo (tabela: `ocorrencia_laudo`)

### Campo: `triagem_nivel` (INTEGER)
Representa a classificação de risco definida na triagem. Se a ocorrência ainda não foi triada, deixe como `NULL`.

| Valor | Classificação | Descrição |
| :--- | :--- | :--- |
| **1** | Circunstância de Risco | Potencial de causar dano ou erro, mas nada ocorreu. |
| **2** | Near Miss | Incidente ocorreu mas não atingiu o paciente. |
| **3** | Incidente sem Dano | Atingiu o paciente mas não causou dano. |
| **4** | Evento Adverso | Incidente que resultou em dano ao paciente. |
| **5** | Evento Sentinela | Dano grave ou morte (Investigação obrigatória). |

### Campo: `status` (TEXT)
Estados comuns para Revisão de Laudo:
- `aguardando_envio`: Ocorrência criada, mas ainda não enviada ao médico pelo admin.
- `aguardando_medico`: Enviada ao médico, aguardando resposta.
- `aguardando_triagem`: Médico respondeu, aguardando triagem do admin.
- `em_triagem`: Admin começou a triagem.
- `em_analise`: Em análise detalhada.
- `concluida`: Finalizada.
- `improcedente`: Cancelada/Inválida.

### Campo: `desfecho_tipo` (TEXT)
Valores possíveis para o desfecho:
- `imediato_correcao`
- `orientacao`
- `treinamento`
- `alteracao_processo`
- `manutencao_corretiva`
- `notificacao_externa`
- `improcedente`
