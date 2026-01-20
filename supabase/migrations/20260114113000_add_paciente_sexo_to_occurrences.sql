-- Adiciona a coluna paciente_sexo à tabela occurrences
-- Esta coluna permite armazenar o sexo do paciente (Masculino/Feminino)

ALTER TABLE public.occurrences 
ADD COLUMN IF NOT EXISTS paciente_sexo TEXT;

-- Comentário opcional para documentação diretamente no banco
COMMENT ON COLUMN public.occurrences.paciente_sexo IS 'Sexo do paciente (Masculino ou Feminino)';
