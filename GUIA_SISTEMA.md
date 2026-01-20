# Documentação do Sistema - Ocorrências Imago

Este documento fornece uma visão técnica e operacional completa do sistema de Gestão de Ocorrências da Imago Radiologia.

## 1. Visão Geral
O sistema é uma plataforma multi-tenant projetada para o registro, triagem e resolução de ocorrências (assistenciais, administrativas e técnicas). Ele permite o monitoramento do ciclo de vida completo de um incidente, desde o registro inicial até a análise médica, geração de planos de ação (CAPA) e exportação de relatórios em PDF.

## 2. Arquitetura Técnica

### Frontend
- **Framework**: React com Vite.
- **Linguagem**: TypeScript.
- **Estilização**: Tailwind CSS + ShadcnUI (Design System).
- **Gerenciamento de Estado/Dados**: TanStack Query (React Query) para sincronização com o backend.
- **Roteamento**: React Router DOM.

### Backend (BaaS)
- **Supabase**: 
  - **Database**: PostgreSQL com RLS (Row Level Security) habilitado.
  - **Autenticação**: Supabase Auth (Gerenciamento de usuários e convites).
  - **Storage**: Armazenamento de anexos e PDFs gerados.
  - **Edge Functions**: Funções serverless (Deno) para tarefas complexas como envio de convites via Resend.

### Integrações Externas
- **Resend**: Serviço de disparo de e-mails transacionais.
- **n8n (Webhooks)**: Automação de notificações para o WhatsApp da coordenação.
- **QR Server**: API para geração dinâmica de QR Codes incluídos nos PDFs.

---

## 3. Fluxo de Trabalho (Workflow)

### 3.1. Tipos de Ocorrência
1. **Assistencial**: Relacionada ao cuidado direto ao paciente (ex: erro de identificação, quedas).
2. **Administrativa**: Problemas de fluxo interno (ex: faturamento, recepção).
3. **Técnica**: Problemas com infraestrutura ou equipamentos (ex: falha em software, manutenção predial).

### 3.2. Estados da Ocorrência (Status)
- `registrada`: Estado inicial após o envio do formulário.
- `em_triagem`: Sendo avaliada pela coordenação.
- `em_analise`: Encaminhada para um médico ou responsável técnico.
- `acao_em_andamento`: Quando um plano de ação (CAPA) foi iniciado.
- `concluida`: Ocorrência finalizada e arquivada.
- `improcedente`: Ocorrências descartadas após análise.

### 3.3. Fluxo do Médico (Revisão de Laudo)
Para o subtipo `revisao_exame`, o sistema possui um fluxo especial:
1. **Link Público**: O médico recebe um link de acesso direto sem necessidade de login.
2. **Primeira Resposta**: O médico envia sua análise inicial e o sistema notifica a coordenação via webhook.
3. **Interações**: O médico pode atualizar sua análise ou clicar em "Laudo Mantido" (finalização rápida).
4. **Fechamento**: A coordenação é notificada em tempo real para cada atualização.

---

## 4. Estrutura de Dados Principal

- `tenants`: Configurações globais de cada unidade/cliente.
- `profiles`: Dados estendidos dos usuários (nome, avatar, vínculo com tenant).
- `occurrences`: Tabela central contendo dados do paciente, descrição, protocolo e status.
- `occurrence_attachments`: Referências para arquivos em anexo (fotos, documentos).
- `occurrence_capas`: Planos de ação corretiva e preventiva vinculados a ocorrências específicas.

---

## 5. Funcionalidades Especiais

### Geração de PDF (Branding Imago)
O sistema gera relatórios profissionais dinamicamente utilizando a biblioteca `jspdf`.
- **Cabeçalho/Rodapé**: Logotipo Imago e dados institucionais.
- **QR Code**: Cada PDF contém um QR Code que leva diretamente à pasta de anexos digitais da ocorrência.
- **Segurança**: O download do PDF final só é habilitado para ocorrências no status `concluida`.

### Gestão de Usuários
- **Convites**: Administradores convidam novos usuários via e-mail.
- **RBAC**: Permissões baseadas em papéis (`admin` vs `user`).
- **Segurança**: Políticas de RLS no PostgreSQL garantem que um usuário só veja dados pertencentes ao seu `tenant_id`.

---

## 6. Configurações de Ambiente (Variáveis)

As seguintes variáveis são essenciais para o funcionamento do sistema:

| Variável | Descrição |
| :--- | :--- |
| `VITE_SUPABASE_URL` | URL do projeto Supabase. |
| `VITE_SUPABASE_ANON_KEY` | Chave pública para acesso autenticado. |
| `RESEND_API_KEY` | Chave secreta para disparo de e-mails (usada na Edge Function). |
| `SITE_URL` | URL base do sistema (para links de convite). |
| `WEBHOOK_ENVIO` | Endpoint do n8n para notificações de WhatsApp. |

---

## 7. Manutenção e Comandos Comuns

- **Rodar Localmente**: `npm run dev`
- **Deploy de Edge Functions**: `supabase functions deploy [nome-da-funcao]`
- **Migrações de Banco**: Localizadas em `/supabase/migrations`. Devem ser aplicadas via Supabase Dashboard ou CLI.

---
© 2026 Imago Radiologia - Todos os direitos reservados.
