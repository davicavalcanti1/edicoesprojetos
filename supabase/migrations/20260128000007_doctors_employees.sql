
-- Tabela de Médicos
CREATE TABLE public.doctors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    crm TEXT, -- Opcional
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read doctors" ON public.doctors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert doctors" ON public.doctors FOR INSERT TO authenticated WITH CHECK (true); -- Permitir inserts se necessário

-- Seed Doctors
INSERT INTO public.doctors (nome) VALUES
('Dr. André Ventura da Nóbrega'),
('Dr. Arquimedes Aires Braga de Lira'),
('Dr. Arthur José Ventura da Nóbrega'),
('Dr. Davi Cavalcanti'),
('Dr. Diego Furtado F. Cândido'),
('Dr. Diogo Araújo'),
('Dr. Ednaldo Marques Bezerra Filho'),
('Dr. Félix Soares Nóbrega'),
('Dr. Filipe Anderson de Souza Florentino'),
('Dr. Heráclio Almeida da Costa'),
('Dr. Heverton Leal Ernesto de Amorim'),
('Dr. Igor Silveira de Castro Guerreiro Gondim'),
('Dr. Janniê de Miranda Araújo'),
('Dr. José Célio Couto'),
('Dr. José Roberto Maia Júnior'),
('Dr. Mario Henrique de Melo Carneiro'),
('Dr. Péricles Almeida da Costa'),
('Dr. Rafael Borges Tavares Cavalcanti'),
('Dr. Raiff Ramalho Cavalcanti'),
('Dr. Ramoniê de Miranda Araújo'),
('Dr. Rennah Gonçalves dos Santos'),
('Dr. Rodolfo Nunes'),
('Dr. Saulo Nóbrega'),
('Dr. Ygor W. Felipe Barbosa'),
('Dra. Adriana Susanne Jalcira Jeunon'),
('Dra. Cinthia Milena Veiga de Oliveira Marques'),
('Dra. Fernanda Borges Tavares Cavalcanti'),
('Dra. Larissa Mendonça de Souza'),
('Dra. Larissa Nóbrega Leal de Amorim'),
('Dra. Mariana Lellis de Macedo'),
('Dra. Míriam Maria Barbosa Albino'),
('Dra. Priscila Borba'),
('Dra. Rafaella Tiburtino');

-- Tabela de Funcionários
CREATE TABLE public.employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    cargo TEXT, -- 'tecnico', 'enfermeiro', 'coordenador', etc.
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read employees" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert employees" ON public.employees FOR INSERT TO authenticated WITH CHECK (true);

-- Seed Employees (Exemplos genéricos, já que não tenho a lista)
INSERT INTO public.employees (nome, cargo) VALUES
('Funcionário Técnico 1', 'tecnico'),
('Funcionário Técnico 2', 'tecnico'),
('Enfermeiro(a) 1', 'enfermeiro'),
('Coordenador(a) 1', 'coordenador');
