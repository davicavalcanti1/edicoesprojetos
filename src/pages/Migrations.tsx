import { useState } from "react";
import { ArrowLeft, Copy, Check, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const SQL_SCHEMA = `
-- 1. Tabela de Sequência para Protocolos Diários
CREATE TABLE IF NOT EXISTS protocol_sequences (
    date_key DATE PRIMARY KEY DEFAULT CURRENT_DATE,
    current_val INTEGER DEFAULT 0
);

-- 2. Função para Gerar Protocolo Único (YYYYMMDD-XXXXXX)
CREATE OR REPLACE FUNCTION generate_daily_protocol()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    today DATE := CURRENT_DATE;
    seq_val INTEGER;
    formatted_date TEXT;
BEGIN
    -- Formata data YYYYMMDD
    formatted_date := to_char(today, 'YYYYMMDD');
    
    -- Insere ou Atualiza a sequência de forma atômica
    INSERT INTO protocol_sequences (date_key, current_val)
    VALUES (today, 1)
    ON CONFLICT (date_key)
    DO UPDATE SET current_val = protocol_sequences.current_val + 1
    RETURNING current_val INTO seq_val;
    
    -- Retorna formatado: 20240125-000001
    RETURN formatted_date || '-' || LPAD(seq_val::TEXT, 6, '0');
END;
$$;

-- 3. Tabela de Manutenções (Unificada para Ar-Condicionado e Terceirizados)
-- Justificativa: Facilita queries de custos globais e histórico por local, evitando joins complexos.
CREATE TABLE IF NOT EXISTS maintenance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Campos de Classificação
    tipo_origem TEXT NOT NULL, -- 'ar_condicionado', 'banheiro_ralo', etc
    subtipo TEXT, -- 'imago', 'terceirizado', 'dreno', 'limpeza_ralo'
    
    -- Identificação Local/Equipamento
    localizacao TEXT,
    sala TEXT,
    numero_serie TEXT,
    modelo TEXT,
    
    -- Execução
    responsavel TEXT NOT NULL, -- Nome do funcionário/técnico
    empresa TEXT, -- Se terceirizado
    data_manutencao DATE NOT NULL,
    
    -- Detalhes
    descricao TEXT,
    tipo_manutencao TEXT, -- 'preventiva', 'corretiva', etc
    observacoes TEXT,
    
    -- Ar Condicionado Específicos
    tem_defeito BOOLEAN DEFAULT FALSE,
    defeito_descricao TEXT,
    
    -- Financeiro
    custo NUMERIC(10,2),
    proxima_manutencao DATE,
    
    -- Mídia (URLs das fotos no Storage)
    fotos JSONB DEFAULT '[]'::JSONB 
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON maintenance_records(data_manutencao);
CREATE INDEX IF NOT EXISTS idx_maintenance_serial ON maintenance_records(numero_serie);
CREATE INDEX IF NOT EXISTS idx_maintenance_type ON maintenance_records(tipo_origem);

-- 4. Ajustes na tabela occurrences (Tickets/Chamados) se necessário
-- Garantir que temos colunas para o fluxo de finalização
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS finalizado_por TEXT;
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS finalizado_em TIMESTAMPTZ;
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS acao_imediata TEXT; 
-- Protocolo já deve existir, se não:
-- ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS protocolo TEXT UNIQUE;

-- Configurar RLS (Exemplos)
-- ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Public read access" ON maintenance_records FOR SELECT USING (true);
-- CREATE POLICY "Public insert access" ON maintenance_records FOR INSERT WITH CHECK (true);
`;

const Migrations = () => {
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(SQL_SCHEMA);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <MainLayout>
            <div className="mx-auto max-w-4xl p-4 animate-in fade-in zoom-in duration-300">
                <Button
                    variant="ghost"
                    className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
                    onClick={() => navigate("/configuracoes")}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                </Button>

                <Card className="border-l-4 border-l-blue-600 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-blue-600" />
                            Instruções de Banco de Dados (SQL)
                        </CardTitle>
                        <CardDescription>
                            Execute o script abaixo no Editor SQL do seu projeto Supabase para criar as tabelas e funções necessárias para os novos formulários.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-slate-950 rounded-lg p-4 relative font-mono text-sm text-slate-50 overflow-auto max-h-[600px] border border-slate-700 shadow-inner">
                            <Button
                                size="sm"
                                variant="secondary"
                                className="absolute top-4 right-4 bg-slate-800 text-white hover:bg-slate-700 border-slate-600"
                                onClick={handleCopy}
                            >
                                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                                {copied ? "Copiado!" : "Copiar SQL"}
                            </Button>
                            <pre className="whitespace-pre-wrap">{SQL_SCHEMA}</pre>
                        </div>

                        <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-900">
                            <h3 className="font-bold mb-2">Próximos Passos:</h3>
                            <ol className="list-decimal list-inside space-y-1 text-sm">
                                <li>Copie o código SQL acima.</li>
                                <li>Acesse o painel do Supabase do seu projeto.</li>
                                <li>Vá até a aba <strong>SQL Editor</strong>.</li>
                                <li>Cole o código e clique em <strong>Run</strong>.</li>
                                <li>Verifique se as tabelas <code>maintenance_records</code> e <code>protocol_sequences</code> foram criadas.</li>
                                <li>Verifique se a função <code>generate_daily_protocol</code> foi criada.</li>
                            </ol>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
};

export default Migrations;
