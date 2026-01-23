# Guia de Integração n8n - Ocorrências via WhatsApp

Este guia descreve como configurar o n8n para registrar ocorrências de **Revisão de Laudo** vindas do WhatsApp diretamente no Supabase do sistema Ocorrências Imago.

## 1. Atualização do Banco de Dados
Primeiro, é necessário criar a coluna `origin` na tabela `occurrences` para identificar a origem das ocorrências.
Foi criado um arquivo de migração em `supabase/migrations/20260123000000_add_origin_to_occurrences.sql`.

Execute este comando SQL no seu SQL Editor do Supabase dashboard:
```sql
ALTER TABLE public.occurrences
ADD COLUMN IF NOT EXISTS origin text DEFAULT 'web';
```

## 2. Configuração no n8n

No seu fluxo do n8n, adicione um nó **Supabase** após receber e processar a mensagem do WhatsApp.

### Passo 1: Configurar Credenciais
- Configure suas credenciais do Supabase (URL e Service Role Key ou Anon Key com permissão).
- **Recomendação:** Use a **Service Role Key** para garantir que a automação possa escrever sem restrições de RLS (Row Level Security), já que o "usuário" do WhatsApp não é um usuário logado padrão.

### Passo 2: Configurar Operação
- **Resource:** Database
- **Operation:** Insert
- **Table:** `occurrences`

### Passo 3: Mapeamento de Campos
Você precisa preencher os campos obrigatórios da tabela. Abaixo estão os valores sugeridos:

| Campo do Banco (Supabase) | Valor / Expressão no n8n | Descrição |
|---------------------------|--------------------------|-----------|
| `tenant_id` | `UUID_DO_TENANT` | ID da clínica (ex: consulte a tabela `tenants` ou copie de uma ocorrência existente) |
| `criado_por` | `UUID_DO_USUARIO_BOT` | ID de um usuário "Sistema" ou seu próprio ID de admin. É obrigatório. |
| `tipo` | `'revisao_exame'` | Tipo fixo para esta automação. |
| `subtipo` | `'revisao_exame'` | Subtipo fixo. |
| `status` | `'registrada'` | Status inicial. |
| `origin` | `'whatsapp'` | **Importante:** Define que veio do WhatsApp. |
| `descricao_detalhada` | `{{ $json.message_body }}` | O texto da mensagem do WhatsApp. |
| `paciente_nome_completo` | `{{ $json.patient_name }}` | Extraído do fluxo anterior (se houver). |
| `paciente_telefone` | `{{ $json.sender_phone }}` | Telefone do remetente. |
| `dados_especificos` | *Ver JSON abaixo* | JSON com dados específicos de revisão. |

#### Exemplo de JSON para `dados_especificos`:
Para criar uma ocorrência de revisão válida, o campo `dados_especificos` deve ser um JSON válido. No n8n, você pode construir esse objeto ou passar como string JSON.

```json
{
  "exameModalidade": "Não informado",
  "exameRegiao": "Extraído da conversa",
  "exameData": "{{ new Date().toISOString() }}",
  "motivoRevisao": "outro",
  "motivoOutro": "Solicitado via WhatsApp",
  "laudoEntregue": true,
  "tipoDiscrepancia": [],
  "acaoTomada": [],
  "pessoasComunicadas": []
}
```

### Observação sobre `protocolo`:
A tabela gera o protocolo automaticamente?
Verifique a função `generate_protocol_number`. Ela **não** é um trigger automático na inserção (geralmente é chamada pela aplicação).
**Solução:**
No n8n, antes de inserir, você pode chamar a função RPC `generate_protocol_number` ou gerar um protocolo provisório e deixar a trigger (se houver) corrigir.
*Se não houver trigger*, você deve chamar a função via Supabase Node (Call Postgres Function) -> `generate_protocol_number` passando o `tenant_id`, e usar o resultado no Insert.

**Alternativa Simples:**
Se não quiser complicar chamando função, insira um protocolo temporário como `WAPP-{Date.now()}` e ajuste depois, mas o ideal é chamar a procedure.

## 3. Upload de Anexos (PDF/Imagens)
Se o fluxo do WhatsApp receber mídia:
1. Faça upload do arquivo para o Bucket `occurrence-attachments` via n8n (Supabase Storage > Upload).
2. Insira o registro na tabela `occurrence_attachments` vinculando ao ID da ocorrência criada acima.

## 4. Visualização
Após inserir com `origin: 'whatsapp'`, a ocorrência aparecerá na lista de "Revisão de Exame" com um ícone de WhatsApp verde ao lado do protocolo.
