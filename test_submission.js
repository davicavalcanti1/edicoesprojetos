
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://boxcrktauhjghutbrhep.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveGNya3RhdWhqZ2h1dGJyaGVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNTQ2NzksImV4cCI6MjA4NDgzMDY3OX0.0aHaa5ilDdVm8B-ovDJFbijiXba0KnCQ_LQKBAuExb4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function format(date) {
    return date.toISOString().split('T')[0];
}

async function testOccurrences() {
    console.log('--- EXECUTANDO TESTES AO VIVO ---');

    console.log('1. Autenticando...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'davicavalcantiaraujo1@gmail.com',
        password: '1m4G0123'
    });

    if (authError) {
        console.error('ALERTA DE ERRO: Falha no login:', authError.message);
        return;
    }

    const userId = authData.user.id;
    const tenantId = authData.user.user_metadata.tenant_id || "d9e8df45-7767-425d-aa33-725340620108"; // Fallback from logs if missing
    console.log(`Login Sucesso. UserID: ${userId}`);

    // --- TESTE ADMINISTRATIVO ---
    console.log('\n2. Testando Ocorrência ADMINISTRATIVA...');
    try {
        const payloadAdm = {
            tenant_id: tenantId,
            tipo: "Administrativa",
            subtipo: "Teste Automatizado",
            descricao_detalhada: "Teste de persistencia ADM via script",
            criado_por: userId,
            titulo: `Administrativa - Teste Script`,
            dados_adicionais: {
                employee_name: "Funcionario Teste",
                occurrence_date: new Date().toISOString().split('T')[0],
                attachments_info: []
            }
        };

        const { data: admData, error: admError } = await supabase
            .from('ocorrencia_adm')
            .insert(payloadAdm)
            .select()
            .single();

        if (admError) {
            console.error('ERRO (ADM):', admError);
        } else {
            console.log('SUCESSO (ADM): Ocorrencia criada. Protocolo:', admData.protocolo);
        }
    } catch (e) {
        console.error('EXCECAO (ADM):', e);
    }

    // --- TESTE ENFERMAGEM ---
    console.log('\n3. Testando Ocorrência ENFERMAGEM (Extravasamento)...');
    try {
        const payloadEnf = {
            tenant_id: tenantId,
            criado_por: userId,
            tipo_incidente: "extravasamento_enfermagem",
            descricao_detalhada: "Teste extravasamento script",

            // Dados Paciente
            paciente_nome: "Paciente Teste Script",
            paciente_cpf: "123.456.789-00",
            paciente_unidade_local: "Unidade Teste",
            paciente_data_hora_evento: new Date().toISOString(),

            // Campos Especificos
            conduta: "Conduta realizada com sucesso",
            status: "registrada"
        };

        const { data: enfData, error: enfError } = await supabase
            .from('ocorrencia_enf')
            .insert(payloadEnf)
            .select()
            .single();

        if (enfError) {
            console.error('ERRO (ENF):', enfError);
        } else {
            console.log('SUCESSO (ENF): Ocorrencia criada. Protocolo:', enfData.protocolo);
        }
    } catch (e) {
        console.error('EXCECAO (ENF):', e);
    }

    // --- TESTE LAUDO ---
    console.log('\n4. Testando Ocorrência LAUDO...');
    try {
        const payloadLaudo = {
            tenant_id: tenantId,
            criado_por: userId,
            status: 'aguardando_envio',

            paciente_nome: "Paciente Laudo Teste",
            paciente_cpf: "111.222.333-44",
            paciente_data_nascimento: "1990-01-01",
            paciente_telefone: "(11) 99999-9999",

            exame_tipo: "TC",
            exame_data: new Date().toISOString().split('T')[0],
            exame_unidade: "Unidade Central",

            motivo_revisao: "Divergencia",
            tipo_discrepancia: "Erro grave",

            dados_adicionais: {
                unidade: "Unidade Central",
                sexo: "Masculino"
            }
        };

        const { data: laudoData, error: laudoError } = await supabase
            .from('ocorrencia_laudo')
            .insert(payloadLaudo)
            .select()
            .single();

        if (laudoError) {
            console.error('ERRO (LAUDO):', laudoError);
        } else {
            console.log('SUCESSO (LAUDO): Ocorrencia criada. Protocolo:', laudoData.protocolo);
        }
    } catch (e) {
        console.error('EXCECAO (LAUDO):', e);
    }
}

testOccurrences();
