
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://boxcrktauhjghutbrhep.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveGNya3RhdWhqZ2h1dGJyaGVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNTQ2NzksImV4cCI6MjA4NDgzMDY3OX0.0aHaa5ilDdVm8B-ovDJFbijiXba0KnCQ_LQKBAuExb4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyLaudoPersistence() {
    console.log('--- VERIFICAÇÃO DE PERSISTÊNCIA: REVISÃO DE LAUDO ---');

    // 1. Authenticate
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'davicavalcantiaraujo1@gmail.com',
        password: '1m4G0123'
    });

    if (authError) {
        console.error('CRITICAL: Login falhou', authError.message);
        return;
    }

    const userId = authData.user.id;
    const tenantId = authData.user.user_metadata.tenant_id || "d9e8df45-7767-425d-aa33-725340620108";

    // 2. Prepare Payload (Simulating exactly what the Hook sends now)
    const mockPaciente = {
        nome: "Maria das Dores Teste",
        cpf: "999.888.777-66",
        sexo: "Feminino",
        unidade: "Unidade Sul",
        dataNasc: "1980-05-20",
        telefone: "11999998888"
    };

    const payload = {
        tenant_id: tenantId,
        criado_por: userId,
        status: 'aguardando_envio',

        // Mapped Fields
        paciente_nome: mockPaciente.nome,
        paciente_cpf: mockPaciente.cpf,
        paciente_data_nascimento: mockPaciente.dataNasc,
        paciente_telefone: mockPaciente.telefone,

        exame_tipo: "Ressonância",
        exame_data: new Date().toISOString().split('T')[0],
        exame_unidade: mockPaciente.unidade,

        motivo_revisao: "Qualidade de Imagem",

        // THE FIX: Injecting extra data here
        dados_adicionais: {
            sexo: mockPaciente.sexo,
            unidade: mockPaciente.unidade,
            simulated_frontend: true
        }
    };

    console.log('Enviando Payload...');

    const { data: insertData, error: insertError } = await supabase
        .from('ocorrencia_laudo')
        .insert(payload)
        .select()
        .single();

    if (insertError) {
        console.error('FALHA AO INSERIR:', insertError);
        return;
    }

    console.log(`\nInserção SUCESSO. ID: ${insertData.id}`);
    console.log(`Protocolo Gerado: ${insertData.protocolo}`);

    // 3. Verify Fetch
    console.log('\nRecuperando o registro para validar dados...');

    const { data: fetchData, error: fetchError } = await supabase
        .from('ocorrencia_laudo')
        .select('*')
        .eq('id', insertData.id)
        .single();

    if (fetchError) {
        console.error('FALHA AO RECUPERAR:', fetchError);
        return;
    }

    // 4. Validate Fields
    console.log('\n--- VALIDAÇÃO DE CAMPOS ---');

    const checks = [
        { label: "Paciente Nome", expected: mockPaciente.nome, actual: fetchData.paciente_nome },
        { label: "Paciente CPF", expected: mockPaciente.cpf, actual: fetchData.paciente_cpf },
        { label: "Exame Unidade (Coluna)", expected: mockPaciente.unidade, actual: fetchData.exame_unidade },
        { label: "Sexo (JSON dados_adicionais)", expected: mockPaciente.sexo, actual: fetchData.dados_adicionais?.sexo },
        { label: "Unidade (JSON dados_adicionais)", expected: mockPaciente.unidade, actual: fetchData.dados_adicionais?.unidade }
    ];

    let allPass = true;
    checks.forEach(check => {
        const pass = check.expected === check.actual;
        console.log(`[${pass ? 'OK' : 'FALHA'}] ${check.label}: ${check.actual}`);
        if (!pass) allPass = false;
    });

    if (allPass) {
        console.log('\nCONCLUSÃO: O sistema está salvando CORRETAMENTE todas as informações.');
    } else {
        console.error('\nCONCLUSÃO: Há divergências nos dados salvos.');
    }
}

verifyLaudoPersistence();
