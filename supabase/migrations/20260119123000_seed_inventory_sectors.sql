-- Seed inventory sectors for all existing tenants
DO $$
DECLARE
    tenant_record RECORD;
    sector_name TEXT;
    sectors TEXT[] := ARRAY[
        'Serviços Gerais',
        'Recepção',
        'Entrega',
        'Enfermagem (RM)',
        'Enfermagem (TC)',
        'Salas USG',
        'Anexo',
        'Queimadas',
        'San Pietro'
    ];
BEGIN
    FOR tenant_record IN SELECT id FROM tenants LOOP
        FOREACH sector_name IN ARRAY sectors LOOP
            INSERT INTO inventory_sectors (tenant_id, name)
            VALUES (tenant_record.id, sector_name)
            ON CONFLICT DO NOTHING; -- Assuming there might be a unique constraint or just to be safe, though usually name+tenant_id isn't unique by default unless defined.
            -- If no unique constraint exists, this might duplicate if run multiple times. 
            -- Let's check for existence first to be idempotent.
            
            IF NOT EXISTS (
                SELECT 1 FROM inventory_sectors 
                WHERE tenant_id = tenant_record.id AND name = sector_name
            ) THEN
                INSERT INTO inventory_sectors (tenant_id, name)
                VALUES (tenant_record.id, sector_name);
            END IF;
        END LOOP;
    END LOOP;
END $$;
