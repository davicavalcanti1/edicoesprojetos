-- Corrige a Sequence/Geração de Protocolo
-- O problema é que inserts manuais podem ter criado protocolos que a função não "enxerga" se ela apenas contar linhas ou usar MAX de forma simples sem lock, 
-- OU se os inserts manuais usaram um formato que colide.

-- Atualizar a função para garantir unicidade baseada no maior valor existente
CREATE OR REPLACE FUNCTION public.generate_protocol()
RETURNS TRIGGER AS $$
DECLARE
    date_part TEXT;
    sequence_part INTEGER;
    new_protocol TEXT;
    retries INTEGER := 0;
BEGIN
    date_part := to_char(NOW(), 'YYYYMMDD');
    
    LOOP
        -- Encontrar o MAX atual para o dia
        SELECT COALESCE(MAX(CAST(SUBSTRING(protocolo FROM 13) AS INTEGER)), 0) + 1 + retries
        INTO sequence_part
        FROM public.ocorrencia_laudo
        WHERE substring(protocolo from 4 for 8) = date_part; -- REVISAO: O formato original era REV-YYYYMMDD-SEQ?
        
        -- Verificar formato. 20260128000001_laudo_base.sql define:
        -- NEW.protocolo := 'REV-' || date_part || '-' || lpad(sequence_part::text, 3, '0');
        -- Porem, seus inserts manuais usaram 'IMAGO-20260115-0001' ou '2026000005'.
        -- Se houver mix de formatos, o MAX falha.
        
        -- Vamos forçar o formato padrão REV-YYYYMMDD-SEQ para novos, 
        -- e garantir que não existe colisão.
        
        new_protocol := 'REV-' || date_part || '-' || lpad(sequence_part::text, 3, '0');
        
        IF NOT EXISTS (SELECT 1 FROM public.ocorrencia_laudo WHERE protocolo = new_protocol) THEN
            NEW.protocolo := new_protocol;
            EXIT; -- Sucesso
        END IF;
        
        retries := retries + 1;
        IF retries > 10 THEN
            RAISE EXCEPTION 'Não foi possível gerar um protocolo único após 10 tentativas';
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
